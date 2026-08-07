import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useLocation } from 'wouter';

export function useLogout() {
  const [, setLocation] = useLocation();

  const logout = async () => {
    try {
      await signOut(auth);
      setLocation("/login");
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return { logout };
}