import { DataTypes } from "sequelize";
import sequelize from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED, // Match User.id type
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('contract_created', 'contract_signed', 'contract_request_redo', 'status_change'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  contract_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Notifications',
  indexes: [
    { fields: ['user_id', 'readAt'] },
    { fields: ['user_id', 'createdAt'] }
  ]
});

export default Notification;