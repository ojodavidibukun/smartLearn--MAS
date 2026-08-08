// SmartLearn MAS - Login Page
// Production-focused authentication interface

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, Users } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Login() {
  const [, setLocation] = useLocation();

  const handleStudentLogin = () => {
    localStorage.setItem('userRole', 'student');
    localStorage.setItem('isLoggedIn', 'true');
    setLocation('/dashboard');
  };

  const handleLecturerLogin = () => {
    localStorage.setItem('userRole', 'lecturer');
    localStorage.setItem('isLoggedIn', 'true');
    setLocation('/dashboard');
  };

  // Email/password form state (keeps existing mock auth logic)
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithEmail = async (role: 'student' | 'lecturer') => {
    setError('');
    if (!email || !password) {
      setError('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      // preserve existing mock behavior: store role in localStorage
      localStorage.setItem('userRole', role);
      localStorage.setItem('isLoggedIn', 'true');
      setLocation('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex flex-col">
      {/* Header */}
      <div className="container py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">SL</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">SmartLearn</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            {/* Student Login */}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={handleStudentLogin}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Student Portal</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Access your courses and track progress
                  </p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStudentLogin();
                    }}
                    className="w-full"
                  >
                    Sign In as Student
                  </Button>
                </div>
              </div>
            </Card>

            {/* Lecturer Login */}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={handleLecturerLogin}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Educator Portal</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View class analytics and student insights
                  </p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLecturerLogin();
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Sign In as Educator
                  </Button>
                </div>
              </div>
            </Card>

            {/* Email / Password option */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Sign in with Email</h3>
                <div>
                  <button className="text-sm text-muted-foreground underline" onClick={() => setShowEmailForm(!showEmailForm)}>{showEmailForm ? 'Hide' : 'Use email'}</button>
                </div>
              </div>

              {showEmailForm && (
                <div className="space-y-3">
                  {error && <div className="text-sm text-destructive">{error}</div>}
                  <div>
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" type="email" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => signInWithEmail('student')} disabled={loading} className="flex-1">{loading ? 'Signing...' : 'Sign in as Student'}</Button>
                    <Button variant="outline" onClick={() => signInWithEmail('lecturer')} disabled={loading}>Educator</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <p className="text-sm text-muted-foreground">
              This is a demonstration environment. Use either portal to explore the system.
            </p>
            <div className="text-sm">
              <button onClick={() => setLocation('/forgot-password')} className="text-primary underline-offset-4 hover:underline">Forgot password?</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 SmartLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
