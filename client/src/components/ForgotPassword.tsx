import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

export default function ForgotPassword(){
    const [, setLocation] = useLocation();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleReset = async () => {
        setSending(true);
        setError("");
        setMessage("");

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Check your inbox.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
        } finally {
            setSending(false);
        }
    };

    return(
        <div className="min-h-screen bg-background flex flex-col">
            <main className="grid grid-cols-1 md:grid-cols-2 flex-1">
                <aside className="hidden md:flex items-center justify-center p-12 bg-gradient-to-br from-primary/10 to-accent/5">
                    <div className="max-w-sm">
                        <h2 className="text-3xl font-bold mb-3">Forgot your password?</h2>
                        <p className="text-muted-foreground">Enter the email for your account and we’ll send a secure reset link.</p>
                    </div>
                </aside>

                <section className="flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="mb-4 text-center">
                            <h2 className="text-2xl font-bold">Reset your password</h2>
                            <p className="text-sm text-muted-foreground mt-1">We’ll email you a link to reset your password</p>
                        </div>

                        {error && <div className="mb-3 text-sm text-destructive">{error}</div>}
                        {message && <div className="mb-3 text-sm text-accent">{message}</div>}

                        <Card className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <Label>Email</Label>
                                    <div className="flex items-center gap-2 border border-input rounded-md px-2 py-1">
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" className="border-0 p-0" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <Button onClick={handleReset} className="flex-1" disabled={sending}>{sending ? 'Sending...' : 'Send Reset Email'}</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setLocation('/login')}>Back</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>
            </main>
        </div>
    )
}