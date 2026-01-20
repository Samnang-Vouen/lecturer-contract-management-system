import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const TeachingContractCourse = sequelize.define(
  'TeachingContractCourse',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    contract_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: true },
    class_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    course_name: { type: DataTypes.STRING(255), allowNull: false },
    year_level: { type: DataTypes.STRING(50), allowNull: true },
    term: { type: DataTypes.STRING(50), allowNull: false },
    academic_year: { type: DataTypes.STRING(20), allowNull: false },
    hours: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: 'Teaching_Contract_Courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default TeachingContractCourse;
