import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const ContractItem = sequelize.define(
  'ContractItem',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    contract_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    duties: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: 'contract_items',
    timestamps: false,
  }
);

export default ContractItem;
