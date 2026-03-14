import sequelize from '../../config/db.js';
import { DataTypes } from 'sequelize';

const LecturerEvaluation = sequelize.define(
  'LecturerEvaluation',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    submission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'evaluation_submission',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },

    lecturer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecturer_profiles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    tableName: 'lecturer_evaluation',
    timestamps: false,
  }
);

export default LecturerEvaluation;
