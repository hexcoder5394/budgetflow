import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useBudget(month, year) {
    const { currentUser } = useAuth();
    const [budgetData, setBudgetData] = useState({ 
        income: 0, 
        rule: '50/30/20', // Default rule
        limit: 0 
    });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dynamic Path based on selection
    const monthYear = `${year}-${month}`;
    const appId = 'default-503020-app';

    useEffect(() => {
        if (!currentUser) return;

        const userPath = `artifacts/${appId}/users/${currentUser.uid}`;
        const budgetDocPath = `${userPath}/budget/${monthYear}`;
        const itemsPath = `${budgetDocPath}/items`;

        // 1. Listen to Budget Document (Income, Rule, etc.)
        const unsubBudget = onSnapshot(doc(db, budgetDocPath), (docSnap) => {
            if (docSnap.exists()) {
                setBudgetData({ ...docSnap.data() });
            } else {
                // If doc doesn't exist, we just show defaults (0 income), we don't crash.
                setBudgetData({ income: 0, rule: '50/30/20', limit: 0 });
            }
        });

        // 2. Listen to Budget Items (Expenses)
        const q = query(collection(db, itemsPath), orderBy('createdAt', 'desc'));
        const unsubItems = onSnapshot(q, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(fetchedItems);
            setLoading(false);
        });

        return () => {
            unsubBudget();
            unsubItems();
        };
    }, [currentUser, month, year]);

    // --- THE FIX IS IN THESE FUNCTIONS BELOW ---
    
    // Function to safely update Income
    const updateIncome = async (newIncome) => {
        if (!currentUser) return;
        const budgetRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/budget/${monthYear}`);
        
        // Use setDoc with merge:true instead of updateDoc
        await setDoc(budgetRef, { 
            income: parseFloat(newIncome) 
        }, { merge: true });
    };

    // Function to safely update Budget Rule
    const updateRule = async (newRule) => {
        if (!currentUser) return;
        const budgetRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/budget/${monthYear}`);
        
        // Use setDoc with merge:true
        // This ensures the document is CREATED if it's the first time you touch it for the month
        await setDoc(budgetRef, { 
            rule: newRule 
        }, { merge: true });
    };

    return { 
        budgetData, 
        items, 
        loading, 
        updateIncome, 
        updateRule // Make sure to export this so components can use it
    };
}