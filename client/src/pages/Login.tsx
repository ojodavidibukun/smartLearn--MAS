// SmartLearn MAS - Login Page
// Production-focused authentication interface

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, Users, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* Split screen */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2">
        {/* Left hero */}
        <section className="hidden md:flex items-center justify-center p-12 bg-gradient-to-br from-primary/10 to-accent/5">
          <div className="max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-6 shadow-md">
              <span className="text-white font-bold text-2xl">SL</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">Welcome back to SmartLearn</h2>
            <p className="text-muted-foreground mb-6">A modern learning environment built for educators and students — pick a portal or sign in with your email.</p>

            <div className="rounded-lg p-4 bg-card/60 border">
              <p className="text-sm">Explore courses, track progress, and get tailored recommendations.</p>
            </div>
          </div>
        </section>

        {/* Right form column */}
        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl font-bold">Sign in to SmartLearn</h1>
              <p className="text-sm text-muted-foreground mt-1">Secure access for students and educators</p>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Student Portal</h3>
                      <p className="text-sm text-muted-foreground">Access your courses and track progress</p>
                    </div>
                    <div>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStudentLogin(); }}>Student</Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Educator Portal</h3>
                      <p className="text-sm text-muted-foreground">View class analytics and student insights</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleLecturerLogin(); }}>Educator</Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Email form card */}
              <Card className="p-6">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Sign in with email</h4>
                    <button className="text-sm text-muted-foreground underline" onClick={() => setShowEmailForm(!showEmailForm)}>{showEmailForm ? 'Hide' : 'Use email'}</button>
                  </div>
                </div>

                {showEmailForm && (
                  <form onSubmit={(e) => { e.preventDefault(); signInWithEmail('student'); }} className="space-y-4">
                    {error && <div className="text-sm text-destructive">{error}</div>}

                    <div>
                      <Label className="mb-2">Email</Label>
                      <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" type="email" className="border-0 p-0" />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2">Password</Label>
                      <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type={showPassword ? 'text' : 'password'} className="border-0 p-0" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button className="flex-1" disabled={loading}>{loading ? 'Signing...' : 'Sign In'}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setLocation('/forgot-password')}>Forgot?</Button>
                    </div>
                  </form>
                )}
              </Card>

              <div className="text-center text-sm text-muted-foreground">
                <p>Need an account? <button className="text-primary underline" onClick={() => setLocation('/signup')}>Create one</button></p>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 SmartLearn. All rights reserved.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
