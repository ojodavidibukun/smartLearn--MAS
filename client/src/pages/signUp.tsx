import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const db = getFirestore();

export default function signUp(){
    const [, setLocation] = useLocation();
    
    //State Variables for managing authentication state, mail, password, and error messages
    const [authing, setAuthing] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState("student");
    const [error, setError] = useState('');
    const [success, setSuccess] = useState("");

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

            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                role: role,
                createdAt: serverTimestamp(),
            });

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
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-md p-6">
                <div className="mb-4 text-center">
                    <h2 className="text-2xl font-bold">Create your account</h2>
                    <p className="text-sm text-muted-foreground mt-1">Join SmartLearn — choose your role and get started</p>
                </div>

                {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
                {success && <div className="mb-4 text-sm text-accent">{success}</div>}

                <div className="space-y-4">
                    <div>
                        <Label>Full name</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                    </div>

                    <div>
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" type="email" />
                    </div>

                    <div>
                        <Label>Password</Label>
                        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" type="password" />
                        <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                        <Label>Confirm password</Label>
                        <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" type="password" />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <div className={`px-3 py-1 rounded-md cursor-pointer border ${role === 'student' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent'}`} onClick={() => setRole('student')}>Student</div>
                        <div className={`px-3 py-1 rounded-md cursor-pointer border ${role === 'lecturer' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent'}`} onClick={() => setRole('lecturer')}>Educator</div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <Button className="flex-1" onClick={handleEmailSignUp} disabled={authing}>
                            {authing ? 'Signing Up...' : 'Sign Up'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setLocation('/login')}>Back to Login</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}