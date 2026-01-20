import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const LecturerCourse = sequelize.define(
  'LecturerCourse',
  {
    // Standard signed integers to align with LecturerProfile.id and Course.id
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    lecturer_profile_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'Lecturer_Courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default LecturerCourse;
