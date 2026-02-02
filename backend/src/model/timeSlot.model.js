import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export const TimeSlot = sequelize.define(
  'TimeSlot',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    label: { type: DataTypes.STRING, allowNull: false },
    order_index: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'time_slots', timestamps: false }
);