import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const Course = sequelize.define(
  'Course',
  {
    // Use signed INTEGER to match Departments.id (avoids FK incompatible error)
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    course_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'Courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Composite uniqueness within a department
      { unique: true, fields: ['dept_id', 'course_code'], name: 'uniq_courses_dept_code' },
      { unique: true, fields: ['dept_id', 'course_name'], name: 'uniq_courses_dept_name' },
    ],
  }
);

export default Course;
