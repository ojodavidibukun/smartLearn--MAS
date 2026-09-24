import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const db = getFirestore();

export default function signUp(){
    const [, setLocation] = useLocation();
    
    //State Variables for managing authentication state, mail, password, and error messages
    const [authing, setAuthing] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'student' | 'lecturer'>('student');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Simple client-side validation helpers
    const isEmailValid = (e: string) => /\S+@\S+\.\S+/.test(e);
    const isPasswordStrong = (p: string) => p.length >= 6;

    //function to handle signup with email & password (auth logic unchanged)
    const handleEmailSignUp = async () => {
        setAuthing(true);
        setError("");
        setSuccess("")

        if (!fullName.trim()) {
            setError("Please enter your full name.");
            setAuthing(false);
            return;
        }

        if (!isEmailValid(email)) {
            setError("Please enter a valid email address.");
            setAuthing(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setAuthing(false);
            return;
        }

        if (!isPasswordStrong(password)) {
            setError("Password must be at least 6 characters.");
            setAuthing(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userData: any = {
                fullName: fullName,
                email: email,
                role,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, "users", user.uid), userData);

            setSuccess("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                setLocation("/login");
            }, 1200);

        } catch (err: any) {
            setError(err.message || "Failed to create account.");
        } finally {
            setAuthing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="grid grid-cols-1 md:grid-cols-2 flex-1">
                <aside className="hidden md:flex items-center justify-center p-12 bg-gradient-to-br from-primary/10 to-accent/5">
                    <div className="max-w-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-6 shadow-md">
                            <span className="text-white font-bold text-2xl">YL</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-3">Create your YouLearn account</h2>
                        <p className="text-muted-foreground">Join learners and facilitators building better learning experiences on YouLearn.</p>
                    </div>
                </aside>

                <section className="flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="mb-4 text-center">
                            <h2 className="text-2xl font-bold">Create your account</h2>
                            <p className="text-sm text-muted-foreground mt-1">Choose your role and complete registration</p>
                        </div>

                        {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
                        {success && <div className="mb-4 text-sm text-accent">{success}</div>}

                        <Card className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <Label>Full name</Label>
                                    <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="border-0 p-0" />
                                    </div>
                                </div>

                                <div>
                                    <Label>Email</Label>
                                    <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" type="email" className="border-0 p-0" />
                                    </div>
                                </div>

                                <div>
                                    <Label>Password</Label>
                                    <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                                        <Lock className="w-5 h-5 text-muted-foreground" />
                                        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" type={showPassword ? 'text' : 'password'} className="border-0 p-0" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-muted-foreground">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                                </div>

                                <div>
                                    <Label>Confirm password</Label>
                                    <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                                        <Lock className="w-5 h-5 text-muted-foreground" />
                                        <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" type={showConfirm ? 'text' : 'password'} className="border-0 p-0" />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="ml-2 text-muted-foreground">
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        className={`flex-1 px-4 py-2 rounded-md border ${role === 'student' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent'}`}
                                        onClick={() => setRole('student')}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 px-4 py-2 rounded-md border ${role === 'lecturer' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent'}`}
                                        onClick={() => setRole('lecturer')}
                                    >
                                        Facilitator
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <Button className="flex-1" onClick={handleEmailSignUp} disabled={authing}>
                                        {authing ? 'Signing Up...' : 'Create account'}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setLocation('/login')}>Back</Button>
                                </div>
                            </div>
                        </Card>

                        <div className="mt-4 text-sm text-center text-muted-foreground">
                            By creating an account you agree to our terms.
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}