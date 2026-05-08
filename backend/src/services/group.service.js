import ClassModel from '../model/class.model.js';
import Department from '../model/department.model.js';
import Group from '../model/group.model.js';
import Specialization from '../model/specialization.model.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function listGroups({ class_id, class_name, dept_name, specialization, isAdmin, adminDeptName }) {
  const effectiveDeptName = isAdmin
    ? String(adminDeptName || '').trim()
    : String(dept_name || '').trim();

  if (isAdmin && !effectiveDeptName) {
    return { group: [], message: 'Group retrieved successfully.' };
  }

  let parsedClassId = null;
  if (class_id !== undefined && class_id !== null && String(class_id).trim() !== '') {
    parsedClassId = Number.parseInt(String(class_id), 10);
    if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
      throw new ValidationError('Invalid class_id', { payload: { message: 'Invalid class_id' } });
    }
  }

  const group = await Group.findAll({
    include: [
      {
        model: ClassModel,
        attributes: ['name', 'start_term', 'end_term'],
        required: !!parsedClassId || !!class_name || !!specialization || !!effectiveDeptName,
        where: {
          ...(parsedClassId ? { id: parsedClassId } : {}),
          ...(class_name ? { name: class_name } : {}),
        },
        include: [
          {
            model: Specialization,
            attributes: ['name'],
            required: !!specialization || !!effectiveDeptName,
            where: specialization ? { name: specialization } : undefined,
            include: [
              {
                model: Department,
                attributes: ['dept_name'],
                required: !!effectiveDeptName,
                where: effectiveDeptName ? { dept_name: effectiveDeptName } : undefined,
              },
            ],
          },
        ],
      },
    ],
    order: [['created_at', 'ASC']],
  });

  return { group, message: 'Group retrieved successfully.' };
}

export async function createGroup({ class_id, name, num_of_student }) {
  if (!class_id) {
    throw new ValidationError('Required class_id', { payload: { message: 'Required class_id' } });
  }
  if (!name) {
    throw new ValidationError('Required name', { payload: { message: 'Required name' } });
  }
  if (!num_of_student) {
    throw new ValidationError('Required num_of_student', { payload: { message: 'Required num_of_student' } });
  }

  const classModel = await ClassModel.findByPk(class_id);
  if (!classModel) {
    throw new NotFoundError('Class Model not found', { payload: { message: 'Class Model not found' } });
  }

  const group = await Group.create({ class_id, name, num_of_student });
  return { group, message: 'Group created successfully.' };
}

export async function updateGroup(id, { class_id, name, num_of_student }) {
  const existingGroup = await Group.findByPk(id);
  if (!existingGroup) {
    throw new NotFoundError('Group not found', { payload: { message: 'Group not found' } });
  }
  if (!class_id) {
    throw new ValidationError('Required class_id', { payload: { message: 'Required class_id' } });
  }
  if (!name) {
    throw new ValidationError('Required name', { payload: { message: 'Required name' } });
  }
  if (!num_of_student) {
    throw new ValidationError('Required num_of_student', { payload: { message: 'Required num_of_student' } });
  }

  const classModel = await ClassModel.findByPk(class_id);
  if (!classModel) {
    throw new NotFoundError('Class Model not found', { payload: { message: 'Class Model not found' } });
  }

  await existingGroup.update({ class_id, name, num_of_student });
  return { existingGroup, message: 'Group updated successfully.' };
}

export async function deleteGroup(id) {
  const existingGroup = await Group.findByPk(id);
  if (!existingGroup) {
    throw new NotFoundError('Group not found', { payload: { message: 'Group not found' } });
  }
  await existingGroup.destroy();
  return { message: 'Group deleted successfully.' };
}
