import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const LecturerResearchField = sequelize.define(
  'LecturerResearchField',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lecturer_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecturer_profiles',
        key: 'id',
      },
    },
    research_field_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'research_fields',
        key: 'id',
      },
    },
  },
  {
    tableName: 'Lecturer_Research_Fields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default LecturerResearchField;
