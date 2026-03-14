import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Schedule = sequelize.define(
  'Schedule',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'group',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., "DS - Group 1 - Term 1 2024-2025"',
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Schedule;
