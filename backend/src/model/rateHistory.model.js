import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Historical record of hourly rate changes for a lecturer
// Normalized separate table instead of JSON field
const RateHistory = sequelize.define(
  'RateHistory',
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

    // Rate information
    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    // When this rate was effective
    effective_from: { type: DataTypes.DATE, allowNull: false },
    effective_to: { type: DataTypes.DATE, allowNull: true }, // null means current

    // Reason for rate change
    change_reason: {
      type: DataTypes.ENUM(
        'Initial',
        'Performance',
        'Contract Negotiation',
        'Annual Review',
        'Promotion',
        'Market Adjustment',
        'Administrative'
      ),
      allowNull: false,
      defaultValue: 'Initial',
    },

    // Supporting data for the change
    academic_year: { type: DataTypes.STRING(20), allowNull: true },
    average_feedback_score: { type: DataTypes.DECIMAL(3, 2), allowNull: true },

    // Who approved the change
    approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'Rate_History',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Index for lecturer rate history queries
      { fields: ['lecturer_profile_id', 'effective_from'], name: 'idx_lecturer_rate_history' },
    ],
  }
);

export default RateHistory;
