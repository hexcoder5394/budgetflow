import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useGoals() {
    const { currentUser } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const appId = 'default-503020-app'; 

    useEffect(() => {
        if (!currentUser) return;

        const goalsPath = `artifacts/${appId}/users/${currentUser.uid}/saving_goals`;
        const q = query(collection(db, goalsPath)); // You can add orderBy('createdAt')

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedGoals = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGoals(loadedGoals);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    return { goals, loading };
}