import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Separate table for advisor/lecture supervision contracts (capstone/internship)
const AdvisorContract = sequelize.define(
  'AdvisorContract',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

    lecturer_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    academic_year: { type: DataTypes.STRING(20), allowNull: false },

    // Role within the supervision contract
    role: {
      type: DataTypes.ENUM('ADVISOR', 'LECTURE'),
      allowNull: false,
    },

    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    // Responsibilities selection
    capstone_1: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    capstone_2: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    internship_1: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    internship_2: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    hours_per_student: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    // Stored as JSON array: [{ student_name, student_code, project_title, company_name }]
    students: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('students');
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
      set(val) {
        try {
          this.setDataValue('students', JSON.stringify(Array.isArray(val) ? val : []));
        } catch {
          this.setDataValue('students', '[]');
        }
      },
    },

    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },

    // Stored as JSON array of strings
    duties: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('duties');
        if (!raw) return [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
      set(val) {
        try {
          this.setDataValue('duties', JSON.stringify(Array.isArray(val) ? val : []));
        } catch {
          this.setDataValue('duties', '[]');
        }
      },
    },

    join_judging_hours: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    // E-signature paths (optional)
    advisor_signature_path: { type: DataTypes.STRING(512), allowNull: true },
    management_signature_path: { type: DataTypes.STRING(512), allowNull: true },
    advisor_signed_at: { type: DataTypes.DATE, allowNull: true },
    management_signed_at: { type: DataTypes.DATE, allowNull: true },

    status: {
      type: DataTypes.ENUM('DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO', 'COMPLETED',  'CONTRACT_ENDED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },

    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'Advisor_Contracts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default AdvisorContract;
