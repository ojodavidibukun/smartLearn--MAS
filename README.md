# YouLearn - Multi-Agent Personalized E-Learning System

A lightweight academic demonstration of a multi-agent system for personalized e-learning and student performance monitoring. Built with React, TypeScript, and Tailwind CSS.

## Project Overview

**YouLearn** is a university project for an Agent-Based Technology course that demonstrates how multiple software agents collaborate to create intelligent learning experiences. The system showcases personalized learning paths, real-time performance monitoring, and AI-powered recommendations through a clean, professional interface.

### Key Features

- **Intelligent Personalization**: Adaptive learning paths that adjust to each student's pace
- **Real-Time Monitoring**: Comprehensive performance tracking and early warning systems
- **Multi-Agent Collaboration**: Six specialized agents working together seamlessly
- **Rule-Based Logic**: Simulated intelligent behavior using simple, replaceable rules
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Backend-Ready Architecture**: Clean folder structure designed for easy backend integration

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Routing**: Wouter
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context API

## Project Structure

```
youlearn/
├── client/
│   ├── public/              # Static files (favicon, robots.txt)
│   ├── src/
│   │   ├── agents/          # Agent implementations (backend-ready)
│   │   │   ├── StudentAgent.ts
│   │   │   ├── LearningAgent.ts
│   │   │   ├── PerformanceAgent.ts
│   │   │   ├── RecommendationAgent.ts
│   │   │   ├── NotificationAgent.ts
│   │   │   └── LecturerAgent.ts
│   │   ├── components/      # Reusable UI components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── data/            # Mock data and fixtures
│   │   │   └── mockData.ts
│   │   ├── layouts/         # Page layouts
│   │   │   └── MainLayout.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── Learning.tsx
│   │   │   ├── Performance.tsx
│   │   │   └── Agents.tsx
│   │   ├── types/           # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── App.tsx          # Main app component with routing
│   │   ├── main.tsx         # React entry point
│   │   └── index.css        # Global styles and design tokens
│   └── index.html
├── server/                  # Express server (placeholder)
├── shared/                  # Shared types (placeholder)
└── package.json
```

## Pages & Features

### 1. Landing Page (`/`)
The public-facing homepage showcasing the project concept, features, and multi-agent system overview. Includes a demo login button and detailed explanation of how the agents work together.

### 2. Login Page (`/login`)
Simple demo login interface with two roles:
- **Student**: Access personalized learning dashboard
- **Lecturer**: View class analytics and student insights

No backend authentication required—select your role to proceed.

### 3. Student Dashboard (`/dashboard`)
Personalized learning hub displaying:
- Quick performance statistics (average score, courses, performance level, attendance)
- Enrolled courses with progress tracking
- Current lesson with content preview
- Recent quiz scores
- Unread notifications
- Agent insights
- Quick action buttons

### 4. Learning Page (`/learning`)
Interactive learning experience featuring:
- Sample course (Digital Logic - CS201)
- Four lessons with content and video placeholders
- Progress tracking
- Interactive quiz with immediate scoring
- Lesson completion tracking

### 5. Performance & Recommendations (`/performance`)
Comprehensive analytics dashboard with:
- Performance summary metrics
- Quiz performance trend chart
- Performance breakdown pie chart
- Attendance rate visualization
- Personalized recommendations with priority levels
- Suggested actions for improvement

### 6. Multi-Agent Visualization (`/agents`)
Interactive agent system explorer featuring:
- SVG network diagram showing agent relationships
- Clickable agent nodes with details panel
- Agent cards with quick information
- Detailed agent specifications:
  - Purpose and role
  - Input data types
  - Processing logic
  - Output data types
  - Related agents
- Backend integration notes for developers

## The Six Agents

### 1. Student Agent
**Purpose**: Manages student profile, enrollment, and learning preferences

**Inputs**: Student ID, Enrollment Data, Learning Preferences

**Processing**: Aggregates student information and maintains learning profile state

**Outputs**: Student Profile, Enrollment Status, Preference Settings

**File**: `client/src/agents/StudentAgent.ts`

### 2. Learning Agent
**Purpose**: Delivers personalized learning content and adapts difficulty based on performance

**Inputs**: Student Profile, Learning History, Performance Data

