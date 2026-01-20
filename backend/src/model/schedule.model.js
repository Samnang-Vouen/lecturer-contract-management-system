import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

// Schedule generated after course mapping is finalized
// Stores complete teaching schedule with time, location, and assignment details
const Schedule = sequelize.define(
  'Schedule',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

    lecturer_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecturer_profiles',
        key: 'id',
      },
    },

    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id',
      },
    },

    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'Classes',
        key: 'id',
      },
    },

    academic_year: { type: DataTypes.STRING(20), allowNull: false }, // e.g., "2025-2026"
    semester: { type: DataTypes.STRING(50), allowNull: false }, // e.g., "Fall", "Spring", "Term 1"

    // Group/section identifier within a class
    group_number: { type: DataTypes.INTEGER, allowNull: true },

    // Schedule timing
    day_of_week: {
      type: DataTypes.ENUM(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ),
      allowNull: false,
    },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },

    // Location
    room: { type: DataTypes.STRING(100), allowNull: true }, // e.g., "Room 301", "Lab A"
    building: { type: DataTypes.STRING(100), allowNull: true }, // e.g., "Engineering Building"

    // Schedule type
    session_type: {
      type: DataTypes.ENUM('Lecture', 'Lab', 'Tutorial', 'Workshop'),
      allowNull: false,
      defaultValue: 'Lecture',
    },

    // Status tracking
    status: {
      type: DataTypes.ENUM('Draft', 'Published', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Draft',
    },

    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'Schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      // Composite index for querying schedules by academic period
      { fields: ['academic_year', 'semester'], name: 'idx_academic_period' },
      // Index for lecturer schedules
      {
        fields: ['lecturer_profile_id', 'academic_year', 'semester'],
        name: 'idx_lecturer_schedule',
      },
    ],
  }
);

export default Schedule;
