import sequelize from '../../config/db.js';
import { DataTypes } from 'sequelize';

const Evaluation = sequelize.define(
  'Evaluation',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    course_mapping_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Course_Mappings',
        key: 'id',
      },
    },
  },
  {
    tableName: 'evaluation',
    timestamps: false
  }
);

export default Evaluation;
