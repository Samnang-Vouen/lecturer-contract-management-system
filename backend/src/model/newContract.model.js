import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Lightweight contracts table for itemized lists (separate from legacy Contracts/Teaching_Contracts)
const NewContract = sequelize.define(
  'NewContract',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    lecturer_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'Simple_Contracts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default NewContract;
 