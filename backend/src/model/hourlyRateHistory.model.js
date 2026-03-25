import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const HourlyRateHistory = sequelize.define(
  'HourlyRateHistory',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'Hourly_Rate_Histories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['lecturer_profile_id', 'academic_year'],
        name: 'uniq_hourly_rate_history_profile_year',
      },
    ],
  }
);

export default HourlyRateHistory;