import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc, getFirestore } from "firebase/firestore";

const db = getFirestore();

export default function loginDummy(){
    const [, setLocation] = useLocation();
    
    //State Variables for managing authentication state, mail, password, and error messages
    const [authing, setAuthing] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    //function to handle signin with email & password
    const handleEmailSignIn = async () => {
        setAuthing(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const docSnap = await getDoc(doc(db, "users", user.uid));

            if (docSnap.exists()) {
                setLocation("/dashboard");
            } else {
                setError("No profile found for this user.");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setAuthing(false);
        }
    };    

    return(
        <>
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
                <h2>Login</h2>

                <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                    borderBottom: "1px solid gray"
                }}
                />

                <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                    borderBottom: "1px solid gray"
                }}
                />

                <button
                onClick={handleEmailSignIn}
                disabled={authing}
                >
                {authing ? "Signing In..." : "Sign In"}
                </button>

                <p style={{ textAlign: "center" }}>
                    <span
                        style={{ color: "blue", cursor: "pointer" }}
                        onClick={() => setLocation("/forgot-password")}
                    >
                        Forgot Password?
                    </span>
                </p>


                {/* error message */}
                {error && <p style={{ color: "red" }}>{error}</p>}


                <p style={{ textAlign: "center" }}>
                    New user?{" "}
                <span
                    style={{ color: "blue", cursor: "pointer" }}
                    onClick={() => setLocation("/signup")}
                >
                    Sign up here
                </span>
                </p>
            </div>
        </>
    )
}