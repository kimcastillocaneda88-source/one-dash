import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  role: "Admin" | "TeamLeader" | "Member";
  teams?: string[]; // Array of team IDs
  createdAt?: Date;
}

interface FirebaseAuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(
  undefined
);

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        setError(null);

        if (firebaseUser) {
          // User is signed in, fetch their profile from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: firebaseUser.displayName || undefined,
              role: userData.role || "Member",
              teams: userData.teams || [],
              createdAt: userData.createdAt?.toDate?.(),
            });
          } else {
            // User document doesn't exist, create a basic profile
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: firebaseUser.displayName || undefined,
              role: "Member",
              teams: [],
            });
          }

          setFirebaseUser(firebaseUser);
        } else {
          // User is signed out
          setUser(null);
          setFirebaseUser(null);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Logout error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        logout,
        loginWithGoogle,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error(
      "useFirebaseAuth must be used within FirebaseAuthProvider"
    );
  }
  return context;
}
