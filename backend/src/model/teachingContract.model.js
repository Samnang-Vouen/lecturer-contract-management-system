import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Unified contract model supporting both teaching and advisor contracts
const TeachingContract = sequelize.define(
  'TeachingContract',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    lecturer_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    // Contract type determines workflow and fields used
    contract_type: {
      type: DataTypes.ENUM('TEACHING', 'ADVISOR'),
      allowNull: false,
      defaultValue: 'TEACHING',
    },

    academic_year: { type: DataTypes.STRING(20), allowNull: false },
    term: { type: DataTypes.STRING(50), allowNull: false },
    year_level: { type: DataTypes.STRING(50), allowNull: true },

    // Contract effectiveness dates
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },

    // Enhanced status lifecycle for both teaching and advisor workflows
    // - WAITING_LECTURER: contract created, awaiting lecturer signature
    // - WAITING_ADVISOR: (advisor contracts only) lecturer signed, awaiting advisor acceptance
    // - WAITING_MANAGEMENT: lecturer/advisor signed, awaiting management approval
    // - REQUEST_REDO: management requests revisions
    // - COMPLETED: all parties signed
    status: {
      type: DataTypes.ENUM(
        'WAITING_LECTURER',
        'WAITING_ADVISOR',
        'WAITING_MANAGEMENT',
        'REQUEST_REDO',
        'COMPLETED'
      ),
      allowNull: false,
      defaultValue: 'WAITING_LECTURER',
    },

    // Signature tracking
    lecturer_signature_path: { type: DataTypes.STRING(512), allowNull: true },
    management_signature_path: { type: DataTypes.STRING(512), allowNull: true },
    lecturer_signed_at: { type: DataTypes.DATE, allowNull: true },
    management_signed_at: { type: DataTypes.DATE, allowNull: true },
    pdf_path: { type: DataTypes.STRING(512), allowNull: true },

    // Advisor-specific fields (null for teaching contracts)
    hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    max_students: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 6 } },

    // Assigned students stored as JSON array: [{student_id, student_name, student_code}]
    assigned_students: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('assigned_students');
        if (!raw) return [];
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      },
      set(val) {
        try {
          this.setDataValue('assigned_students', JSON.stringify(Array.isArray(val) ? val : []));
        } catch {
          this.setDataValue('assigned_students', '[]');
        }
      },
    },

    // Advisor duties/responsibilities text
    advisor_duties: { type: DataTypes.TEXT, allowNull: true },

    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    // Contract items/duties (stored as JSON array) - used for both types
    items: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('items');
        if (!raw) return [];
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      },
      set(val) {
        try {
          const norm = Array.isArray(val) ? val : [];
          this.setDataValue('items', JSON.stringify(norm));
        } catch {
          this.setDataValue('items', '[]');
        }
      },
    },

    // Management remarks for REQUEST_REDO status
    management_remarks: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'Teaching_Contracts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default TeachingContract;
