import Candidate from '../model/candidate.model.js';
import { Department } from '../model/index.js';
import { Op } from 'sequelize';

// GET /api/candidates - list all candidates
export const getCandidates = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit =
      parseInt(req.query.limit, 10) > 0 ? Math.min(parseInt(req.query.limit, 10), 100) : 10; // cap at 100
    const offset = (page - 1) * limit;

    const where = {};
    // Department scoping: admins only see their own department's candidates
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) where.dept_id = dept.id;
      else where.dept_id = -1; // no results fallback
    }

    // Optional filter by status (e.g., accepted) and search by name/email
    const status = (req.query.status || '').trim();
    if (status) where.status = status;
    const search = (req.query.search || '').trim();

    const { rows, count } = await Candidate.findAndCountAll({
      where: search
        ? {
            ...where,
            [Op.or]: [
              { fullName: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
            ],
          }
        : where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      data: rows,
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1,
      hasMore: page * limit < count,
    });
  } catch (error) {
    console.error('getCandidates error:', error);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
};

// POST /api/candidates - create a candidate
export const createCandidate = async (req, res) => {
  try {
    const { fullName, email, phone, positionAppliedFor, interviewDate } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ message: 'fullName and email are required' });
    }
    if (!String(email).includes('@')) {
      return res.status(400).json({ message: 'Email must contain @' });
    }
    // Determine department from recruiting admin
    let dept_id = null;
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOrCreate({
        where: { dept_name: req.user.department_name },
        defaults: { dept_name: req.user.department_name },
      });
      dept_id = dept[0].id;
    }
    const created = await Candidate.create({
      fullName,
      email,
      phone,
      positionAppliedFor,
      interviewDate: interviewDate ? new Date(interviewDate) : null,
      status: 'pending',
      dept_id,
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('createCandidate error:', error);
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to create candidate' });
  }
};

// PATCH /api/candidates/:id - update candidate fields
export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      'fullName',
      'email',
      'phone',
      'positionAppliedFor',
      'interviewDate',
      'status',
      'interviewScore',
      'rejectionReason',
      'hourlyRate',
      'rateReason',
      'evaluator',
    ];

    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    if ('email' in updates && updates.email != null && !String(updates.email).includes('@')) {
      return res.status(400).json({ message: 'Email must contain @' });
    }

    if ('interviewDate' in updates && updates.interviewDate) {
      updates.interviewDate = new Date(updates.interviewDate);
    }

    const candidate = await Candidate.findByPk(id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept && candidate.dept_id !== dept.id)
        return res.status(403).json({ message: 'Access denied: different department' });
    }

    await candidate.update(updates);
    res.status(200).json(candidate);
  } catch (error) {
    console.error('updateCandidate error:', error);
    res.status(500).json({ message: 'Failed to update candidate' });
  }
};

// DELETE /api/candidates/:id - delete candidate
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByPk(id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept && candidate.dept_id !== dept.id)
        return res.status(403).json({ message: 'Access denied: different department' });
    }
    await candidate.destroy();
    res.status(200).json({ message: 'Candidate deleted' });
  } catch (error) {
    console.error('deleteCandidate error:', error);
    res.status(500).json({ message: 'Failed to delete candidate' });
  }
};
