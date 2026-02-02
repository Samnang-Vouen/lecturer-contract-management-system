import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Represents an assignment (or potential assignment) of a lecturer to teach a course for a class (group count etc.)
const CourseMapping = sequelize.define(
  'CourseMapping',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dept_id: { type: DataTypes.INTEGER, allowNull: true }, // denormalized for quick filters
    // Match Classes.id which is defined as INTEGER.UNSIGNED to avoid FK incompatibility
    class_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    lecturer_profile_id: { type: DataTypes.INTEGER, allowNull: true },
    academic_year: { type: DataTypes.STRING(20), allowNull: true },
    term: { type: DataTypes.STRING(50), allowNull: true },
    year_level: { type: DataTypes.STRING(50), allowNull: true },
    group_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    type_hours: {
      type: DataTypes.ENUM('Theory (15h)', 'Lab (30h)', 'Only 15h', 'Only 30h'),
      allowNull: false,
      defaultValue: 'Theory (15h)',
    },
    // New fields to support selecting both theories and labs with separate groups
    theory_hours: { type: DataTypes.STRING(10), allowNull: true }, // '15h' | '30h'
    theory_groups: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    theory_15h_combined: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }, // metadata for pairing 15h groups
    lab_hours: { type: DataTypes.STRING(10), allowNull: true }, // typically '30h'
    lab_groups: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    availability: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM('Pending', 'Contacting', 'Accepted', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    contacted_by: { type: DataTypes.STRING(255), allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'Course_Mappings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default CourseMapping;
