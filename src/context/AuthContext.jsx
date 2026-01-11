import React, { createContext, useContext, useEffect, useState } from "react";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

// Custom hook to use the context easily
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Replaces your 'signupForm' listener
    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    // Replaces your 'loginForm' listener
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Replaces your 'logoutButton' listener
    function logout() {
        return signOut(auth);
    }

    // This runs ONCE when the app starts (like your initializeAppAndAuth)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe; // Cleanup listener on unmount
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}