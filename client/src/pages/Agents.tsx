// SmartLearn MAS - Agent System Explorer
// Clean, organized interface for understanding agent architecture

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAgents } from '@/data/mockData';
import { ArrowRight, Zap } from 'lucide-react';
import { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getActiveEnrollments, getCourseById, getLessons, getStudentProgress, getStudentQuizAttempts, type QuizAttempt } from '@/lib/courses';

const agentColors: Record<string, { bg: string; text: string; border: string }> = {
  AGENT001: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  AGENT002: { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' },
  AGENT003: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' },
  AGENT004: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  AGENT005: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  AGENT006: { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200' },
};

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState(mockAgents[0]);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [assistant, setAssistant] = useState<{ advice: string[]; courses: number; completed: number; attempts: number; weakTopics: string[] }>({ advice: [], courses: 0, completed: 0, attempts: 0, weakTopics: [] });

  useEffect(() => {
    if (!user?.uid) return;
    const loadAssistantContext = async () => {
      const [enrollments, attempts] = await Promise.all([getActiveEnrollments(user.uid), getStudentQuizAttempts(user.uid)]);
      const courseData = (await Promise.all(enrollments.map(async (enrollment: any) => {
        if (!enrollment.courseId) return null;
        const course = await getCourseById(enrollment.courseId);
        if (!course?.id) return null;
        const [lessons, progress] = await Promise.all([getLessons(course.id, true), getStudentProgress(course.id, user.uid)]);
        const completed = Array.isArray((progress as any).completedLessons) ? (progress as any).completedLessons : [];
        return { course, lessons, completed };
      }))).filter(Boolean) as Array<{ course: any; lessons: any[]; completed: string[] }>;
      const topicTotals = new Map<string, { correct: number; total: number }>();
      attempts.filter((attempt: QuizAttempt) => attempt.status !== 'in_progress').forEach((attempt) => Object.entries(attempt.topicScores || {}).forEach(([topic, score]) => {
        const current = topicTotals.get(topic) || { correct: 0, total: 0 };
        topicTotals.set(topic, { correct: current.correct + Number(score.correct || 0), total: current.total + Number(score.total || 0) });
      }));
      const weakTopics = Array.from(topicTotals.entries()).map(([topic, score]) => ({ topic, percentage: score.total ? Math.round((score.correct / score.total) * 100) : 0 })).filter((item) => item.percentage < 60).sort((a, b) => a.percentage - b.percentage).map((item) => item.topic);
      const completed = courseData.reduce((sum, item) => sum + item.completed.length, 0);
      const advice = weakTopics.length
        ? [`Your recent quiz results show that you need more practice with ${weakTopics[0]}. Review a related lesson before attempting another practice quiz.`]
        : completed > 0
          ? [`You have completed ${completed} lesson${completed === 1 ? '' : 's'} across your active courses. Continue with the next published lesson to keep progressing.`]
          : ['Keep learning and taking quizzes. Your learning assistant will use your activity to provide personalized recommendations.'];
      setAssistant({ advice, courses: courseData.length, completed, attempts: attempts.filter((attempt) => attempt.status !== 'in_progress').length, weakTopics });
    };
    loadAssistantContext().catch(() => setAssistant({ advice: ['Keep learning and taking quizzes. Your learning assistant will use your activity to provide personalized recommendations.'], courses: 0, completed: 0, attempts: 0, weakTopics: [] }));
  }, [user?.uid]);

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">How YouLearn Works</h1>
          <p className="text-muted-foreground">
            Discover the specialized agents that power your personalized learning experience
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent List - Left Column */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Agents
            </h2>
            <div className="space-y-2">
              {mockAgents.map((agent) => {
                const colors = agentColors[agent.id];
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs opacity-70 mt-1">{agent.purpose.substring(0, 40)}...</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Details - Right Column */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {/* Agent Header */}
              <div className="mb-8 pb-6 border-b border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedAgent.name}</h2>
                    <p className="text-muted-foreground">{selectedAgent.purpose}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${agentColors[selectedAgent.id].bg}`} />
                </div>
              </div>

              {selectedAgent.id === 'AGENT001' && (
                <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
                  <h3 className="font-semibold">Your Personal Learning Assistant</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Hi {profile?.fullName?.split(' ')[0] || 'Learner'}. I use your learning activity and performance to help you understand what to learn next.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Active courses</p><p className="text-xl font-semibold">{assistant.courses}</p></div><div><p className="text-xs text-muted-foreground">Lessons completed</p><p className="text-xl font-semibold">{assistant.completed}</p></div><div><p className="text-xs text-muted-foreground">Quiz attempts</p><p className="text-xl font-semibold">{assistant.attempts}</p></div></div>
                  <div className="mt-4 space-y-2">{assistant.advice.map((advice) => <p key={advice} className="text-sm">{advice}</p>)}</div>
                  {assistant.weakTopics.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{assistant.weakTopics.map((topic) => <span key={topic} className="rounded-full border border-destructive/30 px-2 py-1 text-xs text-destructive">Review: {topic}</span>)}</div>}
                </div>
              )}

              {/* Tabs for Organization */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Inputs */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full" />
                      What It Receives
                    </h3>
                    <div className="space-y-2">
                      {selectedAgent.inputs.map((input, idx) => (
                        <div key={idx} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-sm text-foreground">{input}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-accent rounded-full" />
                      What It Produces
                    </h3>
                    <div className="space-y-2">
                      {selectedAgent.outputs.map((output, idx) => (
                        <div key={idx} className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                          <p className="text-sm text-foreground">{output}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Connections Tab */}
                <TabsContent value="connections" className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Works With</h3>
                    {selectedAgent.relatedAgents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedAgent.relatedAgents.map((relatedId) => {
                          const relatedAgent = mockAgents.find((a) => a.id === relatedId);
                          const colors = agentColors[relatedId];
                          return (
                            <button
                              key={relatedId}
                              onClick={() => setSelectedAgent(relatedAgent!)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${colors.bg} ${colors.border} hover:shadow-md`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{relatedAgent?.name}</p>
                                  <p className="text-xs opacity-70 mt-1">{relatedAgent?.purpose.substring(0, 50)}...</p>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-50" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">This agent works independently</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* System Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">How Agents Collaborate</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Each agent has a specific role in your learning journey. They use your activity to help you discover content, practice effectively, and decide what to learn next.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Your profile and preferences are managed</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Content is personalized for your learning style</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Your own progress informs your next learning actions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>Recommendations are provided to help you succeed</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">For Facilitators</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Facilitators create and publish quality learning experiences. Student performance insights remain private to each learner and power their personal recommendations.
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Build structured courses and lessons</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Publish videos, materials, and quizzes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Keep course content current and useful</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Manage draft, published, and archived courses</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
