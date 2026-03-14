import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';
import { Department, DepartmentProfile, LecturerProfile, Role, User, UserRole } from '../model/index.js';

// Wraps the shared createUser logic but forces advisor semantics.
// (Route/controller separation: advisors are created through /api/advisors.)
import { createUser } from './user.controller.js';

/**
 * Create a new advisor user (admin only)
 * @route POST /api/advisors
 */
export const createAdvisor = async (req, res) => {
  // Force advisor role & position regardless of client input
  req.body = {
    ...(req.body || {}),
    role: 'advisor',
    position: 'Advisor',
  };
  return createUser(req, res);
};

/**
 * Create a new advisor from an accepted candidate
 * @route POST /api/advisors/from-candidate/:id
 */
export const createAdvisorFromCandidate = async (req, res) => {
  try {
    const candId = parseInt(req.params.id, 10);
    if (!candId) return res.status(400).json({ message: 'Invalid candidate id' });

    const Candidate = (await import('../model/candidate.model.js')).default;
    const cand = await Candidate.findByPk(candId);
    if (!cand) return res.status(404).json({ message: 'Candidate not found' });
    if (cand.status !== 'accepted') {
      return res
        .status(400)
        .json({ message: 'Candidate must be accepted before creating advisor' });
    }

    // Determine department from admin creating this account
    const department = req.user?.department_name;
    if (!department) return res.status(400).json({ message: 'Admin department is not set' });

    const role = 'advisor';
    const fullName = cand.fullName;

    // Use admin-provided email; enforce CADT domain
    const sanitizeCadtEmail = (val) => {
      const raw = String(val || '')
        .trim()
        .toLowerCase();
      const local = raw.split('@')[0].replace(/[^a-z0-9._%+-]/g, '');
      return local ? `${local}@cadt.edu.kh` : '';
    };
    const email = sanitizeCadtEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: 'Valid CADT email is required' });

    // Candidate must be for Advisor position (EN/KM)
    const normalizePosition = (val) => {
      const s = String(val || '').trim();
      if (!s) return '';
      if (/\b(advisor|adviser)\b/i.test(s) || /អ្នកប្រឹក្សា/.test(s)) return 'Advisor';
      return '';
    };
    const position = normalizePosition(cand.positionAppliedFor);
    if (position !== 'Advisor') {
      return res.status(400).json({
        message:
          'Candidate is not an Advisor applicant. Create lecturers via POST /api/lecturers/from-candidate/:id instead.',
      });
    }

    // Prefer admin-provided title/gender; fallback to simple heuristics/null
    let { title, gender } = req.body || {};
    if (!title) title = null;
    if (!gender) gender = null;

    const nameLower = String(fullName || '').toLowerCase();
    if (!title) {
      if (/^prof(\.|\b)/i.test(nameLower)) title = 'Prof';
      else if (/^dr(\.|\b)/i.test(nameLower)) title = 'Dr';
      else if (/^mr(\.|\b)/i.test(nameLower)) title = 'Mr';
      else if (/^mrs(\.|\b)/i.test(nameLower)) title = 'Mrs';
      else if (/^ms(\.|\b)/i.test(nameLower)) title = 'Ms';
    }

    await sequelize.transaction(async (t) => {
      const [roleRow] = await Role.findOrCreate({
        where: { role_type: role },
        defaults: { role_type: role },
        transaction: t,
      });
      const [deptRow] = await Department.findOrCreate({
        where: { dept_name: department },
        defaults: { dept_name: department },
        transaction: t,
      });

      // Ensure unique email
      const existing = await User.findOne({ where: { email }, transaction: t });
      if (existing) throw new Error('Email already exists for a user');

      // Generate temp password
      const TEMP_LEN = 10;
      let tempPassword = '';
      while (tempPassword.length < TEMP_LEN) tempPassword += Math.random().toString(36).slice(2);
      tempPassword = tempPassword.slice(0, TEMP_LEN);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Create user
      const user = await User.create(
        {
          email,
          password_hash: passwordHash,
          display_name: fullName,
          department_name: deptRow.dept_name,
          status: 'active',
        },
        { transaction: t }
      );
      await UserRole.create({ user_id: user.id, role_id: roleRow.id }, { transaction: t });

      // Create LecturerProfile (used for both lecturers and advisors)
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
          phone_number: cand.phone || null,
          personal_email: cand.email || null,
          title: title,
          gender: gender,
        },
        { transaction: t }
      );

      await DepartmentProfile.create(
        { dept_id: deptRow.id, profile_id: advisorProfile.id },
        { transaction: t }
      );

      await cand.update({ status: 'done' }, { transaction: t });

      res.status(201).json({
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
        candidateId: cand.id,
      });
    });
  } catch (error) {
    console.error('[createAdvisorFromCandidate] error', error.message);
    if ((error.message || '').includes('Email already exists')) {
      return res.status(409).json({ message: 'Email already exists for another user' });
    }
    return res
      .status(500)
      .json({ message: 'Failed to create advisor from candidate', error: error.message });
  }
};
