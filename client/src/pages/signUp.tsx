import { useState } from "react";
import { useLocation } from 'wouter';
import { auth } from "../firebase/config";
import { GoogleAuthProvider, signInWithPopup,createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

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


    //function to handle signup with email & password
    const handleEmailSignUp = async () => {
        setAuthing(true);
        setError("");
        setSuccess("")

        if (password !== confirmPassword) {
            setError("Passwords do not match");
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

            console.log(auth.currentUser);
            setSuccess("Account created successfully! Please Login");
            setTimeout(() => {
                setLocation("/login");
            }, 2000);

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
                <h2>Welcome, input your information below</h2>

                <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                    borderBottom: "1px solid gray"
                }}
                />

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

                <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                    borderBottom: "1px solid gray"
                }}
                />

                {/* Role Slider */}
                <div
                style={{
                    display: "flex",
                    border: "2px solid gray",
                    borderRadius: "20px",
                    overflow: "hidden",
                }}
                >
                <button
                    type="button"
                    onClick={() => setRole("student")}
                    style={{
                        flex: 1,
                        padding: "8px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: role === "student" ? "gray" : "white",
                        color: role === "student" ? "white" : "gray",
                    }}
                >
                    Student
                </button>
                <button
                    type="button"
                    onClick={() => setRole("lecturer")}
                    style={{
                        flex: 1,
                        padding: "8px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: role === "lecturer" ? "gray" : "white",
                        color: role === "lecturer" ? "white" : "gray",
                    }}
                >
                    Lecturer
                </button>
                </div>

                {/* Sign Up Button */}
                <button
                onClick={handleEmailSignUp}
                disabled={authing}
                >
                {authing ? "Signing Up..." : "Sign Up"}
                </button>

                {/* error message */}
                {error && <p style={{ color: "red" }}>{error}</p>}              
            </div>

             {success && (
                <div
                    style={{
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                    border: "1px solid #10b981",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                    }}
                >
                    {success}
                </div>
            )}
        </>
    )
}