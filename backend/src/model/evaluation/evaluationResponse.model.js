import sequelize from '../../config/db.js';
import { DataTypes } from 'sequelize';

const EvaluationResponse = sequelize.define(
  'EvaluationResponse',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    lecturer_evaluation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecturer_evaluation',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },

    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'evaluation_question',
        key: 'id',
      },
    },

    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
      },
    },
  },
  {
    tableName: 'evaluation_response',
    timestamps: false,
  }
);

export default EvaluationResponse;
