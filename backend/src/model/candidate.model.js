import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Candidate = sequelize.define(
  'Candidate',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    positionAppliedFor: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    interviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'interview', 'discussion', 'accepted', 'rejected', 'done'),
      allowNull: false,
      defaultValue: 'pending',
    },
    interviewScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rateReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evaluator: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'Candidates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Candidate;
