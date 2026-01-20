import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Lecturer performance and compensation tracking
// Combines raw data references with calculated performance metrics
// Business logic for calculations handled in service layer
const HourRating = sequelize.define(
  'HourRating',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

    lecturer_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One record per lecturer
      references: {
        model: 'lecturer_profiles',
        key: 'id',
      },
    },

    // Current compensation
    current_hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },

    // Accumulated teaching hours (updated from schedules/contracts)
    total_teaching_hours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

    // Evaluation metrics - RAW DATA (not calculated here)
    // These are SUMMED or COUNTED from Evaluation table in service layer
    total_feedback_points: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    number_of_evaluations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    number_of_terms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // CALCULATED FIELDS (computed in service layer, cached here)
    // Average feedback score = total_feedback_points / number_of_evaluations
    average_feedback_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Calculated: total_feedback_points / number_of_evaluations',
    },

    // Rate increase eligibility (business rule: average >= 2.5)
    rate_increase_eligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Calculated: average_feedback_score >= 2.5',
    },

    // Proposed new rate (calculated based on performance algorithm)
    new_calculated_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Calculated by service layer based on performance metrics',
    },

    // Last time calculations were refreshed
    last_calculated_at: { type: DataTypes.DATE, allowNull: true },

    // Administrative notes and decisions
    admin_remarks: { type: DataTypes.TEXT, allowNull: true },

    // Rate change approval status
    rate_change_status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Applied'),
      allowNull: false,
      defaultValue: 'Pending',
    },

    rate_change_approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    rate_change_approved_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'Hour_Ratings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default HourRating;
