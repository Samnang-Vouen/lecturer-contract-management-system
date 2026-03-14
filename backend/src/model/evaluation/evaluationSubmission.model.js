import sequelize from '../../config/db.js';
import { DataTypes } from 'sequelize';

const EvaluationSubmission = sequelize.define(
  'EvaluationSubmission',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    evaluation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'evaluation',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },

    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    group_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'evaluation_submission',
    timestamps: false,
  }
);

export default EvaluationSubmission;
