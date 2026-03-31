# Lecturer and Advisor Management System

A web-based university management platform for administering lecturer and advisor operations across the academic lifecycle. The system centralizes profile management, academic planning, contract processing, performance evaluation, and recruitment workflows in a single application for university administrators, management staff, lecturers, and advisors.

## Project Overview

This project is designed to support university management teams in handling operational processes related to lecturers and advisors. It provides a structured environment for maintaining academic staff records, organizing courses and classes, assigning teaching responsibilities, processing contract approvals, tracking evaluation outcomes, and managing lecturer recruitment from candidate intake to onboarding.

The repository is organized as a full-stack application with:

- A frontend built as a single-page web application for role-based user interaction
- A backend API responsible for business rules, authentication, data access, workflow enforcement, and document-related operations
- A relational database for persistent storage of users, academic records, contracts, schedules, and evaluation data

## Objectives

- Centralize lecturer and advisor information in one management platform
- Improve visibility into academic assignments, contracts, and operational status
- Standardize approval workflows for teaching and advisory contracts
- Reduce manual coordination between lecturers, advisors, and management
- Support evidence-based evaluation and hiring decisions through structured records
- Provide a scalable foundation for future academic administration modules

## Key Features

- Lecturer and advisor profile management
- Course, class, group, and schedule management
- Course assignment and teaching workload coordination
- Contract creation, review, approval, and redo request handling
- Status-based workflow tracking for academic contract processing
- Lecturer onboarding and profile completion flows
- Performance evaluation upload and management
- Recruitment candidate and interview management
- Dashboard views for operational monitoring and reporting
- File upload support for contracts, evaluations, schedules, signatures, and lecturer documents
- API documentation endpoint for backend integration and testing

## System Modules

### 1. Authentication and Access Control
- Login and session-based authentication
- Role-aware access to modules and dashboards
- Protected API routes and profile management

### 2. Lecturer and Advisor Management
- Maintain lecturer and advisor records
- Store profile, department, and academic information
- Support self-service profile and onboarding flows

### 3. Academic Management
- Manage universities, specializations, courses, and classes
- Organize course mappings, academic groups, and schedules
- Assign courses and academic responsibilities to lecturers

### 4. Contract Management
- Generate and maintain lecturer and advisor contracts
- Track contract status across approval stages
- Support redo requests, status changes, and workflow visibility

### 5. Evaluation Management
- Upload and manage lecturer performance evaluations
- Maintain assessment records for academic review and follow-up

### 6. Recruitment and Onboarding
- Manage lecturer recruitment candidates
- Record interview activity and progression
- Transition accepted candidates into onboarding and profile setup

### 7. Reporting and Dashboards
- Provide dashboard data for operational monitoring
- Support department-level and role-specific visibility into current activity

### 8. Notifications and Real-Time Communication
- Deliver workflow-related updates and user-facing notifications
- Support real-time events through socket-based communication

## User Roles

The system is designed for role-based operation. Typical roles include:

- Super Administrator: Oversees system-wide configuration and access management for administrator and management.
- Administrator: Manages academic records, lecturers, advisors, and operational data
- Management: Reviews and approves contract-related decisions at management level
- Lecturer: Maintains personal profile data, onboarding information, view schedule and responds to contract actions
- Advisor: Participates in advisory workflows and related academic contract processes

Exact permissions can be adjusted according to institutional policy.

## Technology Stack

The current repository uses a JavaScript-based full-stack architecture.

### Frontend
- React
- Vite
- Tailwind CSS
- Material UI and supporting UI libraries
- Axios
- Zustand
- Socket.IO client

### Backend
- Node.js
- Express
- Sequelize ORM
- MySQL
- JWT-based authentication
- Multer for file uploads
- Socket.IO

### Tooling
- ESLint
- Prettier
- Nodemon

## System Architecture

The application follows a layered client-server architecture:

