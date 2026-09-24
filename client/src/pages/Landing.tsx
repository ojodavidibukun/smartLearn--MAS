// SmartLearn MAS - Landing Page
// Production-focused hero, features, and system overview

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Brain, BarChart3, Zap, Users, Target, Lightbulb } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Brain,
      title: 'Adaptive Learning Paths',
      description: 'Learning guidance adapts to your progress, quiz results, and pace',
    },
    {
      icon: BarChart3,
      title: 'Personal Learning Insights',
      description: 'See your progress, quiz results, and topics that deserve more practice',
    },
    {
      icon: Zap,
      title: 'Intelligent Recommendations',
      description: 'Personalized suggestions powered by multi-agent decision-making',
    },
    {
      icon: Users,
      title: 'Personal Learning Assistant',
      description: 'Student-focused agents help you choose what to learn next',
    },
    {
      icon: Target,
      title: 'Actionable Guidance',
      description: 'Turn your own learning activity into useful next steps',
    },
    {
      icon: Lightbulb,
      title: 'Quality Course Content',
      description: 'Facilitators create and publish lessons, videos, materials, and quizzes',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">YL</span>
            </div>
            <span className="font-semibold text-lg">YouLearn</span>
          </div>
          <Button onClick={() => setLocation('/login')} className="gap-2">
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Intelligent Learning
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Powered by Agents
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              YouLearn helps students discover courses, learn at their own pace, and receive personal guidance based on their activity and quiz performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation('/login')}
                className="gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation('/agents')}
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Designed for Modern Education</h2>
            <p className="text-muted-foreground">
              Built on agent-based architecture for scalability, reliability, and continuous improvement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Multi-Agent System</h2>
            <p className="text-muted-foreground">
              Six specialized agents work together to optimize the learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="font-semibold mb-3 text-primary">For Students</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Personalized learning paths that adapt to your pace</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Real-time feedback and performance insights</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Targeted recommendations for improvement</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Timely notifications and reminders</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3 text-accent">For Facilitators</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Create and manage quality learning experiences</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Publish lessons, videos, materials, and quizzes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Edit courses and organize learning resources</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>Keep courses clear, current, and useful</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Learning?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start exploring how intelligent agents can personalize education and improve outcomes.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation('/login')}
            className="gap-2"
          >
            Sign In Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 YouLearn. Intelligent Learning Platform</p>
        </div>
      </footer>
    </div>
  );
}
