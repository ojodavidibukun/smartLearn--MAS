import { useState, useEffect } from "react";
import { getDoc, doc, getFirestore } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const db = getFirestore();

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading]);

  return { profile, loading };
}