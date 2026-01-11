import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useAccounts() {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const appId = 'default-503020-app'; 

    useEffect(() => {
        if (!currentUser) {
            setAccounts([]);
            return;
        }

        const accountsPath = `artifacts/${appId}/users/${currentUser.uid}/bank_accounts`;
        const q = query(collection(db, accountsPath)); // Optional: orderBy('nickname')

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedAccounts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAccounts(loadedAccounts);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    return { accounts, loading };
}