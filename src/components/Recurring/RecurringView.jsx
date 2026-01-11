import React, { useState } from 'react';
import { RefreshCw, Trash2, Plus } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useRecurring } from '../../hooks/useRecurring';

export default function RecurringView({ accounts }) {
    const { currentUser } = useAuth();
    const { recurringItems } = useRecurring();
    const appId = 'default-503020-app';
    
    const [newItem, setNewItem] = useState({ name: '', amount: '', dayOfMonth: '1', category: 'needs', accountId: '' });

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.amount) return;

        const path = `artifacts/${appId}/users/${currentUser.uid}/recurring_items`;
        await addDoc(collection(db, path), {
            name: newItem.name,
            amount: parseFloat(newItem.amount),
            dayOfMonth: parseInt(newItem.dayOfMonth),
            category: newItem.category,
            accountId: newItem.accountId,
            lastProcessed: '' // Empty so it triggers immediately next time
        });
        setNewItem({ name: '', amount: '', dayOfMonth: '1', category: 'needs', accountId: '' });
    };

    const handleDelete = async (id) => {
        if(confirm("Stop this subscription? It won't be auto-added anymore.")) {
            const path = `artifacts/${appId}/users/${currentUser.uid}/recurring_items/${id}`;
            await deleteDoc(doc(db, path));
        }
    };

    return (
        <div className="space-y-8">
            {/* Form */}
            <div className="glass-card p-6 bg-slate-900 text-white dark:bg-slate-800">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <RefreshCw className="mr-2" /> Add Recurring Subscription
                </h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input type="text" placeholder="Name (e.g. Netflix)" className="p-2 rounded bg-slate-800 border border-slate-700 text-white" 
                        value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                    
                    <div className="relative">
                         <span className="absolute left-2 top-2 text-slate-400">$</span>
                         <input type="number" placeholder="Amount" className="w-full pl-6 p-2 rounded bg-slate-800 border border-slate-700 text-white" 
                            value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} required />
                    </div>

                    <select className="p-2 rounded bg-slate-800 border border-slate-700 text-white"
                        value={newItem.dayOfMonth} onChange={e => setNewItem({...newItem, dayOfMonth: e.target.value})}>
                        {Array.from({length: 31}, (_, i) => <option key={i+1} value={i+1}>Day {i+1}</option>)}
                    </select>

                    <select className="p-2 rounded bg-slate-800 border border-slate-700 text-white"
                        value={newItem.accountId} onChange={e => setNewItem({...newItem, accountId: e.target.value})} required>
                        <option value="" disabled>Pay From...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname}</option>)}
                    </select>

                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 rounded font-bold text-white flex items-center justify-center">
                        <Plus size={18} className="mr-1" /> Add
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recurringItems.map(item => (
                    <div key={item.id} className="glass-card p-5 border-l-4 border-pink-500 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-lg dark:text-white">{item.name}</h4>
                            <p className="text-sm text-gray-500">Auto-pays on Day {item.dayOfMonth}</p>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 mt-2 inline-block">
                                {item.category.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-xl text-gray-900 dark:text-white">${item.amount}</p>
                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 text-xs mt-2 flex items-center ml-auto">
                                <Trash2 size={12} className="mr-1" /> Stop
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}