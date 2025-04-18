import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/firebaseConfig";

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid));
            if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
            } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email }); // fallback
            }
        } else {
            setUser(null);
        }
        setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}
