import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'name',
    },
  },
  {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Role;
