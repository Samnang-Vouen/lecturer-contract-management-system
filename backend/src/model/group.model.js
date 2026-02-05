import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Group = sequelize.define(
  'Group',
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
    num_of_student: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    class_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: 'Classes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'group',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Group;