**Processing**: Selects appropriate lessons and adjusts content complexity dynamically

**Outputs**: Personalized Lesson Plan, Adapted Content, Learning Path

**File**: `client/src/agents/LearningAgent.ts`

### 3. Performance Monitoring Agent
**Purpose**: Tracks student performance metrics and identifies at-risk students

**Inputs**: Quiz Scores, Attendance Records, Assignment Submissions

**Processing**: Calculates performance indicators and risk levels

**Outputs**: Performance Report, Risk Assessment, Performance Trends

**File**: `client/src/agents/PerformanceAgent.ts`

### 4. Recommendation Agent
**Purpose**: Generates personalized learning recommendations based on performance gaps

**Inputs**: Performance Data, Learning History, Course Requirements

**Processing**: Applies rule-based logic to identify improvement areas

**Outputs**: Personalized Recommendations, Learning Resources, Action Plans

**File**: `client/src/agents/RecommendationAgent.ts`

### 5. Notification Agent
**Purpose**: Sends timely notifications about assignments, grades, and recommendations

**Inputs**: Performance Updates, Assignment Deadlines, Recommendation Triggers

**Processing**: Determines notification priority and delivery timing

**Outputs**: Notifications, Alerts, Reminders

**File**: `client/src/agents/NotificationAgent.ts`

### 6. Lecturer Agent
**Purpose**: Provides instructors with class analytics and student performance insights

**Inputs**: Class Performance Data, Student Analytics, Engagement Metrics

**Processing**: Aggregates and analyzes class-level data

**Outputs**: Class Analytics, Student Insights, Engagement Reports

**File**: `client/src/agents/LecturerAgent.ts`

## Rule-Based Agent Logic

The system uses simple rule-based logic to simulate intelligent behavior. These rules can be easily replaced with server-side logic or AI models:

**Performance Monitoring Rules**:
- IF Quiz Score < 50% THEN Risk Level = High
- IF Quiz Score < 70% OR Assignment Completion < 70% THEN Risk Level = Medium
- ELSE Risk Level = Low

**Recommendation Rules**:
- IF Quiz Score < 50% THEN Recommend revision materials
- IF Assignment Completion < 70% THEN Recommend more submissions
- IF Attendance < 80% THEN Send attendance reminder
- IF Quiz Score >= 80% AND Assignment Completion >= 85% THEN Suggest advanced topics

**Notification Rules**:
- IF Assignment Due <= 2 Days THEN Send urgent reminder
- IF Assignment Due <= 7 Days THEN Send regular reminder
- IF Quiz Score < Passing Score THEN Send performance alert
- IF Quiz Score >= Passing Score THEN Send congratulations

## Mock Data

The application includes comprehensive mock data for demonstration:

- **Students**: Student profiles with enrollment information
- **Courses**: Four sample courses (Digital Logic, Data Structures, Web Development, Database Systems)
- **Lessons**: Four lessons per course with content and metadata
- **Quizzes**: Sample quiz with multiple-choice questions
- **Quiz Results**: Historical quiz performance data
- **Assignments**: Sample assignments with submission tracking
- **Notifications**: Sample notifications with different types
- **Recommendations**: Personalized recommendations based on performance
- **Performance Metrics**: Student performance data and risk assessment

All mock data is defined in `client/src/data/mockData.ts` and can be easily replaced with API calls.

## Backend Integration Guide

### For Backend Developers

This frontend is designed to be easily integrated with a backend system. Here's how to proceed:

#### 1. Replace Mock Data with API Calls

In `client/src/data/mockData.ts`, replace mock data with API calls:

```typescript
// Before (mock data)
export const mockStudent = { id: 'STU001', name: 'David Okafor', ... };

// After (API call)
export async function getStudent(studentId: string) {
  const response = await fetch(`/api/students/${studentId}`);
  return response.json();
}
```

#### 2. Implement Agent Logic

Each agent file in `client/src/agents/` contains placeholder functions. Replace them with actual API calls:

```typescript
// StudentAgent.ts
async getStudentProfile(studentId: string): Promise<Student> {
  // Replace this with your backend API call
  const response = await fetch(`/api/students/${studentId}`);
  return response.json();
}
```

#### 3. Add Authentication

Implement proper authentication in the Login page:

