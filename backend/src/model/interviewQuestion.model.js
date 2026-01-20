import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export const InterviewQuestion = sequelize.define(
  'InterviewQuestion',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    question_text: { type: DataTypes.TEXT, allowNull: false },
    // canonical_text is a normalized (lowercased, trimmed, single-spaced) version used to prevent duplicates
    canonical_text: { type: DataTypes.STRING(500), allowNull: false },
    category: {
      type: DataTypes.ENUM(
        'Academic & Professional Background',
        'Teaching Philosophy & Methodology',
        'Curriculum & Assessment',
        'Student Engagement & Support',
        'Research & Professional Development',
        'Collaboration & Institutional Contribution',
        'Adaptability & Problem-Solving',
        'Vision & Fit'
      ),
      allowNull: false,
    },
    is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_custom: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'interview-questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Add a composite unique index at runtime (if not already existing) to reduce duplicate canonical questions per category.
// This is a defensive measure; proper migration would be ideal in production.
try {
  (async () => {
    // Avoid alter:true here to prevent repeated index churn; base sync only if table missing
    await InterviewQuestion.sync({ alter: false });
    const qi = await sequelize.getQueryInterface();
    // Inspect columns to add missing ones gracefully (for existing DB without migration tooling)
    const [cols] = await sequelize.query('SHOW COLUMNS FROM `Interview-Questions`');
    const colNames = cols.map((c) => c.Field);
    const pendingAlters = [];
    if (!colNames.includes('canonical_text'))
      pendingAlters.push(
        'ADD COLUMN `canonical_text` VARCHAR(500) NOT NULL DEFAULT "" AFTER `question_text`'
      );
    if (!colNames.includes('is_default'))
      pendingAlters.push('ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 1');
    if (!colNames.includes('is_custom'))
      pendingAlters.push('ADD COLUMN `is_custom` TINYINT(1) NOT NULL DEFAULT 0');
    if (pendingAlters.length) {
      const alterSql = `ALTER TABLE \`Interview-Questions\` ${pendingAlters.join(', ')}`;
      await sequelize.query(alterSql);
    }
    // Ensure no empty canonical_text rows (populate from question_text)
    await sequelize.query(
      "UPDATE `Interview-Questions` SET `canonical_text` = LOWER(TRIM(REGEXP_REPLACE(question_text, ' +', ' '))) WHERE `canonical_text` = '' OR `canonical_text` IS NULL"
    );
    const indexes = await qi.showIndex('Interview-Questions');
    const exists = indexes.some((i) => i.name === 'uniq_category_canonical');
    if (!exists) {
      try {
        await qi.addIndex('interview_questions', ['category', 'canonical_text'], {
          unique: true,
          name: 'uniq_category_canonical',
        });
      } catch {}
    }
  })();
} catch (e) {
  console.warn('Could not migrate interview_questions structure', e?.message);
}

export default InterviewQuestion;
