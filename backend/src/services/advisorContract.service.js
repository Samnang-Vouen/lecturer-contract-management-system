import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import {
  AdvisorContract,
  LecturerProfile,
  Role,
  User,
  UserRole,
} from '../model/index.js';
import sequelize from '../config/db.js';
import {
  HTTP_STATUS,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from '../config/constants.js';
import { getNotificationSocket } from '../socket/index.js';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';

const ADVISOR_CONTRACT_ALLOWED_STATUSES = new Set([
  'DRAFT',
  'WAITING_MANAGEMENT',
  'REQUEST_REDO',
  'COMPLETED',
  'CONTRACT_ENDED',
]);

function wrapUnexpectedError(error, fallbackMessage) {
  if (error instanceof AppError) return error;
  return new AppError(fallbackMessage, HTTP_STATUS.SERVER_ERROR, {
    payload: { message: fallbackMessage, error: error.message },
  });
}

function toDateOnly(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

async function ensureUserHasRole(userId, roleName, { transaction } = {}) {
  const normalized = String(roleName || '').trim().toLowerCase();
  if (!normalized) return;

  if (normalized === 'advisor') {
    const profile = await LecturerProfile.findOne({
      where: { user_id: userId },
      attributes: ['id', 'position'],
      transaction,
    });
    const posNorm = String(profile?.position || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    const isAdvisorPosition = posNorm === 'advisor';
    const isPromotableLecturerPosition = posNorm === 'lecturer' || posNorm === 'assistant lecturer';

    if (!isAdvisorPosition && !isPromotableLecturerPosition) {
      throw new ValidationError(
        "Only users with position 'Lecturer' or 'Assistant Lecturer' can be promoted to the 'advisor' role",
        {
          payload: {
            message:
              "Only users with position 'Lecturer' or 'Assistant Lecturer' can be promoted to the 'advisor' role",
          },
        }
      );
    }
  }

  const roles = await Role.findAll({ transaction });
  let role = roles.find((item) => String(item?.role_type || '').trim().toLowerCase() === normalized) || null;
  if (!role) {
    role = await Role.create({ role_type: normalized }, { transaction });
  }

  const existing = await UserRole.findOne({
    where: { user_id: userId, role_id: role.id },
    transaction,
  });

  if (!existing) {
    await UserRole.create({ user_id: userId, role_id: role.id }, { transaction });
  }
}

async function userHasRole(userId, roleName, { transaction } = {}) {
  const normalized = String(roleName || '').trim().toLowerCase();
  if (!normalized) return false;

  const role = await Role.findOne({ where: { role_type: normalized }, transaction });
  if (!role) return false;

  const existing = await UserRole.findOne({
    where: { user_id: userId, role_id: role.id },
    transaction,
  });

  return !!existing;
}

async function assertOwnedAdvisorContract(user, contractId, options = {}) {
  const contract = await AdvisorContract.findByPk(contractId, options);
  if (!contract) {
    throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  }
  if (Number(contract.lecturer_user_id) !== Number(user?.id)) {
    throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
  }
  return contract;
}

export async function assertAdvisorContractViewAccess(user, contractId, options = {}) {
  const contract = await AdvisorContract.findByPk(contractId, options);
  if (!contract) {
    throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  }

  const role = String(user?.role || '').toLowerCase();
  if (Number(contract.lecturer_user_id) === Number(user?.id) || role === 'superadmin') {
    return contract;
  }

  if (role === 'admin' || role === 'management') {
    const owner = await User.findByPk(contract.lecturer_user_id, { attributes: ['department_name'] });
    if (String(owner?.department_name || '') === String(user?.department_name || '')) {
      return contract;
    }
  }

  throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
}

async function assertAdvisorStatusUpdateAccess(user, contractId) {
  if (!user) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, {
      payload: { message: 'Unauthorized' },
    });
  }

  const contract = await AdvisorContract.findByPk(contractId, {
    include: [
      {
        model: User,
        as: 'lecturer',
        attributes: ['id', 'email', 'display_name', 'department_name'],
        required: false,
      },
    ],
  });

  if (!contract) {
    throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  }

  const isOwner = Number(contract.lecturer_user_id) === Number(user.id);
  let privilegedRole = null;
  const elevatedRoles = ['admin', 'management', 'superadmin'];
  const currentRole = String(user.role || '').trim().toLowerCase();

  if (elevatedRoles.includes(currentRole)) {
    privilegedRole = currentRole;
  } else {
    for (const roleName of elevatedRoles) {
      const hasRole = await userHasRole(user.id, roleName);
      if (hasRole) {
        privilegedRole = roleName;
        break;
      }
    }
  }

  if (!isOwner && !privilegedRole) {
    throw new ForbiddenError('Forbidden', { payload: { message: 'Forbidden' } });
  }

  if (!isOwner && privilegedRole !== 'superadmin') {
    const lecturerDept = contract.lecturer ? contract.lecturer.department_name : null;
    const userDept = user.department_name;
    if (!lecturerDept || !userDept || lecturerDept !== userDept) {
      throw new ForbiddenError('Forbidden: cross-department access denied', {
        payload: { message: 'Forbidden: cross-department access denied' },
      });
    }
  }

  return contract;
}

async function notifyRoleSafe(payload, logPrefix) {
  try {
    await getNotificationSocket().notifyRole(payload);
  } catch (error) {
    console.error(logPrefix, error.message);
  }
}

async function notifyLecturerSafe(payload, logPrefix) {
  try {
    await getNotificationSocket().notifyLecturer(payload);
  } catch (error) {
    console.error(logPrefix, error.message);
  }
}

export async function uploadAdvisorContractSignatureFile({ user, contractId, body, file }) {
  try {
    const whoRaw = String(body?.who || 'advisor').toLowerCase();
    const who = whoRaw === 'lecturer' ? 'advisor' : whoRaw;
    if (who !== 'advisor' && who !== 'management') {
      throw new ValidationError("Invalid 'who' (must be advisor|management)", {
        payload: { message: "Invalid 'who' (must be advisor|management)" },
      });
    }

    const contract =
      who === 'advisor'
        ? await assertOwnedAdvisorContract(user, contractId)
        : await assertAdvisorContractViewAccess(user, contractId);

    if (!file) {
      throw new ValidationError('No file uploaded', {
        payload: { message: 'No file uploaded' },
      });
    }

    let ownerName = 'unknown';
    try {
      if (who === 'advisor') {
        const contractOwner =
          contract.lecturer ||
          (await User.findByPk(contract.lecturer_user_id, { attributes: ['display_name', 'email'] }));
        ownerName = contractOwner?.display_name || contractOwner?.email || 'unknown';
      } else {
        ownerName = user?.display_name || user?.email || 'management';
      }
    } catch {}

    const safeName =
      String(ownerName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'unknown';
    const targetDir = path.join(process.cwd(), 'uploads', 'signatures', safeName);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const ext = path.extname(file.filename || '') || '.png';
    const unique = `advisor_contract_${contractId}_${who}_${Date.now()}${ext}`;
    const targetPath = path.join(targetDir, unique);

    try {
      fs.renameSync(file.path, targetPath);
    } catch {
      try {
        fs.copyFileSync(file.path, targetPath);
        fs.unlinkSync(file.path);
      } catch {}
    }

    const now = new Date();
    if (who === 'advisor') {
      const nextStatus = contract.management_signed_at ? 'COMPLETED' : 'WAITING_MANAGEMENT';
      await contract.update({
        advisor_signature_path: targetPath,
        advisor_signed_at: now,
        status: nextStatus,
      });
      await notifyRoleSafe(
        {
          role: 'management',
          type: 'status_change',
          message: `Advisor contract #${contract.id} signed by advisor, awaiting your signature`,
          contractId: contract.id,
          department_name: contract.department_name || contract.lecturer_department_name || undefined,
        },
        '[uploadAdvisorContractSignature] notification failed:'
      );
      await notifyRoleSafe(
        {
          role: 'admin',
          type: 'status_change',
          message: `Advisor contract #${contract.id} signed by advisor`,
          contractId: contract.id,
        },
        '[uploadAdvisorContractSignature] notification failed:'
      );
    } else {
      const nextStatus = contract.advisor_signed_at ? 'COMPLETED' : 'DRAFT';
      await contract.update({
        management_signature_path: targetPath,
        management_signed_at: now,
        status: nextStatus,
      });
      await notifyLecturerSafe(
        {
          user_id: contract.lecturer_user_id,
          type: 'status_change',
          message: `Advisor contract #${contract.id} has been completed`,
          contract_id: contract.id,
        },
        '[uploadAdvisorContractSignature] notifyLecturer failed:'
      );
      await notifyRoleSafe(
        {
          role: 'admin',
          type: 'status_change',
          message: `Advisor contract #${contract.id} completed`,
          contractId: contract.id,
        },
        '[uploadAdvisorContractSignature] notifyRole(admin) failed:'
      );
    }

    return { message: 'Signature uploaded', path: targetPath, status: contract.status };
  } catch (error) {
    throw wrapUnexpectedError(error, 'Failed to upload signature');
  }
}

export async function createAdvisorContractRecord({ user, body }) {
  const transaction = await sequelize.transaction();
  try {
    const actorRole = String(user?.role || '').toLowerCase();
    let managementDept = null;
    if (actorRole === 'admin' || actorRole === 'management') {
      const actorDept = user?.department_name || null;
      if (!actorDept) {
        throw new ForbiddenError('Your account is missing a department', {
          payload: { message: 'Your account is missing a department' },
        });
      }
      const lecturer = await User.findByPk(body.lecturer_user_id, {
        attributes: ['id', 'department_name'],
        transaction,
      });
      if (!lecturer) {
        throw new ValidationError('Invalid lecturer_user_id', {
          payload: { message: 'Invalid lecturer_user_id' },
        });
      }
      if (String(lecturer.department_name || '') !== String(actorDept)) {
        throw new ForbiddenError('You can only create advisor contracts for lecturers in your department', {
          payload: {
            message: 'You can only create advisor contracts for lecturers in your department',
          },
        });
      }
      managementDept = lecturer.department_name || actorDept;
    }

    await ensureUserHasRole(body.lecturer_user_id, 'advisor', { transaction });

    const created = await AdvisorContract.create(
      {
        lecturer_user_id: body.lecturer_user_id,
        academic_year: body.academic_year,
        role: body.role,
        hourly_rate: body.hourly_rate,
        capstone_1: !!body.capstone_1,
        capstone_2: !!body.capstone_2,
        internship_1: !!body.internship_1,
        internship_2: !!body.internship_2,
        hours_per_student: body.hours_per_student,
        students: body.students,
        start_date: toDateOnly(body.start_date),
        end_date: toDateOnly(body.end_date),
        duties: body.duties,
        join_judging_hours: body.join_judging_hours ?? null,
        status: 'DRAFT',
        created_by: user.id,
      },
      { transaction }
    );

    await transaction.commit();

    if (!managementDept) {
      try {
        const lecturerForDept = await User.findByPk(body.lecturer_user_id, {
          attributes: ['department_name'],
        });
        managementDept = lecturerForDept?.department_name || null;
      } catch (error) {
        console.error(
          '[createAdvisorContract] Failed to load lecturer department for notifications:',
          error.message
        );
      }
    }

    await notifyLecturerSafe(
      {
        user_id: parseInt(body.lecturer_user_id, 10),
        type: 'contract_created',
        message: `Advisor contract #${created.id} has been created for you`,
        contract_id: created.id,
      },
      '[createAdvisorContract] notifyLecturer failed:'
    );
    await notifyRoleSafe(
      {
        role: 'management',
        department_name: managementDept || undefined,
        type: 'status_change',
        message: `Advisor contract #${created.id} created, awaiting advisor signature`,
        contractId: created.id,
      },
      '[createAdvisorContract] notifyRole(management) failed:'
    );
    await notifyRoleSafe(
      {
        role: 'admin',
        type: 'status_change',
        message: `Advisor contract #${created.id} created, awaiting advisor signature`,
        contractId: created.id,
      },
      '[createAdvisorContract] notifyRole(admin) failed:'
    );

    return { id: created.id };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {}
    if (error instanceof AppError) throw error;
    throw wrapUnexpectedError(error, 'Failed to create advisor contract');
  }
}

export async function listAdvisorContractRecords({ user, query }) {
  try {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(
      PAGINATION_MAX_LIMIT,
      Math.max(1, parseInt(query.limit || String(PAGINATION_DEFAULT_LIMIT), 10))
    );
    const offset = (page - 1) * limit;
    const { q } = query;
    const statusQuery = query.status;

    const where = {};
    const actorRole = String(user?.role || '').toLowerCase();
    if (actorRole === 'lecturer' || actorRole === 'advisor') {
      where.lecturer_user_id = user.id;
    }

    const include = [
      {
        model: User,
        as: 'lecturer',
        attributes: ['id', 'email', 'display_name', 'department_name'],
        include: [
          {
            model: LecturerProfile,
            attributes: ['title', 'full_name_english', 'full_name_khmer'],
            required: false,
          },
        ],
        required: false,
      },
    ];

    if (actorRole === 'admin' || actorRole === 'management') {
      const department = user?.department_name || null;
      if (!department) return { data: [], page, limit, total: 0 };
      include[0].required = true;
      include[0].where = { department_name: department };
    }

    if (statusQuery !== null && statusQuery !== undefined && String(statusQuery).trim() !== '') {
      const statusNorm = String(statusQuery).trim().toUpperCase().replace(/\s+/g, '_');
      if (!ADVISOR_CONTRACT_ALLOWED_STATUSES.has(statusNorm)) {
        return { data: [], page, limit, total: 0 };
      }
      if (statusNorm === 'CONTRACT_ENDED') {
        const now = new Date();
        const todayOnly = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')}`;
        where[Sequelize.Op.or] = [
          { status: 'CONTRACT_ENDED' },
          { end_date: { [Sequelize.Op.lte]: todayOnly } },
        ];
      } else {
        where.status = statusNorm;
      }
    }

    if (q) {
      const like = `%${q}%`;
      const qWhere = {
        [Sequelize.Op.or]: [
          { display_name: { [Sequelize.Op.like]: like } },
          { email: { [Sequelize.Op.like]: like } },
        ],
      };
      include[0].required = true;
      include[0].where = include[0].where
        ? { [Sequelize.Op.and]: [include[0].where, qWhere] }
        : qWhere;
    }

    const { rows, count } = await AdvisorContract.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    return { data: rows, page, limit, total: count };
  } catch (error) {
    throw wrapUnexpectedError(error, 'Failed to list advisor contracts');
  }
}

export async function getAdvisorContractRecord({ user, contractId }) {
  try {
    await assertAdvisorContractViewAccess(user, contractId, {
      attributes: ['id', 'lecturer_user_id'],
    });

    const contract = await AdvisorContract.findByPk(contractId, {
      include: [
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          required: false,
        },
      ],
    });
    if (!contract) {
      throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
    }
    return contract;
  } catch (error) {
    throw wrapUnexpectedError(error, 'Failed to fetch advisor contract');
  }
}

export async function updateAdvisorContractStatus({ user, contractId, body }) {
  try {
    const status = String(body.status || '').trim().toUpperCase().replace(/\s+/g, '_');
    const remarks = String(body.remarks || '').trim();

    const contract = await assertAdvisorStatusUpdateAccess(user, contractId);
    const isOwnerRequester = Number(contract.lecturer_user_id) === Number(user?.id);
    const redoRequesterRole = isOwnerRequester ? 'ADVISOR' : 'MANAGEMENT';

    if (status === 'REQUEST_REDO' && !remarks) {
      throw new ValidationError('remarks is required when requesting redo', {
        payload: { message: 'remarks is required when requesting redo' },
      });
    }

    if (status === 'REQUEST_REDO') {
      const allowedTransitions = isOwnerRequester
        ? ['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO']
        : ['WAITING_MANAGEMENT', 'REQUEST_REDO'];
      if (!allowedTransitions.includes(String(contract.status || '').toUpperCase())) {
        throw new ValidationError('Invalid status transition', {
          payload: { message: 'Invalid status transition' },
        });
      }
    }

    const updatePayload = { status };
    if (status === 'REQUEST_REDO') {
      updatePayload.advisor_remarks = redoRequesterRole === 'ADVISOR' ? remarks : null;
      updatePayload.management_remarks = redoRequesterRole === 'MANAGEMENT' ? remarks : null;
      updatePayload.latest_redo_requester_role = redoRequesterRole;
      updatePayload.advisor_signature_path = null;
      updatePayload.management_signature_path = null;
      updatePayload.advisor_signed_at = null;
      updatePayload.management_signed_at = null;
    } else {
      updatePayload.advisor_remarks = null;
      updatePayload.management_remarks = null;
      updatePayload.latest_redo_requester_role = null;
    }

    await contract.update(updatePayload);

    const lecturerDepartmentName = contract.lecturer?.department_name || user?.department_name || null;
    if (status === 'REQUEST_REDO') {
      if (redoRequesterRole === 'ADVISOR') {
        await notifyRoleSafe(
          {
            role: 'management',
            type: 'status_change',
            message: `Advisor contract #${contract.id} redo requested by advisor`,
            contractId: contract.id,
            department_name: lecturerDepartmentName,
          },
          '[updateAdvisorStatus] notifyRole(management) failed:'
        );
        await notifyRoleSafe(
          {
            role: 'admin',
            type: 'status_change',
            message: `Advisor contract #${contract.id} redo requested by advisor`,
            contractId: contract.id,
          },
          '[updateAdvisorStatus] notifyRole(admin) failed:'
        );
      } else {
        await notifyLecturerSafe(
          {
            user_id: contract.lecturer_user_id,
            type: 'status_change',
            message: `Advisor contract #${contract.id} has been sent back for revision`,
            contract_id: contract.id,
            data: { contractId: contract.id, status, at: new Date().toISOString() },
          },
          '[updateAdvisorStatus] notifyLecturer failed:'
        );
        await notifyRoleSafe(
          {
            role: 'admin',
            type: 'status_change',
            message: `Advisor contract #${contract.id} status updated to ${status.replace(/_/g, ' ').toLowerCase()}`,
            contractId: contract.id,
          },
          '[updateAdvisorStatus] notifyRole(admin) failed:'
        );
      }
    } else {
      await notifyRoleSafe(
        {
          role: 'management',
          type: 'status_change',
          message: `Advisor contract #${contract.id} status updated to ${status.replace(/_/g, ' ').toLowerCase()}`,
          contractId: contract.id,
          department_name: lecturerDepartmentName,
        },
        '[updateAdvisorStatus] notifyRole(management) failed:'
      );
      await notifyRoleSafe(
        {
          role: 'admin',
          type: 'status_change',
          message: `Advisor contract #${contract.id} status updated to ${status.replace(/_/g, ' ').toLowerCase()}`,
          contractId: contract.id,
        },
        '[updateAdvisorStatus] notifyRole(admin) failed:'
      );
    }

    return { message: 'Updated', id: contractId, status };
  } catch (error) {
    throw wrapUnexpectedError(error, 'Failed to update advisor status');
  }
}

export async function editAdvisorContractRecord({ contractId, body }) {
  const transaction = await sequelize.transaction();
  try {
    const contract = await AdvisorContract.findOne({
      where: { id: contractId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) {
      throw new NotFoundError('Advisor contract not found', {
        payload: { message: 'Advisor contract not found' },
      });
    }

    if (String(contract.status || '').toUpperCase() !== 'REQUEST_REDO') {
      throw new ConflictError('Contract can only be edited when status is REQUEST_REDO', {
        payload: { message: 'Contract can only be edited when status is REQUEST_REDO' },
      });
    }

    const updatePayload = {
      status: 'DRAFT',
      advisor_signature_path: null,
      management_signature_path: null,
      advisor_signed_at: null,
      management_signed_at: null,
      advisor_remarks: null,
      management_remarks: null,
      latest_redo_requester_role: null,
    };

    if (body.role !== undefined) updatePayload.role = body.role;
    if (body.hourly_rate !== undefined) updatePayload.hourly_rate = body.hourly_rate;
    if (body.capstone_1 !== undefined) updatePayload.capstone_1 = !!body.capstone_1;
    if (body.capstone_2 !== undefined) updatePayload.capstone_2 = !!body.capstone_2;
    if (body.internship_1 !== undefined) updatePayload.internship_1 = !!body.internship_1;
    if (body.internship_2 !== undefined) updatePayload.internship_2 = !!body.internship_2;
    if (body.hours_per_student !== undefined) updatePayload.hours_per_student = body.hours_per_student;
    if (body.students !== undefined) updatePayload.students = body.students;
    if (Object.prototype.hasOwnProperty.call(body, 'start_date')) {
      updatePayload.start_date = toDateOnly(body.start_date);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'end_date')) {
      updatePayload.end_date = toDateOnly(body.end_date);
    }
    if (body.duties !== undefined) updatePayload.duties = body.duties;
    if (Object.prototype.hasOwnProperty.call(body, 'join_judging_hours')) {
      updatePayload.join_judging_hours = body.join_judging_hours ?? null;
    }

    await contract.update(updatePayload, { transaction });
    await transaction.commit();
    return { message: 'Updated', id: contractId, status: 'DRAFT' };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {}
    if (error instanceof AppError) throw error;
    throw wrapUnexpectedError(error, 'Failed to edit advisor contract');
  }
}