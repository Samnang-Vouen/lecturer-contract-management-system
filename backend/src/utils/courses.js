// Static course list used by the API / future seeding.
// Replace with DB-driven model when implementing dynamic courses.

export const courses = [
  {
    department: 'Computer Science',
    specializations: [
      {
        name: 'Software Engineering',
        years: [
          {
            year: 1,
            terms: [
              {
                term: 1,
                courses: [
                  'Introduction to Computer Science',
                  'Programming Fundamentals',
                  'Mathematics for Computing I',
                  'Academic Writing',
                  'Introduction to Management',
                ],
              },
              {
                term: 2,
                courses: [
                  'Object-Oriented Programming',
                  'Data Structures and Algorithms',
                  'Mathematics for Computing II',
                  'Database Systems',
                  'Communication Skills',
                ],
              },
            ],
          },
          {
            year: 2,
            terms: [
              {
                term: 1,
                courses: [
                  'Web Development',
                  'Computer Networks',
                  'Operating Systems',
                  'Probability and Statistics',
                  'Software Engineering Fundamentals',
                ],
              },
              {
                term: 2,
                courses: [
                  'Mobile Development',
                  'System Analysis and Design',
                  'Project Management',
                  'Artificial Intelligence',
                  'Human-Computer Interaction',
                ],
              },
            ],
          },
          {
            year: 3,
            terms: [
              {
                term: 1,
                courses: [
                  'Advanced Database Systems',
                  'Software Architecture',
                  'Cloud Computing',
                  'Research Methodology',
                  'Elective I',
                ],
              },
              {
                term: 2,
                courses: [
                  'Machine Learning',
                  'Software Testing and Quality Assurance',
                  'Cyber Security',
                  'Elective II',
                  'Seminar on Emerging Technologies',
                ],
              },
            ],
          },
          {
            year: 4,
            terms: [
              {
                term: 1,
                courses: [
                  'Capstone Project I',
                  'Advanced Topics in Software Engineering',
                  'Professional Ethics',
                  'Elective III',
                ],
              },
              {
                term: 2,
                courses: ['Capstone Project II', 'Entrepreneurship', 'Elective IV', 'Internship'],
              },
            ],
          },
        ],
      },
      {
        name: 'Data Science',
        years: [
          {
            year: 1,
            terms: [
              {
                term: 1,
                courses: [
                  'Introduction to Computer Science',
                  'Programming Fundamentals',
                  'Mathematics for Computing I',
                  'Academic Writing',
                  'Introduction to Management',
                ],
              },
              {
                term: 2,
                courses: [
                  'Object-Oriented Programming',
                  'Data Structures and Algorithms',
                  'Mathematics for Computing II',
                  'Database Systems',
                  'Communication Skills',
                ],
              },
            ],
          },
          {
            year: 2,
            terms: [
              {
                term: 1,
                courses: [
                  'Introduction to Data Science',
                  'Probability and Statistics',
                  'Database Systems II',
                  'Computer Networks',
                  'Python for Data Analysis',
                ],
              },
              {
                term: 2,
                courses: [
                  'Big Data Analytics',
                  'Machine Learning',
                  'Data Visualization',
                  'Cloud Computing',
                  'Research Methodology',
                ],
              },
            ],
          },
          {
            year: 3,
            terms: [
              {
                term: 1,
                courses: [
                  'Deep Learning',
                  'Statistical Modeling',
                  'Data Mining',
                  'Elective I',
                  'Seminar on Data Science',
                ],
              },
              {
                term: 2,
                courses: [
                  'Artificial Intelligence',
                  'Data Security and Privacy',
                  'Natural Language Processing',
                  'Elective II',
                ],
              },
            ],
          },
          {
            year: 4,
            terms: [
              {
                term: 1,
                courses: ['Capstone Project I', 'Ethics in Data Science', 'Elective III'],
              },
              {
                term: 2,
                courses: ['Capstone Project II', 'Entrepreneurship in Tech', 'Internship'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    department: 'Telecommunications and Networking',
    specializations: [
      {
        name: 'Cyber Security',
        years: [
          {
            year: 1,
            terms: [
              {
                term: 1,
                courses: [
                  'Introduction to Computer Science',
                  'Programming Fundamentals',
                  'Mathematics for Computing I',
                  'Academic Writing',
                  'Introduction to Management',
                ],
              },
              {
                term: 2,
                courses: [
                  'Object-Oriented Programming',
                  'Data Structures and Algorithms',
                  'Mathematics for Computing II',
                  'Database Systems',
                  'Communication Skills',
                ],
              },
            ],
          },
          {
            year: 2,
            terms: [
              {
                term: 1,
                courses: [
                  'Computer Networks',
                  'Operating Systems',
                  'Network Security',
                  'Cryptography',
                  'Probability and Statistics',
                ],
              },
              {
                term: 2,
                courses: [
                  'Advanced Networking',
                  'Cyber Forensics',
                  'System Security',
                  'Ethical Hacking',
                  'Research Methodology',
                ],
              },
            ],
          },
          {
            year: 3,
            terms: [
              {
                term: 1,
                courses: [
                  'Cloud Security',
                  'Web Security',
                  'Malware Analysis',
                  'Elective I',
                  'Seminar on Cyber Security',
                ],
              },
              {
                term: 2,
                courses: ['Mobile Security', 'Data Privacy', 'Incident Response', 'Elective II'],
              },
            ],
          },
          {
            year: 4,
            terms: [
              {
                term: 1,
                courses: [
                  'Capstone Project I',
                  'Advanced Topics in Cyber Security',
                  'Elective III',
                ],
              },
              {
                term: 2,
                courses: ['Capstone Project II', 'Entrepreneurship', 'Internship'],
              },
            ],
          },
        ],
      },
      {
        name: 'Telecommunications and Networking Engineering',
        years: [
          {
            year: 1,
            terms: [
              {
                term: 1,
                courses: [
                  'Introduction to Computer Science',
                  'Programming Fundamentals',
                  'Mathematics for Computing I',
                  'Academic Writing',
                  'Introduction to Management',
                ],
              },
              {
                term: 2,
                courses: [
                  'Object-Oriented Programming',
                  'Data Structures and Algorithms',
                  'Mathematics for Computing II',
                  'Database Systems',
                  'Communication Skills',
                ],
              },
            ],
          },
          {
            year: 2,
            terms: [
              {
                term: 1,
                courses: [
                  'Signals and Systems',
                  'Digital Logic Design',
                  'Computer Networks',
                  'Probability and Statistics',
                  'Electronics Fundamentals',
                ],
              },
              {
                term: 2,
                courses: [
                  'Telecommunication Systems',
                  'Wireless Communications',
                  'Network Routing and Switching',
                  'Operating Systems',
                  'Research Methodology',
                ],
              },
            ],
          },
          {
            year: 3,
            terms: [
              {
                term: 1,
                courses: [
                  'Optical Communications',
                  'Satellite Communications',
                  'Mobile Networks',
                  'Elective I',
                  'Seminar on Networking',
                ],
              },
              {
                term: 2,
                courses: [
                  'Cloud Networking',
                  'Advanced Wireless Networks',
                  'Network Management',
                  'Elective II',
                ],
              },
            ],
          },
          {
            year: 4,
            terms: [
              {
                term: 1,
                courses: ['Capstone Project I', 'Advanced Topics in Networking', 'Elective III'],
              },
              {
                term: 2,
                courses: ['Capstone Project II', 'Entrepreneurship', 'Internship'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    department: 'Digital Business',
    specializations: [
      {
        name: 'E-Commerce',
        years: [
          {
            year: 1,
            terms: [
              {
                term: 1,
                courses: [
                  'Introduction to Business',
                  'Principles of Economics',
                  'Programming Fundamentals',
                  'Mathematics for Business',
                  'Academic Writing',
                ],
              },
              {
                term: 2,
                courses: [
                  'Database Systems',
                  'Web Development',
                  'Business Communication',
                  'Accounting Fundamentals',
                  'Statistics for Business',
                ],
              },
            ],
          },
          {
            year: 2,
            terms: [
              {
                term: 1,
                courses: [
                  'Digital Marketing',
                  'E-Commerce Platforms',
                  'Consumer Behavior',
                  'Project Management',
                  'Financial Management',
                ],
              },
              {
                term: 2,
                courses: [
                  'Supply Chain Management',
                  'Entrepreneurship',
                  'Web Analytics',
                  'Cyber Security for Business',
                  'Research Methodology',
                ],
              },
            ],
          },
          {
            year: 3,
            terms: [
              {
                term: 1,
                courses: [
                  'Mobile Commerce',
                  'Business Intelligence',
                  'E-Business Strategies',
                  'Elective I',
                  'Seminar on Digital Business',
                ],
              },
              {
                term: 2,
                courses: [
                  'Data Analytics for Business',
                  'Cloud Computing in Business',
                  'Global E-Commerce',
                  'Elective II',
                ],
              },
            ],
          },
          {
            year: 4,
            terms: [
              {
                term: 1,
                courses: ['Capstone Project I', 'Ethics in Digital Business', 'Elective III'],
              },
              {
                term: 2,
                courses: [
                  'Capstone Project II',
                  'Innovation and Technology Management',
                  'Internship',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export default courses;
