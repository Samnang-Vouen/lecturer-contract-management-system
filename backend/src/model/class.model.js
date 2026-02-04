import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const ClassModel = sequelize.define(
  'Class',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    // dept_id optional for now since frontend doesn't send it yet; can enforce later
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'Departments', key: 'id' },
    },
    specialization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'Specialization', key: 'id' },
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    term: { type: DataTypes.STRING(50), allowNull: true }, // e.g. "Term 1"
    year_level: { type: DataTypes.STRING(50), allowNull: true }, // e.g. "Year 2"
    academic_year: { type: DataTypes.STRING(20), allowNull: true }, // e.g. "2025-2026"
    total_class: { type: DataTypes.INTEGER, allowNull: true },
    // Use TEXT with JSON serialization for broader MySQL/MariaDB compatibility (older versions lack JSON type)
    courses: {
      type: DataTypes.TEXT, // stores JSON string
      allowNull: true,
      get() {
        const raw = this.getDataValue('courses');
        if (!raw) return [];
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      },
      set(val) {
        try {
          this.setDataValue('courses', JSON.stringify(Array.isArray(val) ? val : []));
        } catch {
          this.setDataValue('courses', '[]');
        }
      },
    },
  },
  {
    tableName: 'Classes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ClassModel;
