import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const LecturerProfile = sequelize.define(
  'LecturerProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
    },
    employee_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // New fields for title and gender
    title: {
      type: DataTypes.ENUM('Mr', 'Ms', 'Mrs', 'Dr', 'Prof'),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    full_name_english: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    full_name_khmer: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    personal_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    place: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    latest_degree: {
      type: DataTypes.ENUM('BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'OTHER'),
      allowNull: true,
    },
    degree_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    major: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    university: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    join_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: true,
    },
    cv_uploaded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    cv_file_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    qualifications: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    research_fields: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    short_bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    course_syllabus: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    upload_syllabus: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pay_roll_in_riel: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    storage_folder: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    onboarding_complete: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    tableName: 'lecturer_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default LecturerProfile;
