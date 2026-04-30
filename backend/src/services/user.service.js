import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import {
  Department,
  DepartmentProfile,
  LecturerProfile,
  Role,
  User,
  UserRole,
  ContractRedoRequest,
  TeachingContract,
  AdvisorContract,
  NewContract,
} from '../model/index.js';
import Candidate from '../model/candidate.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';

export function generateTemporaryPassword(length = 10) {
  let tempPassword = '';
  while (tempPassword.length < length) {
    tempPassword += Math.random().toString(36).slice(2);
  }
  return tempPassword.slice(0, length);
}

function buildValidationFailedError(errors) {
  return new ValidationError('Validation failed', {
    payload: { message: 'Validation failed', errors },
  });
}

export async function createUserAccount({
  fullName,
  email,
  role,
  department,
  position,
  title,
  gender,
  actorDepartmentName,
}) {
  const errors = {};
  if (!fullName || !fullName.trim()) errors.fullName = 'Full name is required';
  if (await User.findOne({ where: { email } })) {
    errors.email = 'Email is already registered';
  }

  const normalizedRole = role || 'lecturer';
  const roleLc = String(normalizedRole || '').toLowerCase();
  let resolvedDepartment = department;
  if (!resolvedDepartment) {
    if (actorDepartmentName) {
      resolvedDepartment = actorDepartmentName;
    } else {
      errors.department = 'Department missing (assign admin a department first)';
    }
  }

  const positionTrimmed = String(position || '').trim();
  let resolvedPosition = position;
  if (roleLc === 'lecturer') {
    if (!positionTrimmed) {
      errors.position = 'Position is required for lecturers';
    } else if (positionTrimmed.toLowerCase() === 'advisor') {
      errors.position = "Advisor accounts must be created with role 'advisor'";
    } else if (!['Lecturer', 'Assistant Lecturer'].includes(positionTrimmed)) {
      errors.position = "Position must be either 'Lecturer' or 'Assistant Lecturer'";
    }
  } else if (roleLc === 'advisor') {
    if (positionTrimmed && positionTrimmed.toLowerCase() !== 'advisor') {
      errors.position = "Advisor users must have position 'Advisor'";
    }
    resolvedPosition = 'Advisor';
  }

  if (title && !['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].includes(String(title))) {
    errors.title = 'Invalid title';
  }
  if (gender && !['male', 'female', 'other'].includes(String(gender))) {
    errors.gender = 'Invalid gender';
  }
  if (Object.keys(errors).length > 0) {
    throw buildValidationFailedError(errors);
  }

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const result = await sequelize.transaction(async (transaction) => {
    const newUser = await User.create(
      {
        email,
        password_hash: passwordHash,
        display_name: fullName,
        department_name: resolvedDepartment,
        status: 'active',
      },
      { transaction }
    );

    const [userRole] = await Role.findOrCreate({
      where: { role_type: normalizedRole },
      defaults: { role_type: normalizedRole },
      transaction,
    });

    const [userDepartment] = await Department.findOrCreate({
      where: { dept_name: resolvedDepartment },
      defaults: { dept_name: resolvedDepartment },
      transaction,
    });

    await UserRole.create({ user_id: newUser.id, role_id: userRole.id }, { transaction });

    let lecturerProfile = null;
    if (roleLc === 'lecturer' || roleLc === 'advisor') {
      lecturerProfile = await LecturerProfile.create(
        {
          user_id: newUser.id,
          employee_id: `EMP${Date.now().toString().slice(-6)}`,
          full_name_english: fullName,
          position: String(resolvedPosition || '').trim(),
          occupation: String(resolvedPosition || '').trim(),
          title: title || null,
          gender: gender || null,
          join_date: new Date(),
          status: 'active',
          cv_uploaded: false,
          cv_file_path: '',
          qualifications: '',
        },
        { transaction }
      );

      await DepartmentProfile.create(
        { dept_id: userDepartment.id, profile_id: lecturerProfile.id },
        { transaction }
      );
    }

    return {
      user: newUser,
      tempPassword,
      role: userRole.role_type,
      department: userDepartment.dept_name,
      lecturerProfile,
    };
  });

  const responseData = {
    id: result.user.id,
    email: result.user.email,
    role: result.role,
    department: result.department,
    tempPassword: result.tempPassword,
  };
  if (result.lecturerProfile) {
    responseData.profile = {
      employeeId: result.lecturerProfile.employee_id,
      fullName: result.lecturerProfile.full_name_english,
      position: result.lecturerProfile.position,
    };
  }

  return responseData;
}

const ALLOWED_RETURN_ROLES = ['admin', 'management'];

export async function getAllUsersData({ page: rawPage, limit: rawLimit, roleFilter: rawRole, deptFilter: rawDept, search: rawSearch, actorRole, actorDepartmentName }) {
  const page = Math.max(parseInt(rawPage) || 1, 1);
  const limit = Math.min(Math.max(parseInt(rawLimit) || 10, 1), 100);
  const offset = (page - 1) * limit;
  const roleFilter = (rawRole || '').trim().toLowerCase();
  const deptFilter = (rawDept || '').trim();
  const search = (rawSearch || '').trim();

  const roleInclude = {
    model: Role,
    attributes: ['role_type'],
    through: { attributes: [] },
    required: false,
  };

  const andConditions = [];
  let includeSuperAdmin = true;
  let effectiveDeptFilter = deptFilter;
  const actorRoleLc = (actorRole || '').toLowerCase();
  if (actorRoleLc === 'admin' || actorRoleLc === 'management') {
    effectiveDeptFilter = actorDepartmentName || null;
    includeSuperAdmin = false;
  }
  if (effectiveDeptFilter && effectiveDeptFilter !== 'all') {
    andConditions.push({ department_name: effectiveDeptFilter });
  }
  if (search) {
    andConditions.push({
      [Op.or]: [
        { email: { [Op.like]: `%${search}%` } },
        { display_name: { [Op.like]: `%${search}%` } },
      ],
    });
  }

  roleInclude.required = true;
  roleInclude.where = { role_type: { [Op.in]: ALLOWED_RETURN_ROLES } };

  let superAdminFilterActive = false;
  if (roleFilter && roleFilter !== 'all') {
    if (roleFilter === 'superadmin') {
      if (actorRoleLc !== 'superadmin') {
        throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
      }
      andConditions.push({ email: 'superadmin@cadt.edu.kh' });
      roleInclude.required = false;
      delete roleInclude.where;
      superAdminFilterActive = true;
    } else if (ALLOWED_RETURN_ROLES.includes(roleFilter)) {
      roleInclude.where = { role_type: roleFilter };
    }
  }

  const where = andConditions.length ? { [Op.and]: andConditions } : undefined;
  let { rows, count } = await User.findAndCountAll({
    attributes: ['id', 'email', 'status', 'created_at', 'display_name', 'department_name', 'last_login'],
    include: [roleInclude],
    where,
    limit,
    offset,
    distinct: true,
    order: [['created_at', 'DESC']],
  });

  if (includeSuperAdmin && !superAdminFilterActive && (!roleFilter || roleFilter === 'all')) {
    const superAdminEmail = 'superadmin@cadt.edu.kh';
    const superAlready = rows.some((r) => r.email === superAdminEmail);
    if (!superAlready) {
      const superRow = await User.findOne({ where: { email: superAdminEmail } });
      if (superRow) { rows = [superRow, ...rows]; count += 1; }
    }
  }

  const data = rows.map((user) => {
    let role = user.Roles && user.Roles.length ? user.Roles[0].role_type : 'User';
    let name = user.display_name;
    if (!name) {
      const emailName = user.email.split('@')[0].replace(/\./g, ' ');
      name = emailName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    let department = user.department_name || 'General';
    if (user.email === 'superadmin@cadt.edu.kh') {
      role = 'superadmin'; name = 'Super Admin'; department = 'Administration';
    }
    return { id: user.id, name, email: user.email, role, department, status: user.status || 'active', createdAt: user.created_at, lastLogin: user.last_login ? user.last_login : 'Never' };
  });

  const totalPages = Math.ceil(count / limit) || 1;
  return { data, meta: { page, limit, total: count, totalPages } };
}

export async function createLecturerFromCandidateData({ candId, actorDepartmentName, email: rawEmail, title: rawTitle, gender }) {
  if (!candId) throw new ValidationError('Invalid candidate id', { payload: { message: 'Invalid candidate id' } });
  const cand = await Candidate.findByPk(candId);
  if (!cand) throw new NotFoundError('Candidate not found', { payload: { message: 'Candidate not found' } });
  if (cand.status !== 'accepted') throw new ValidationError('Candidate must be accepted', { payload: { message: 'Candidate must be accepted before creating lecturer' } });
  if (!actorDepartmentName) throw new ValidationError('Admin department not set', { payload: { message: 'Admin department is not set' } });

  const sanitizeCadtEmail = (val) => {
    const raw = String(val || '').trim().toLowerCase();
    const local = raw.split('@')[0].replace(/[^a-z0-9._%+-]/g, '');
    return local ? `${local}@cadt.edu.kh` : '';
  };
  const email = sanitizeCadtEmail(rawEmail);
  if (!email) throw new ValidationError('Valid CADT email is required', { payload: { message: 'Valid CADT email is required' } });

  const normalizePosition = (val) => {
    const s = String(val || '').trim();
    if (!s) return 'Lecturer';
    if (/\b(advisor|adviser)\b/i.test(s) || /អ្នកប្រឹក្សា/.test(s)) return 'Advisor';
    if (/\bassistant\s+lecturer\b/i.test(s)) return 'Assistant Lecturer';
    if (/(lecturer|instructor|teacher)/i.test(s)) return 'Lecturer';
    return 'Lecturer';
  };
  const position = normalizePosition(cand.positionAppliedFor);

  if (String(position).toLowerCase() === 'advisor') {
    throw new ValidationError('Use advisor route', {
      payload: { message: 'Candidate applied for Advisor. Create this user via POST /api/advisors/from-candidate/:id to assign the advisor role.' },
    });
  }

  let title = rawTitle || null;
  const fullName = cand.fullName;
  if (!title) {
    if (/^prof(\.\b)/i.test(fullName)) title = 'Prof';
    else if (/^dr(\.\b)/i.test(fullName)) title = 'Dr';
    else if (/^mr(\.\b)/i.test(fullName)) title = 'Mr';
    else if (/^mrs(\.\b)/i.test(fullName)) title = 'Mrs';
    else if (/^ms(\.\b)/i.test(fullName)) title = 'Ms';
  }

  const result = await sequelize.transaction(async (t) => {
    const [roleRow] = await Role.findOrCreate({ where: { role_type: 'lecturer' }, defaults: { role_type: 'lecturer' }, transaction: t });
    const [deptRow] = await Department.findOrCreate({ where: { dept_name: actorDepartmentName }, defaults: { dept_name: actorDepartmentName }, transaction: t });
    const existing = await User.findOne({ where: { email }, transaction: t });
    if (existing) throw new ConflictError('Email already exists', { payload: { message: 'Email already exists for another user' } });

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const user = await User.create({ email, password_hash: passwordHash, display_name: fullName, department_name: deptRow.dept_name, status: 'active' }, { transaction: t });
    await UserRole.create({ user_id: user.id, role_id: roleRow.id }, { transaction: t });
    const lecturer = await LecturerProfile.create({
      user_id: user.id, candidate_id: cand.id, employee_id: `EMP${Date.now().toString().slice(-6)}`,
      full_name_english: fullName, position, join_date: new Date(), status: 'active',
      cv_uploaded: false, cv_file_path: '', qualifications: '', occupation: position,
      phone_number: cand.phone || null, personal_email: cand.email || null, title, gender: gender || null,
    }, { transaction: t });
    await DepartmentProfile.create({ dept_id: deptRow.id, profile_id: lecturer.id }, { transaction: t });
    await cand.update({ status: 'done' }, { transaction: t });
    return { user, roleRow, deptRow, lecturer, tempPassword };
  });

  return {
    id: result.user.id, email: result.user.email, role: result.roleRow.role_type,
    department: result.deptRow.dept_name, tempPassword: result.tempPassword,
    profile: { employeeId: result.lecturer.employee_id, fullName: result.lecturer.full_name_english, position: result.lecturer.position, candidateId: result.lecturer.candidate_id },
    candidateId: cand.id, message: 'Lecturer created successfully from candidate',
  };
}

export async function updateUserData({ id, fullName, email, role, department }) {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found', { payload: { message: 'User not found' } });
  if (email) user.email = email.toLowerCase();
  if (fullName) user.display_name = fullName;
  if (department) user.department_name = department;
  await user.save();

  if (role) {
    const requestedRole = String(role).trim().toLowerCase();
    const profile = await LecturerProfile.findOne({ where: { user_id: user.id } });
    const posNorm = String(profile?.position || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const isAdvisorPosition = posNorm === 'advisor';
    const isPromotableLecturerPosition = posNorm === 'lecturer' || posNorm === 'assistant lecturer';

    if (requestedRole === 'lecturer') {
      if (isAdvisorPosition) throw new ValidationError('Role change not allowed', { payload: { message: "Advisor-position users cannot be assigned the 'lecturer' role" } });
      const [roleModel] = await Role.findOrCreate({ where: { role_type: 'lecturer' }, defaults: { role_type: 'lecturer' } });
      const existing = await UserRole.findOne({ where: { user_id: user.id, role_id: roleModel.id } });
      if (!existing) await UserRole.create({ user_id: user.id, role_id: roleModel.id });
    } else if (requestedRole === 'advisor') {
      if (!isAdvisorPosition && !isPromotableLecturerPosition) throw new ValidationError('Role change not allowed', { payload: { message: "Only users with position 'Lecturer' or 'Assistant Lecturer' can be promoted to the 'advisor' role" } });
      const [roleModel] = await Role.findOrCreate({ where: { role_type: 'advisor' }, defaults: { role_type: 'advisor' } });
      const existing = await UserRole.findOne({ where: { user_id: user.id, role_id: roleModel.id } });
      if (!existing) await UserRole.create({ user_id: user.id, role_id: roleModel.id });
    } else {
      const [roleModel] = await Role.findOrCreate({ where: { role_type: role }, defaults: { role_type: role } });
      await UserRole.destroy({ where: { user_id: user.id } });
      await UserRole.create({ user_id: user.id, role_id: roleModel.id });
    }
  }
  return { message: 'User updated' };
}

export async function toggleUserStatusData(id) {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found', { payload: { message: 'User not found' } });
  user.status = user.status === 'active' ? 'inactive' : 'active';
  await user.save();
  return { message: 'Status updated', status: user.status };
}

export async function deleteUserData(id) {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found', { payload: { message: 'User not found' } });

  const profile = await LecturerProfile.findOne({ where: { user_id: id } });
  const storageFolder = profile?.storage_folder || null;

  await sequelize.transaction(async (t) => {
    const [createdTeachingContracts, createdAdvisorContracts, createdSimpleContracts] = await Promise.all([
      TeachingContract.count({ where: { created_by: user.id }, transaction: t }),
      AdvisorContract.count({ where: { created_by: user.id }, transaction: t }),
      NewContract.count({ where: { created_by: user.id }, transaction: t }),
    ]);
    if (createdTeachingContracts || createdAdvisorContracts || createdSimpleContracts) {
      throw new ConflictError('Has contract dependencies', {
        payload: {
          message: 'Cannot delete user because they created existing contract records',
          references: { teachingContracts: createdTeachingContracts, advisorContracts: createdAdvisorContracts, simpleContracts: createdSimpleContracts },
        },
      });
    }
    await ContractRedoRequest.destroy({ where: { requester_user_id: user.id }, transaction: t });
    if (profile) {
      await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id }, transaction: t });
      await DepartmentProfile.destroy({ where: { profile_id: profile.id }, transaction: t });
      await profile.destroy({ transaction: t });
    }
    await UserRole.destroy({ where: { user_id: user.id }, transaction: t });
    await user.destroy({ transaction: t });
  });

  try {
    const uploadsRoot = path.join(process.cwd(), 'uploads', 'lecturers');
    if (storageFolder) {
      const destRoot = path.join(uploadsRoot, storageFolder);
      if (fs.existsSync(destRoot)) {
        await fs.promises.rm(destRoot, { recursive: true, force: true });
      }
    }
  } catch {}

  return { message: 'User deleted' };
}

export async function resetUserPasswordData({ email: rawEmail, newPassword: rawNewPassword, actorRole }) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) throw new ValidationError('Email is required', { payload: { message: 'Email is required' } });
  const user = await User.findOne({ where: { email } });
  if (!user) throw new NotFoundError('User not found', { payload: { message: 'User not found' } });

  const isTargetSuper = email === 'superadmin@cadt.edu.kh';
  if (isTargetSuper && String(actorRole || '').toLowerCase() !== 'superadmin') {
    throw new ForbiddenError('Only superadmin can reset superadmin password', { payload: { message: 'Only superadmin can reset superadmin password' } });
  }

  let newPassword = rawNewPassword;
  if (!newPassword) {
    newPassword = generateTemporaryPassword();
  }
  if (newPassword.length < 6) {
    throw new ValidationError('Password too short', { payload: { message: 'New password must be at least 6 characters' } });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await user.update({ password_hash: hashed });
  return { message: 'Password reset successfully', email: user.email, tempPassword: newPassword };
}