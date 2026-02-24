import ClassModel from '../model/class.model.js';
import Department from '../model/department.model.js';
import Group from '../model/group.model.js';
import Specialization from '../model/specialization.model.js';

// GET /api/groups
export const getGroup = async (req, res) => {
  try {
    const { class_id, class_name, dept_name, specialization } = req.query;

    // Simple direct filter by class_id when provided
    if (class_id !== undefined && class_id !== null && String(class_id).trim() !== '') {
      const parsed = Number.parseInt(String(class_id), 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ message: 'Invalid class_id' });
      }
      const group = await Group.findAll({
        where: { class_id: parsed },
        order: [['created_at', 'ASC']],
      });
      return res.status(200).json({ group, message: 'Group retrieved successfully.' });
    }

    const group = await Group.findAll({
      include: [
        {
          model: ClassModel,
          attributes: ['name'],
          required: !!class_name || !!specialization || !!dept_name,
          where: class_name ? { name: class_name } : undefined,
          include: [
            {
              model: Specialization,
              attributes: ['name'],
              required: !!specialization || !!dept_name,
              where: specialization ? { name: specialization } : undefined,
              include: [
                {
                  model: Department,
                  attributes: ['dept_name'],
                  required: !!dept_name,
                  where: dept_name ? { dept_name } : undefined,
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ group, message: 'Group retrieved successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// POST /api/groups
export const createGroup = async (req, res) => {
  try {
    const { class_id, name, num_of_student } = req.body;

    if (!class_id) return res.status(400).json({ message: 'Required class_id' });
    if (!name) return res.status(400).json({ message: 'Required name' });
    if (!num_of_student) return res.status(400).json({ message: 'Required num_of_student' });

    const classModel = await ClassModel.findByPk(class_id);
    if (!classModel) return res.status(404).json({ message: 'Class Model not found' });

    const group = await Group.create({
      class_id,
      name,
      num_of_student,
    });

    return res.status(201).json({ group, message: 'Group created successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// PUT /api/groups/:id
export const editGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, name, num_of_student } = req.body;

    const existingGroup = await Group.findByPk(id);
    if (!existingGroup) return res.status(404).json({ message: 'Group not found' });

    if (!class_id) return res.status(400).json({ message: 'Required class_id' });
    if (!name) return res.status(400).json({ message: 'Required name' });
    if (!num_of_student) return res.status(400).json({ message: 'Required num_of_student' });

    const classModel = await ClassModel.findByPk(class_id);
    if (!classModel) return res.status(404).json({ message: 'Class Model not found' });

    await existingGroup.update({
      class_id,
      name,
      num_of_student,
    });

    return res.status(200).json({ existingGroup, message: 'Group updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// DELETE /api/groups/:id
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const existingGroup = await Group.findByPk(id);
    if (!existingGroup) return res.status(404).json({ message: 'Group not found' });

    await existingGroup.destroy();

    return res.status(200).json({ message: 'Group deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};
