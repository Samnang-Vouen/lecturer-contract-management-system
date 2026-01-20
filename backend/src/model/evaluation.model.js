import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Student or group evaluations of lecturers
// Raw input data - calculations done in service layer
const Evaluation = sequelize.define(
  'Evaluation',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

    lecturer_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecturer_profiles',
        key: 'id',
      },
    },

    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id',
      },
    },

    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'Classes',
        key: 'id',
      },
    },

    // Group/section identifier
    group_number: { type: DataTypes.INTEGER, allowNull: true },

    academic_year: { type: DataTypes.STRING(20), allowNull: false },
    semester: { type: DataTypes.STRING(50), allowNull: false },

    // Rating from 1 to 5
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
      },
    },

    // Who evaluated (student name, student ID, or group identifier)
    evaluated_by: { type: DataTypes.STRING(255), allowNull: true },
    evaluator_type: {
      type: DataTypes.ENUM('Student', 'Group', 'Peer', 'Admin'),
      allowNull: false,
      defaultValue: 'Student',
    },

    // Qualitative feedback
    feedback_text: { type: DataTypes.TEXT, allowNull: true },

    // Evaluation categories for detailed analysis
    teaching_quality: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: { min: 1.0, max: 5.0 },
    },
    communication: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: { min: 1.0, max: 5.0 },
    },
    course_organization: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: { min: 1.0, max: 5.0 },
    },
    student_engagement: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: { min: 1.0, max: 5.0 },
    },
    assessment_fairness: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: { min: 1.0, max: 5.0 },
    },

    // Status tracking
    status: {
      type: DataTypes.ENUM('Pending', 'Submitted', 'Reviewed'),
      allowNull: false,
      defaultValue: 'Submitted',
    },

    // Anonymous flag
    is_anonymous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'Evaluations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Index for lecturer performance queries
      {
        fields: ['lecturer_profile_id', 'academic_year', 'semester'],
        name: 'idx_lecturer_evaluation',
      },
      // Index for course evaluations
      { fields: ['course_id', 'academic_year', 'semester'], name: 'idx_course_evaluation' },
    ],
  }
);

export default Evaluation;
