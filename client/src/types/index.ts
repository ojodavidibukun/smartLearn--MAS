// SmartLearn MAS - Type Definitions
// Backend developers: Replace these with actual API response types

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  profileImage?: string;
  totalCourses: number;
  averageScore: number;
}

export interface Lecturer {
  id: string;
  name: string;
  email: string;
  department: string;
  courses: string[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructor: string;
  enrollmentCount: number;
  progress: number; // 0-100
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  duration: number; // in minutes
  videoUrl?: string;
  completed: boolean;
  order: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizResult {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  maxScore: number;
  completedAt: string;
  answers: number[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  submissionCount: number;
}

export interface StudentAssignment {
  id: string;
  studentId: string;
  assignmentId: string;
  submittedAt?: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface Notification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Recommendation {
  id: string;
  studentId: string;
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  suggestedAction: string;
  createdAt: string;
}

export interface StudentPerformance {
  studentId: string;
  averageQuizScore: number;
  assignmentCompletion: number; // percentage
  attendanceRate: number; // percentage
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  purpose: string;
  inputs: string[];
  processing: string;
  outputs: string[];
  relatedAgents: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
}
