import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const StudentComment = sequelize.define(
  'StudentComment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    evaluation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'evaluation',
        key: 'id',
      },
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'student_comment',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default StudentComment;