```typescript
// Login.tsx
const handleStudentLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role: 'student' }),
  });
  const { token } = await response.json();
  localStorage.setItem('authToken', token);
  setLocation('/dashboard');
};
```

#### 4. Connect to Your Database

Update the agent files to connect to your database:

```typescript
// PerformanceAgent.ts
async calculatePerformance(studentId: string): Promise<StudentPerformance> {
  const response = await fetch(`/api/students/${studentId}/performance`);
  return response.json();
}
```

#### 5. Implement Real-Time Features

Add WebSocket support for real-time notifications:

```typescript
// NotificationAgent.ts
const socket = io('http://your-backend-url');
socket.on('notification', (notification) => {
  // Handle real-time notification
});
```

### API Endpoints to Implement

**Students**:
- `GET /api/students/:id` - Get student profile
- `PUT /api/students/:id` - Update student profile
- `GET /api/students/:id/enrollments` - Get enrolled courses
- `GET /api/students/:id/performance` - Get performance metrics

**Courses**:
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/lessons` - Get course lessons
- `GET /api/courses/:id/analytics` - Get course analytics

**Lessons**:
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons/:id/complete` - Mark lesson as complete

**Quizzes**:
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/submit` - Submit quiz answers

**Recommendations**:
- `GET /api/students/:id/recommendations` - Get recommendations
- `POST /api/recommendations/:id/action` - Mark recommendation as actioned

**Notifications**:
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications` - Create notification

## Design Philosophy

**Academic Minimalism**: A clean, professional educational interface that prioritizes information hierarchy and cognitive clarity. The design reflects institutional trust through refined typography, generous whitespace, and purposeful color usage.

**Color Palette**:
- Primary Blue (`oklch(0.623 0.214 259.815)`): Trust and learning
- Accent Green (`oklch(0.65 0.15 142)`): Progress and achievement
- Neutral Grays: Hierarchy and readability

**Typography**:
- Display Font: Geist Sans (bold, 700) for headlines
- Body Font: Geist Sans (regular, 400/500) for content

**Layout**:
- Asymmetric grid with sidebar navigation
- Card-based layouts with clear visual separation
- Consistent 8px spacing system

## Installation & Development

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm 10.4.1 or higher

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check

# Format code
pnpm format
```

### Development Server

The development server runs on `http://localhost:3000` with hot module replacement enabled.

## Deployment

The application is built with Vite and can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Configure in `vite.config.ts`
- **Custom Server**: Build with `pnpm build` and serve the `dist` folder

## Academic Context

This project demonstrates key concepts in agent-based systems:

1. **Multi-Agent Architecture**: Six independent agents with specific responsibilities
2. **Agent Communication**: Agents share data and coordinate actions
3. **Rule-Based Decision Making**: Simple, interpretable rules instead of black-box AI
4. **Personalization**: Adaptive systems that respond to individual student needs
5. **Real-Time Monitoring**: Continuous tracking and analysis of student progress
6. **Scalability**: Architecture designed for easy expansion and integration

## Future Enhancements

Potential improvements for production deployment:

- **Real AI/ML Models**: Replace rule-based logic with machine learning
- **Advanced Analytics**: More sophisticated performance analysis and predictions
- **Real-Time Collaboration**: WebSocket support for live notifications
- **Mobile App**: Native mobile application using React Native
- **Accessibility**: Enhanced WCAG compliance and screen reader support
- **Internationalization**: Multi-language support
- **Advanced Reporting**: PDF export and scheduled reports
- **API Documentation**: OpenAPI/Swagger documentation
- **Testing**: Comprehensive unit and integration tests
- **Performance Optimization**: Code splitting and lazy loading

## Contributing

This is an academic project. For improvements or bug fixes:

1. Create a feature branch
2. Make your changes
3. Submit a pull request with a clear description

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:

1. Check the documentation in this README
2. Review the agent files for implementation examples
3. Examine the mock data structure for data format reference
4. Contact the project maintainer

## Acknowledgments

Built as a demonstration of agent-based technology for an academic course. The project showcases how software agents can collaborate to create intelligent, personalized learning experiences.

---

**Note**: This is a demonstration system. Production deployment requires backend implementation, proper authentication, database integration, and security hardening.
