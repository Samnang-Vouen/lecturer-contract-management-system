import EvaluationQuestion from '../model/evaluationQuestion.model.js';

const evaluationQuestionsData = [
  { question_text: "How would you rate the clarity and organization of the course content and materials? (Wellorganized, understandable, need to improve)", order_no: 1 },
  { question_text: "Do you feel the instructor effectively engages students through various teaching techniques?", order_no: 2 },
  { question_text: "Do you feel comfortable asking questions or seeking clarification from the instructor?", order_no: 3 },
  { question_text: "Do you receive timely and constructive feedback on your assignments and assessments?", order_no: 4 },
  { question_text: "Are the lecturer's teaching methods effective?", order_no: 5 },
  // Add more evaluation questions here
];

export const seedEvaluationQuestions = async () => {
  try {
    console.log('[seedEvaluationQuestions] Syncing EvaluationQuestion model...');
    await EvaluationQuestion.sync();
    console.log('[seedEvaluationQuestions] Model synced successfully');

    const existingCount = await EvaluationQuestion.count();

    if (existingCount > 0) {
      console.log(
        `[seedEvaluationQuestions] ${existingCount} evaluation questions already exist, skipping seed`
      );
      return;
    }

    console.log('[seedEvaluationQuestions] Seeding evaluation questions...');

    await EvaluationQuestion.bulkCreate(evaluationQuestionsData, {
      ignoreDuplicates: true,
    });

    const totalCount = await EvaluationQuestion.count();
    console.log(`[seedEvaluationQuestions] Successfully seeded ${totalCount} evaluation questions`);
  } catch (error) {
    console.error('[seedEvaluationQuestions] Error seeding evaluation questions:', error.message);
    // Don't fail the entire startup if evaluation questions seeding fails
  }
};
