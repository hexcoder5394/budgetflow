import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useBudget(month, year) {
    const { currentUser } = useAuth();
    const [budgetData, setBudgetData] = useState({ income: 0, budgetRule: '50/30/20' });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // This matches your original appId variable
    const appId = 'default-503020-app'; 
    const monthYear = `${year}-${month}`;

    useEffect(() => {
        if (!currentUser) {
            setItems([]);
            return;
        }

        setLoading(true);

        // Path: artifacts/{appId}/users/{uid}/budget/{YYYY-MM}
        const userBudgetPath = `artifacts/${appId}/users/${currentUser.uid}/budget/${monthYear}`;
        const budgetDocRef = doc(db, userBudgetPath);
        const itemsColRef = collection(db, userBudgetPath, 'items');

        // Listener 1: Income & Rule
        const unsubBudget = onSnapshot(budgetDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setBudgetData(docSnap.data());
            } else {
                // Default values if month doesn't exist yet
                setBudgetData({ income: 0, budgetRule: '50/30/20' });
            }
        });

        // Listener 2: Budget Items (Expenses/Needs/Wants)
        const unsubItems = onSnapshot(itemsColRef, (snapshot) => {
            const loadedItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(loadedItems);
            setLoading(false);
        });

        // Cleanup function (runs when month changes or component unmounts)
        return () => {
            unsubBudget();
            unsubItems();
        };

    }, [currentUser, month, year]); // Re-run if any of these change

    return { budgetData, items, loading };
}