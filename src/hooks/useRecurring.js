import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useRecurring() {
    const { currentUser } = useAuth();
    const [recurringItems, setRecurringItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const appId = 'default-503020-app'; 

    useEffect(() => {
        if (!currentUser) return;

        const path = `artifacts/${appId}/users/${currentUser.uid}/recurring_items`;
        // Order by "Day of Month" so bills appear in chronological order
        const q = query(collection(db, path), orderBy('dayOfMonth'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecurringItems(items);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    return { recurringItems, loading };
}