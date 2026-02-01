import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Schedule = sequelize.define(
  'Schedule',
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

    day_of_week: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
      allowNull: true,
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
      allowNull: true,
    },

    session_type: {
      type: DataTypes.ENUM('Theory', 'Lab', 'Lab + Theory'),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Schedule;
