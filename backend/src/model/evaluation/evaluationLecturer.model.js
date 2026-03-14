import sequelize from '../../config/db.js';
import { DataTypes } from 'sequelize';

const EvaluationLecturer = sequelize.define(
  'EvaluationLecturer',
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

    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'evaluation_lecturer',
    timestamps: false,
  }
);

export default EvaluationLecturer;
