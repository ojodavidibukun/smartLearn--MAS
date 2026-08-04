// SmartLearn MAS - Learning Page
// Demonstrates personalized e-learning with sample course content

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockLessons, mockQuiz } from '@/data/mockData';
import { ArrowRight, CheckCircle2, Clock, Play } from 'lucide-react';
import { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';

export default function Learning() {
  const [selectedLesson, setSelectedLesson] = useState(mockLessons[0]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  const courseProgress = 50;

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const calculateQuizScore = () => {
    let correct = 0;
    mockQuiz.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / mockQuiz.questions.length) * 100);
  };

  const quizScore = quizAnswers.length === mockQuiz.questions.length ? calculateQuizScore() : null;

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Digital Logic</h1>
          <p className="text-muted-foreground">CS201 • Dr. Daniel Okoye</p>
        </div>

        {/* Course Progress */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Course Progress</h3>
            <span className="text-sm font-medium text-primary">{courseProgress}%</span>
          </div>
          <Progress value={courseProgress} className="h-3" />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Lessons Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold mb-4">Lessons</h3>
            <div className="space-y-2">
              {mockLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setShowQuiz(false);
                    setQuizAnswers([]);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedLesson.id === lesson.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {lesson.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">{lesson.duration} min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!showQuiz ? (
              <>
                {/* Lesson Content */}
                <Card className="p-8 mb-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{selectedLesson.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedLesson.duration} minutes
                      </div>
                      <div>Lesson {selectedLesson.order} of 4</div>
                      {selectedLesson.completed && (
                        <div className="flex items-center gap-1 text-accent">
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placeholder Video */}
                  <div className="w-full bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg aspect-video flex items-center justify-center mb-8 border border-primary/20">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">Video Lesson Placeholder</p>
                    </div>
                  </div>

                  {/* Lesson Description */}
                  <div className="prose prose-sm max-w-none mb-8">
                    <h3 className="font-semibold mb-3">Lesson Overview</h3>
                    <p className="text-muted-foreground mb-4">{selectedLesson.content}</p>

                    <h3 className="font-semibold mb-3 mt-6">Key Concepts</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Understanding basic logic gates and their truth tables</li>
                      <li>• Boolean algebra principles and operations</li>
                      <li>• Practical applications in digital circuits</li>
                      <li>• Circuit design and optimization techniques</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-border">
                    <Button
                      onClick={() => setShowQuiz(true)}
                      className="gap-2"
                    >
                      Start Quiz
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">Download Materials</Button>
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* Quiz Section */}
                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-2">{mockQuiz.title}</h2>
                  <p className="text-muted-foreground mb-6">
                    Time limit: {mockQuiz.timeLimit} minutes • Passing score: {mockQuiz.passingScore}%
                  </p>

                  {quizScore === null ? (
                    <div className="space-y-8">
                      {mockQuiz.questions.map((question, qIdx) => (
                        <div key={question.id} className="pb-6 border-b border-border last:border-0">
                          <h3 className="font-semibold mb-4">
                            Question {qIdx + 1}: {question.question}
                          </h3>
                          <div className="space-y-2">
                            {question.options.map((option, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => handleQuizAnswer(qIdx, optIdx)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  quizAnswers[qIdx] === optIdx
                                    ? 'bg-primary/10 border-primary/50'
                                    : 'bg-card border-border hover:border-primary/30'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      quizAnswers[qIdx] === optIdx
                                        ? 'bg-primary border-primary'
                                        : 'border-border'
                                    }`}
                                  >
                                    {quizAnswers[qIdx] === optIdx && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <span>{option}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-3 pt-6">
                        <Button
                          onClick={() => {
                            if (quizAnswers.length === mockQuiz.questions.length) {
                              setQuizAnswers([...quizAnswers]); // Trigger score calculation
                            }
                          }}
                          disabled={quizAnswers.length !== mockQuiz.questions.length}
                          className="gap-2"
                        >
                          Submit Quiz
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setShowQuiz(false)}>
                          Back to Lesson
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-6">
                        <div className="text-6xl font-bold mb-2">
                          <span className={quizScore >= mockQuiz.passingScore ? 'text-accent' : 'text-destructive'}>
                            {quizScore}%
                          </span>
                        </div>
                        <p className="text-lg font-semibold">
                          {quizScore >= mockQuiz.passingScore ? '✓ Passed!' : '⚠ Did not pass'}
                        </p>
                      </div>

                      <p className="text-muted-foreground mb-6">
                        {quizScore >= mockQuiz.passingScore
                          ? 'Great job! You have mastered this lesson.'
                          : 'Review the lesson materials and try again to improve your score.'}
                      </p>

                      <div className="flex gap-3 justify-center">
                        <Button onClick={() => setShowQuiz(false)}>Back to Lesson</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQuizAnswers([]);
                          }}
                        >
                          Retake Quiz
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
