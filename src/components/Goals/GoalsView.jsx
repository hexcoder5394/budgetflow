import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target, Calendar } from 'lucide-react';
import { addDoc, collection, doc, deleteDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useGoals } from '../../hooks/useGoals';
import { useAccounts } from '../../hooks/useAccounts'; // We reuse this!

const appId = 'default-503020-app';

export default function GoalsView() {
    const { goals, loading } = useGoals();
    const { currentUser } = useAuth();
    const [newGoal, setNewGoal] = useState({ name: '', totalAmount: '', targetDate: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newGoal.name || !newGoal.totalAmount) return;

        const path = `artifacts/${appId}/users/${currentUser.uid}/saving_goals`;
        await addDoc(collection(db, path), {
            name: newGoal.name,
            totalAmount: parseFloat(newGoal.totalAmount),
            targetDate: newGoal.targetDate,
            createdAt: new Date().toISOString()
        });
        setNewGoal({ name: '', totalAmount: '', targetDate: '' });
    };

    return (
        <div className="space-y-8">
            {/* Create Goal Form */}
            <div className="glass-card p-6 bg-slate-900 text-white dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Target className="mr-2" /> Create Saving Goal
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                        type="text" placeholder="Goal Name (e.g. New Laptop)"
                        className="p-3 rounded bg-slate-800 border border-slate-700 text-white"
                        value={newGoal.name}
                        onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                        required
                    />
                    <input 
                        type="number" placeholder="Target Amount"
                        className="p-3 rounded bg-slate-800 border border-slate-700 text-white"
                        value={newGoal.totalAmount}
                        onChange={e => setNewGoal({...newGoal, totalAmount: e.target.value})}
                        required
                    />
                    <input 
                        type="date"
                        className="p-3 rounded bg-slate-800 border border-slate-700 text-white"
                        value={newGoal.targetDate}
                        onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})}
                        required
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition">
                        Start Goal
                    </button>
                </form>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} userId={currentUser.uid} />
                ))}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: GOAL CARD ---
function GoalCard({ goal, userId }) {
    const { accounts } = useAccounts(); // Get accounts for dropdown
    const [currentSaved, setCurrentSaved] = useState(0);
    const [depositAmount, setDepositAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    
    // Listen to deposits specifically for THIS goal
    useEffect(() => {
        const path = `artifacts/${appId}/users/${userId}/saving_goals/${goal.id}/deposits`;
        const unsub = onSnapshot(collection(db, path), (snapshot) => {
            const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            setCurrentSaved(total);
        });
        return unsub;
    }, [goal.id, userId]);

    const handleDeposit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (!amount || !selectedAccountId) return;

        const goalPath = `artifacts/${appId}/users/${userId}/saving_goals/${goal.id}/deposits`;
        const accountPath = `artifacts/${appId}/users/${userId}/bank_accounts/${selectedAccountId}`;

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Deduct from Bank
                const accountDoc = await transaction.get(doc(db, accountPath));
                if (!accountDoc.exists()) throw new Error("Account not found");
                
                const newBalance = accountDoc.data().balance - amount;
                transaction.update(doc(db, accountPath), { balance: newBalance });

                // 2. Add to Goal (we can't addDoc in transaction easily on generated ID, so we do it after or use setDoc)
                // For safety in this pattern, we update bank first, then add deposit doc normally below.
            });
            
            // Add deposit record
            await addDoc(collection(db, goalPath), {
                amount,
                accountId: selectedAccountId,
                date: new Date().toISOString()
            });
            
            setDepositAmount('');
            setSelectedAccountId('');
        } catch (err) {
            console.error(err);
            alert("Deposit failed");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this goal? Money will NOT be refunded to accounts automatically.")) return;
        // Note: In a real app, you'd delete subcollections recursively. 
        // Here we just delete the parent doc for simplicity.
        const path = `artifacts/${appId}/users/${userId}/saving_goals/${goal.id}`;
        await deleteDoc(doc(db, path));
    };

    const progress = Math.min(100, (currentSaved / goal.totalAmount) * 100);

    return (
        <div className="glass-card p-5 border-l-4 border-blue-500 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg dark:text-white">{goal.name}</h4>
                    <button onClick={handleDelete} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div className="flex justify-between text-sm mb-4 text-gray-600 dark:text-gray-300">
                    <span>${currentSaved.toFixed(2)} saved</span>
                    <span>Target: ${goal.totalAmount}</span>
                </div>
            </div>

            {/* Deposit Form */}
            <form onSubmit={handleDeposit} className="mt-4 pt-4 border-t dark:border-gray-700 flex gap-2">
                <input 
                    type="number" placeholder="$ Amount" 
                    className="w-24 p-2 rounded border text-sm dark:bg-gray-700 dark:text-white"
                    value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                />
                <select 
                    className="flex-1 p-2 rounded border text-sm dark:bg-gray-700 dark:text-white"
                    value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
                >
                    <option value="" disabled>From...</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.nickname}</option>
                    ))}
                </select>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-2 rounded text-sm font-bold">
                    <Plus size={16} />
                </button>
            </form>
        </div>
    );
}