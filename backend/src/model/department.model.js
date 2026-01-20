import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const Department = sequelize.define(
  'Department',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dept_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'name',
    },
  },
  {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Department;
