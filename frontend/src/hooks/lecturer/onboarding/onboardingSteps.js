import { Briefcase, GraduationCap, Phone, User } from 'lucide-react';

export const lecturerSteps = [
  { id: 1, key: 'basic', title: 'Basic Information', icon: User, description: 'Personal and banking details' },
  { id: 2, key: 'academic', title: 'Academic Info', icon: GraduationCap, description: 'Course and research information' },
  { id: 3, key: 'education', title: 'Education', icon: GraduationCap, description: 'Educational background' },
  { id: 4, key: 'professional', title: 'Professional', icon: Briefcase, description: 'Work experience' },
  { id: 5, key: 'contact', title: 'Contact', icon: Phone, description: 'Contact information' },
];

export const advisorSteps = [
  { id: 1, key: 'basic', title: 'Basic Information', icon: User, description: 'Personal and banking details' },
  { id: 2, key: 'education', title: 'Education', icon: GraduationCap, description: 'Educational background' },
  { id: 3, key: 'professional', title: 'Professional', icon: Briefcase, description: 'Work experience' },
  { id: 4, key: 'contact', title: 'Contact', icon: Phone, description: 'Contact information' },
];