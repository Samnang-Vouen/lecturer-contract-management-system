import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const ResearchField = sequelize.define(
  'ResearchField',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'research_fields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ResearchField;
