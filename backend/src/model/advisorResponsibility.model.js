import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Junction table linking advisor contracts to their responsibilities
// Allows advisor contracts to have multiple advising responsibilities
const AdvisorResponsibility = sequelize.define(
  'AdvisorResponsibility',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    contract_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Teaching_Contracts',
        key: 'id',
      },
    },
    responsibility_type: {
      type: DataTypes.ENUM('Capstone 1', 'Capstone 2', 'Internship 1', 'Internship 2'),
      allowNull: false,
    },
    // Optional additional details per responsibility
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'Advisor_Responsibilities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Prevent duplicate responsibility assignments per contract
      {
        unique: true,
        fields: ['contract_id', 'responsibility_type'],
        name: 'uniq_contract_responsibility',
      },
    ],
  }
);

export default AdvisorResponsibility;
