import React, { useState } from 'react';
import { Trash2, CreditCard, Plus, Save } from 'lucide-react';
import { addDoc, deleteDoc, doc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

// Sri Lankan Banks List
const SRI_LANKAN_BANKS = [
    "Commercial Bank", "NDB Bank", "NDB Wealth Management", 
    "Bank of Ceylon", "HNB", "Sampath Bank", "DFCC", 
    "NSB", "Peoples bank", "CDB", "Other"
];

// Card Colors for variety
const CARD_COLORS = [
    'border-l-blue-500 text-blue-600',
    'border-l-cyan-500 text-cyan-600',
    'border-l-green-500 text-green-600',
    'border-l-orange-500 text-orange-600',
    'border-l-purple-500 text-purple-600'
];

export default function BanksView({ accounts }) {
    const { currentUser } = useAuth();
    const appId = 'default-503020-app';
    const collectionPath = `artifacts/${appId}/users/${currentUser.uid}/bank_accounts`;

    // Local state for the "Add Account" form
    const [newAccount, setNewAccount] = useState({ bankName: '', nickname: '', balance: '' });

    // --- ACTIONS ---
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAccount.bankName || !newAccount.nickname) return;
        
        await addDoc(collection(db, collectionPath), {
            bankName: newAccount.bankName,
            nickname: newAccount.nickname,
            balance: parseFloat(newAccount.balance) || 0
        });
        setNewAccount({ bankName: '', nickname: '', balance: '' }); // Reset
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this account? History will remain, but the account will be gone.")) {
            await deleteDoc(doc(db, collectionPath, id));
        }
    };

    const handleUpdateBalance = async (id, newBalance) => {
        const bal = parseFloat(newBalance);
        if (isNaN(bal)) return;
        await updateDoc(doc(db, collectionPath, id), { balance: bal });
    };

    return (
        <div className="space-y-8">
            {/* 1. Add Account Form */}
            <div className="glass-card p-6 bg-gray-900 text-white dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Plus className="mr-2" /> Add Bank Account
                </h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select 
                        className="p-3 rounded bg-gray-800 border border-gray-700 text-white"
                        value={newAccount.bankName}
                        onChange={e => setNewAccount({...newAccount, bankName: e.target.value})}
                        required
                    >
                        <option value="" disabled>Select Bank</option>
                        {SRI_LANKAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <input 
                        type="text" placeholder="Nickname (e.g. Salary Acc)"
                        className="p-3 rounded bg-gray-800 border border-gray-700 text-white"
                        value={newAccount.nickname}
                        onChange={e => setNewAccount({...newAccount, nickname: e.target.value})}
                        required
                    />

                    <input 
                        type="number" placeholder="Current Balance" step="0.01"
                        className="p-3 rounded bg-gray-800 border border-gray-700 text-white"
                        value={newAccount.balance}
                        onChange={e => setNewAccount({...newAccount, balance: e.target.value})}
                        required
                    />

                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition">
                        Add Account
                    </button>
                </form>
            </div>

            {/* 2. Accounts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map((acc, index) => (
                    <AccountCard 
                        key={acc.id} 
                        account={acc} 
                        colorClass={CARD_COLORS[index % CARD_COLORS.length]}
                        onDelete={() => handleDelete(acc.id)}
                        onUpdate={(val) => handleUpdateBalance(acc.id, val)}
                    />
                ))}
            </div>
        </div>
    );
}

// Sub-component for individual card logic
function AccountCard({ account, colorClass, onDelete, onUpdate }) {
    const [editMode, setEditMode] = useState(false);
    const [tempBal, setTempBal] = useState(account.balance);

    const saveBalance = () => {
        onUpdate(tempBal);
        setEditMode(false);
    };

    return (
        <div className={`glass-card p-5 border-l-4 ${colorClass}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg dark:text-white">{account.nickname}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{account.bankName}</p>
                </div>
                <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase font-semibold">Current Balance</p>
                {editMode ? (
                    <div className="flex items-center space-x-2 mt-1">
                        <input 
                            type="number" 
                            value={tempBal} 
                            onChange={(e) => setTempBal(e.target.value)}
                            className="p-1 border rounded w-full dark:bg-gray-700 dark:text-white"
                        />
                        <button onClick={saveBalance} className="text-green-500"><Save size={20} /></button>
                    </div>
                ) : (
                    <div 
                        className="text-3xl font-bold dark:text-white cursor-pointer hover:underline decoration-dashed"
                        onClick={() => { setTempBal(account.balance); setEditMode(true); }}
                        title="Click to edit balance"
                    >
                        {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(account.balance)}
                    </div>
                )}
            </div>
        </div>
    );
}