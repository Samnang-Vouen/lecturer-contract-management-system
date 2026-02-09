import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const EvaluationQuestion = sequelize.define(
  'EvaluationQuestion',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    question_text: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    order_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'evaluation_question',
    timestamps: false,
  }
);

export default EvaluationQuestion;
