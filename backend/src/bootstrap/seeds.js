import { seedInterviewQuestions } from '../utils/seedInterviewQuestions.js';
import { seedResearchFields } from '../utils/seedResearchFields.js';
import { seedUniversities } from '../utils/seedUniversities.js';
import { seedMajors } from '../utils/seedMajors.js';
import { seedDepartments } from '../scripts/seedDepartments.js';
import { seedSpecializations } from '../scripts/seedSpecializations.js';
import { seedTimeSlots } from '../scripts/seedTimeSlots.js';

export async function runSeeds() {
  await seedInterviewQuestions();
  await seedResearchFields();
  await seedUniversities();
  await seedMajors();
  await seedDepartments();
  await seedSpecializations();
  await seedTimeSlots();
}