1. The frontend provides a role-based web interface for university staff, lecturers, and advisors.
2. The frontend communicates with the backend through HTTP APIs and selected real-time socket connections.
3. The backend handles authentication, validation, workflow rules, file upload processing, and domain logic.
4. Sequelize manages communication between the backend and the MySQL database.
5. Uploaded assets such as contracts, evaluations, lecturer files, schedules, and signatures are stored in dedicated upload directories.

### High-Level Flow

```text
User Browser
    |
    v
React + Vite Frontend
    |
    v
Express REST API + Socket Server
    |
    +--> Authentication and Authorization
    +--> Academic and Contract Business Logic
    +--> File Upload and Document Handling
    +--> Notification and Dashboard Services
    |
    v
MySQL Database
```

## Installation and Setup

### Prerequisites

Install the following before starting:

- Node.js 18 or later
- npm 9 or later
- MySQL 8 or later

### 1. Clone the Repository

```bash
git clone https://github.com/Samnang-Vouen/lecturer-contract-management-system.git
cd lecturer-contract-management-system
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory and define the required values.

Example:

```env
PORT=4000
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=lecturer_contract_management
DATABASE_USER=root
DATABASE_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
CORS_ALLOWED_ORIGIN=http://localhost:5173

MIGRATE_ON_START=true
SEED_ON_START=true
DB_ALTER_SYNC=false
```

Create a `.env` file in the frontend directory if needed.

Example:

```env
VITE_API_URL=http://localhost:4000/api
```

### 4. Start the Backend

```bash
cd backend
npm run dev
```

The backend runs by default at `http://localhost:4000`.

### 5. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

The frontend runs on the Vite development server, typically at `http://localhost:5173`.

### 6. Build for Production

Frontend production build:

```bash
cd frontend
npm run build
```

Backend production start:

```bash
cd backend
npm start
```

## Project Structure

```text
lecturer-contract-management-system/
├── README.md
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── route/
│   │   ├── socket/
│   │   ├── utils/
│   │   └── validators/
│   └── uploads/
│       ├── contracts/
│       ├── evaluations/
│       ├── lecturers/
│       ├── schedules/
│       └── signatures/
└── frontend/
    ├── package.json
    ├── public/
    └── src/
        ├── components/
        ├── hooks/
        ├── pages/
        ├── services/
        ├── store/
        ├── utils/
        ├── App.jsx
        └── main.jsx
```

## Workflow Overview

The platform supports academic and contract operations through structured workflows.

### Contract Workflow Statuses

The contract approval flow is centered on status tracking, including:

- `Waiting Lecturer`
- `Waiting Advisor`
- `Waiting Management`
- `Request Redo`
- `Waiting Response`

### Example Contract Workflow

1. An administrator prepares a contract.
2. The contract is assigned to the relevant lecturer for review.
3. If advisor review is required, the workflow proceeds to advisor approval.
4. Management performs the final institutional review and decision.
5. If revisions are needed, the contract is returned through `Request Redo`.
6. The adminstrator updates the record and resubmits it for approval.
7. Final status and supporting records remain visible for audit and follow-up.

### Operational Workflow Coverage

- Recruitment candidates move through interview and decision stages
- Accepted candidates can proceed into onboarding
- Lecturers and advisors maintain profile information and academic records
- Administrators manage courses, classes, schedules, assignments, and evaluations
- Dashboards and notifications keep stakeholders informed of current tasks and status changes

## Future Improvements

- Fine-grained permission management by module and action
- Audit trails and approval history visualization
- Advanced analytics and KPI dashboards for faculty operations
- Automated email and in-app notification templates
- Document versioning for contracts and evaluation records
- Exportable reports for accreditation and management review
- Calendar integration for schedules and contract deadlines
- Containerized deployment and CI/CD automation
- Expanded automated test coverage for frontend and backend modules

## Notes

- The backend automatically ensures the configured MySQL database exists before starting.
- Uploaded operational files are stored under the backend `uploads` directory.
