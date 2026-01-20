import { InterviewQuestion } from '../model/interviewQuestion.model.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

const seedData = {
  /* 'Academic & Professional Background': [
    'Can you tell us about your educational qualifications and areas of expertise?',
    'What research or publications have you been involved in?',
    'How have your past teaching experiences prepared you for this role?'
  ],
  'Teaching Philosophy & Methodology': [
    'How would you describe your teaching philosophy?',
    'How do you make complex topics easier for students to understand?',
    'Can you share an example of an innovative teaching method you have used?',
    'How do you engage students who are not actively participating?'
  ],
  'Curriculum & Assessment': [
    'How do you design lesson plans to meet learning objectives?',
    'How do you assess student performance fairly and effectively?',
    'How do you integrate technology or digital tools in your teaching?',
    'Can you adapt your curriculum for different learning levels?'
  ],
  'Student Engagement & Support': [
    'How do you handle students who are struggling academically?',
    'How do you motivate students to take responsibility for their own learning?',
    'What strategies do you use to encourage classroom participation?'
  ],
  'Research & Professional Development': [
    'How do you incorporate current research trends into your teaching?',
    'Are you currently working on any research projects?',
    'How do you stay updated in your field?'
  ],
  'Collaboration & Institutional Contribution': [
    'How do you work with other faculty members to improve courses?',
    'How can you contribute to the department outside of teaching?',
    'Are you open to mentoring students or leading student clubs/projects?'
  ], */
  'Adaptability & Problem-Solving': [
    "How do you adapt when a lesson isn't going as planned?",
    'Tell us about a time you had to deal with a difficult student or classroom challenge.',
    'How do you manage cultural diversity in the classroom?',
  ],
  'Vision & Fit': [
    'Why do you want to join our institution?',
    'Where do you see yourself in the next 3–5 years as an educator?',
    'How do you define success in teaching?',
  ],
};

// Export the currently active (uncommented) categories so API can filter
export const activeInterviewCategories = Object.keys(seedData);

export async function seedInterviewQuestions() {
  if (process.env.SEED_INTERVIEW_QUESTIONS !== 'true') return; // fast skip
  const activeCategories = Object.keys(seedData);
  const existingCount = await InterviewQuestion.count();
  if (existingCount && process.env.SEED_FORCE !== 'true') {
    console.log(`[seedInterviewQuestions] Skip (already have ${existingCount} records).`);
    return;
  }
  if (existingCount && process.env.SEED_FORCE === 'true') {
    // Clean up candidate responses that reference old questions before deleting questions
    await sequelize.query(
      'DELETE FROM candidate_questions WHERE question_id NOT IN (SELECT id FROM `interview-questions`)'
    );
    await InterviewQuestion.destroy({ where: {} });
    console.log(
      '[seedInterviewQuestions] Cleared existing questions and orphaned responses (SEED_FORCE=true)'
    );
  }
  if (process.env.CLEAN_INTERVIEW_QUESTIONS === 'true') {
    const deleted = await InterviewQuestion.destroy({
      where: { category: { [Op.notIn]: activeCategories } },
    });
    if (deleted) console.log(`[seedInterviewQuestions] Removed ${deleted} outdated questions`);
  }
  let inserted = 0;
  for (const [category, questions] of Object.entries(seedData)) {
    for (const text of questions) {
      const canonical = text.toLowerCase().trim().replace(/\s+/g, ' ');
      const [rec, created] = await InterviewQuestion.findOrCreate({
        where: { canonical_text: canonical, category },
        defaults: {
          question_text: text,
          canonical_text: canonical,
          category,
          is_default: true,
          is_custom: false,
        },
      });
      if (created) inserted++;
    }
  }
  console.log(
    `[seedInterviewQuestions] Done. Inserted ${inserted}. Total now ${await InterviewQuestion.count()}`
  );
}
