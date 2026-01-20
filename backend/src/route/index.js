import authRoutes from './auth.route.js';
import candidateRoutes from './candidate.route.js';
import dashboardRoutes from './dashboard.route.js';
import profileRoutes from './profile.route.js';
import interviewRoutes from './interview.route.js';
import userRoutes from './user.route.js';
import lecturerRoutes from './lecturer.route.js';
import lecturerSelfRoutes from './lecturerSelf.route.js';
import lecturerProfileRoutes from './lecturerProfile.route.js';
import onboardingRoutes from './onboarding.route.js';
import classRoutes from './class.route.js';
import courseRoutes from './course.route.js';
import catalogRoutes from './catalog.route.js';
import courseMappingRoutes from './courseMapping.route.js';
import researchFieldRoutes from './researchField.route.js';
import universityRoutes from './university.route.js';
import majorRoutes from './major.route.js';
import teachingContractRoutes from './teachingContract.route.js';
import contractsRoutes from './contracts.route.js';
import lecturerDashboardRoutes from './lecturerDashboard.route.js';

export function registerRoutes(app) {
  // IMPORTANT: Mount the more specific lecturer onboarding route BEFORE the generic /api/lecturers route.
  app.use('/api/auth', authRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/interview-questions', interviewRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/lecturers/onboarding', onboardingRoutes);
  app.use('/api/lecturers', lecturerRoutes);
  app.use('/api/lecturer', lecturerSelfRoutes);
  app.use('/api/lecturer-profile', lecturerProfileRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/course-mappings', courseMappingRoutes);
  app.use('/api/research-fields', researchFieldRoutes);
  app.use('/api/universities', universityRoutes);
  app.use('/api/majors', majorRoutes);
  app.use('/api/teaching-contracts', teachingContractRoutes);
  app.use('/api/contracts', contractsRoutes);
  app.use('/api/lecturer-dashboard', lecturerDashboardRoutes);
}
