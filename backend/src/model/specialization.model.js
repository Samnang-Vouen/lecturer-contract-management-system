import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Specialization = sequelize.define(
  'Specialization',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dept_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'departments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'specialization',
  }
);

export default Specialization;
