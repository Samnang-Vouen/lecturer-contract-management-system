import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const ContractRedoRequest = sequelize.define(
  'ContractRedoRequest',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    contract_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    requester_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    requester_role: {
      type: DataTypes.ENUM('LECTURER', 'MANAGEMENT'),
      allowNull: false,
    },

    message: { type: DataTypes.TEXT, allowNull: false },

    resolved_at: { type: DataTypes.DATE, allowNull: true },
    resolved_by_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: 'contract_redo_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ContractRedoRequest;
