import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export const CandidateQuestion = sequelize.define(
  'CandidateQuestion',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    candidate_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    question_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    noted: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'candidate_questions', // Matches your database schema
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at', // Matches your schema (update_at not updated_at)
  }
);

export default CandidateQuestion;
