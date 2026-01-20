import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const DepartmentProfile = sequelize.define(
  'DepartmentProfile',
  {
    dept_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    profile_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'lecturer_profiles',
        key: 'id',
      },
    },
  },
  {
    tableName: 'department_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default DepartmentProfile;
