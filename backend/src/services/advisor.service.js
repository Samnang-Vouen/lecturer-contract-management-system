import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';
import Candidate from '../model/candidate.model.js';
import {
  Department,
  DepartmentProfile,
  LecturerProfile,
  Role,
  User,
  UserRole,
} from '../model/index.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import { generateTemporaryPassword } from './user.service.js';

function sanitizeCadtEmail(value) {
  const raw = String(value || '').trim().toLowerCase();
  const local = raw.split('@')[0].replace(/[^a-z0-9._%+-]/g, '');
  return local ? `${local}@cadt.edu.kh` : '';
}

function normalizeAdvisorPosition(value) {
  const candidatePosition = String(value || '').trim();
  if (!candidatePosition) return '';
  if (/\b(advisor|adviser)\b/i.test(candidatePosition) || /អ្នកប្រឹក្សា/.test(candidatePosition)) {
    return 'Advisor';
  }
  return '';
}

function inferTitle(fullName, title) {
  if (title) return title;
  const nameLower = String(fullName || '').toLowerCase();
  if (/^prof(\.|\b)/i.test(nameLower)) return 'Prof';
  if (/^dr(\.|\b)/i.test(nameLower)) return 'Dr';
  if (/^mr(\.|\b)/i.test(nameLower)) return 'Mr';
  if (/^mrs(\.|\b)/i.test(nameLower)) return 'Mrs';
  if (/^ms(\.|\b)/i.test(nameLower)) return 'Ms';
  return null;
}

export async function createAdvisorFromCandidateAccount({
  candidateId,
  email,
  title,
  gender,
  actorDepartmentName,
}) {
  if (!candidateId) {
    throw new ValidationError('Invalid candidate id', {
      payload: { message: 'Invalid candidate id' },
    });
  }

  const candidate = await Candidate.findByPk(candidateId);
  if (!candidate) {
    throw new NotFoundError('Candidate not found', {
      payload: { message: 'Candidate not found' },
    });
  }
  if (candidate.status !== 'accepted') {
    throw new ValidationError('Candidate must be accepted before creating advisor', {
      payload: { message: 'Candidate must be accepted before creating advisor' },
    });
  }
  if (!actorDepartmentName) {
    throw new ValidationError('Admin department is not set', {
      payload: { message: 'Admin department is not set' },
    });
  }

  const normalizedEmail = sanitizeCadtEmail(email);
  if (!normalizedEmail) {
    throw new ValidationError('Valid CADT email is required', {
      payload: { message: 'Valid CADT email is required' },
    });
  }

  const position = normalizeAdvisorPosition(candidate.positionAppliedFor);
  if (position !== 'Advisor') {
    throw new ValidationError(
      'Candidate is not an Advisor applicant. Create lecturers via POST /api/lecturers/from-candidate/:id instead.',
      {
        payload: {
          message:
            'Candidate is not an Advisor applicant. Create lecturers via POST /api/lecturers/from-candidate/:id instead.',
        },
      }
    );
  }

  const fullName = candidate.fullName;
  const resolvedTitle = inferTitle(fullName, title || null);
  const resolvedGender = gender || null;

  const result = await sequelize.transaction(async (transaction) => {
    const [roleRow] = await Role.findOrCreate({
      where: { role_type: 'advisor' },
      defaults: { role_type: 'advisor' },
      transaction,
    });
    const [deptRow] = await Department.findOrCreate({
      where: { dept_name: actorDepartmentName },
      defaults: { dept_name: actorDepartmentName },
      transaction,
    });

    const existing = await User.findOne({ where: { email: normalizedEmail }, transaction });
    if (existing) {
      throw new ConflictError('Email already exists for another user', {
        payload: { message: 'Email already exists for another user' },
      });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await User.create(
      {
        email: normalizedEmail,
        password_hash: passwordHash,
        display_name: fullName,
        department_name: deptRow.dept_name,
        status: 'active',
      },
      { transaction }
    );
    await UserRole.create({ user_id: user.id, role_id: roleRow.id }, { transaction });

    const advisorProfile = await LecturerProfile.create(
      {
        user_id: user.id,
        employee_id: `EMP${Date.now().toString().slice(-6)}`,
        full_name_english: fullName,
        position: 'Advisor',
        occupation: 'Advisor',
        join_date: new Date(),
        status: 'active',
        cv_uploaded: false,
        cv_file_path: '',
        qualifications: '',
        phone_number: candidate.phone || null,
        personal_email: candidate.email || null,
        title: resolvedTitle,
        gender: resolvedGender,
      },
      { transaction }
    );

    await DepartmentProfile.create(
      { dept_id: deptRow.id, profile_id: advisorProfile.id },
      { transaction }
    );

    await candidate.update({ status: 'done' }, { transaction });

    return {
      id: user.id,
      email: user.email,
      role: roleRow.role_type,
      department: deptRow.dept_name,
      tempPassword,
      profile: {
        employeeId: advisorProfile.employee_id,
        fullName: advisorProfile.full_name_english,
        position: advisorProfile.position,
      },
      candidateId: candidate.id,
    };
  });

  return result;
}