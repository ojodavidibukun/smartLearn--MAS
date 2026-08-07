import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";

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
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return(
        <div
            style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "350px",
            margin: "100px auto",
            boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.2)",
            padding: "20px"
            }}
        >
            <h2>Reset your password</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {message && <p style={{ color: "green" }}>{message}</p>}

            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
                borderBottom: "1px solid gray"
            }}
            />

            <button
            onClick={handleReset}
            disabled={sending}
            >
            {sending ? "Sending..." : "Send Reset Email"}
            </button>

            <p style={{ textAlign: "center" }}>
                <span
                    style={{ color: "blue", cursor: "pointer" }}
                    onClick={() => setLocation("/login")}
                >
                    Back to Login
                </span>
            </p>
        </div>
    )
}