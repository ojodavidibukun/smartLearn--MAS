import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-md p-6">
                <div className="mb-4 text-center">
                    <h2 className="text-2xl font-bold">Reset your password</h2>
                    <p className="text-sm text-muted-foreground mt-1">Enter your account email and we’ll send a reset link</p>
                </div>

                {error && <div className="mb-3 text-sm text-destructive">{error}</div>}
                {message && <div className="mb-3 text-sm text-accent">{message}</div>}

                <div className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <Button onClick={handleReset} className="flex-1" disabled={sending}>{sending ? 'Sending...' : 'Send Reset Email'}</Button>
                        <Button variant="ghost" size="sm" onClick={() => setLocation('/login')}>Back</Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}