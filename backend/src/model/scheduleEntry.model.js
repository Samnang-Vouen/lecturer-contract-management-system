import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ScheduleEntry = sequelize.define(
  'ScheduleEntry',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    course_mapping_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Course_Mappings',
        key: 'id',
      },
    },

    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'schedules',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    day_of_week: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      allowNull: false,
    },

    time_slot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'time_slots',
        key: 'id',
      },
    },

    room: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    session_type: {
      type: DataTypes.ENUM('Theory', 'Lab', 'Lab + Theory'),
      allowNull: false,
    },
  },
  {
    tableName: 'schedule_entry',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ScheduleEntry;
