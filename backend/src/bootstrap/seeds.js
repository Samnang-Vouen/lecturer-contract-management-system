import { seedInterviewQuestions } from '../utils/seedInterviewQuestions.js';
import { seedResearchFields } from '../utils/seedResearchFields.js';
import { seedUniversities } from '../utils/seedUniversities.js';
import { seedMajors } from '../utils/seedMajors.js';

export async function runSeeds() {
  await seedInterviewQuestions();
  await seedResearchFields();
  await seedUniversities();
  await seedMajors();
}
