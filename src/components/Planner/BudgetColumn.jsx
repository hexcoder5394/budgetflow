import React, { useState } from 'react';
import { Trash2, ArrowRight, Save, DollarSign } from 'lucide-react';
import { addBudgetItem, deleteBudgetItem } from '../../utils/budgetActions'; // Ensure this utility is created as discussed
import { useAuth } from '../../context/AuthContext';

export default function BudgetColumn({ category, label, color, items, accounts, isTransfer, monthYear }) {
  const { currentUser } = useAuth();
  
  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    accountId: '', 
    toAccountId: '' 
  });
  
  const [loading, setLoading] = useState(false);

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      // Pass the data to the utility function
      await addBudgetItem(currentUser.uid, monthYear, formData, category);
      
      // Reset Form
      setFormData({ 
        name: '', 
        amount: '', 
        date: new Date().toISOString().split('T')[0], 
        accountId: '', 
        toAccountId: '' 
      });
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This will reverse the transaction.`)) return;
    try {
      // Pass the full item object so the utility knows which accounts to refund/charge
      await deleteBudgetItem(currentUser.uid, monthYear, item); 
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Helper to find Account Nickname by ID
  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.nickname : 'Unknown Account';
  };

  // Dynamic Styles based on color prop
  const styles = {
    green: 'border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300',
    blue: 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300',
    purple: 'border-purple-500 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300',
    gray: 'border-gray-500 text-gray-700 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300',
    orange: 'border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300',
  };

  const currentStyle = styles[color] || styles.gray;

  return (
    <div className={`p-5 rounded-xl shadow-sm border-l-4 transition-all duration-300 ${currentStyle}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
        {label}
        {/* Calculate Remaining if needed, or just show total spent */}
        <span className="text-sm font-normal opacity-75">
          ${items.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
        </span>
      </h3>
      
      {/* --- ADD ITEM FORM --- */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input 
          type="text" 
          placeholder={isTransfer ? "e.g., Emergency Fund" : "e.g., Groceries"}
          className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          required 
        />
        
        <div className="grid grid-cols-2 gap-2">
           <div className="relative">
             <span className="absolute left-3 top-2.5 text-gray-400 text-xs">$</span>
             <input 
                type="number" 
                placeholder="0.00" 
                step="0.01"
                min="0"
                className="w-full pl-6 p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required 
              />
           </div>
           
           {/* Only show Date for Expenses. Transfers are usually "Now" */}
           {!isTransfer && (
             <input 
                type="date" 
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required 
              />
           )}
        </div>

        {/* --- ACCOUNT SELECTION LOGIC --- */}
        {isTransfer ? (
            // SAVINGS: Needs "From" and "To"
            <div className="space-y-2">
                <select 
                    className="w-full p-2.5 rounded-lg border border-gray-200 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.accountId}
                    onChange={e => setFormData({...formData, accountId: e.target.value})}
                    required
                >
                    <option value="" disabled>Transfer from...</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.nickname} (${acc.balance})</option>
                    ))}
                </select>
                <select 
                    className="w-full p-2.5 rounded-lg border border-gray-200 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.toAccountId}
                    onChange={e => setFormData({...formData, toAccountId: e.target.value})}
                    required
                >
                    <option value="" disabled>Deposit to...</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.nickname} (${acc.balance})</option>
                    ))}
                </select>
            </div>
        ) : (
            // EXPENSE: Just "Pay From"
            <select 
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.accountId}
                onChange={e => setFormData({...formData, accountId: e.target.value})}
                required
            >
                <option value="" disabled>Pay from...</option>
                {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.nickname} (${acc.balance})</option>
                ))}
            </select>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg opacity-90 hover:opacity-100 flex justify-center items-center gap-2 bg-${color}-600`}
        >
          {loading ? 'Adding...' : (
             <>
               {isTransfer ? <Save size={16} /> : <DollarSign size={16} />}
               Add {label}
             </>
          )}
        </button>
      </form>

      {/* --- ITEMS LIST --- */}
      <ul className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {items.length === 0 && (
          <li className="text-center text-sm opacity-50 italic py-4">No items yet</li>
        )}
        {items.map(item => (
           <li key={item.id} className="group flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-all">
              <div className="overflow-hidden">
                 <p className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{item.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {/* Render Account Name(s) */}
                    {isTransfer ? (
                        <>
                          {getAccountName(item.accountId)} 
                          <ArrowRight size={10} /> 
                          {getAccountName(item.toAccountId)}
                        </>
                    ) : (
                        getAccountName(item.accountId)
                    )}
                    
                    {/* Date (for expenses) */}
                    {!isTransfer && item.date && (
                        <span className="opacity-75"> • {new Date(item.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    )}
                 </p>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                 <span className="font-bold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</span>
                 <button 
                    onClick={() => handleDelete(item)} 
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Delete item and reverse transaction"
                 >
                    <Trash2 size={16}/>
                 </button>
              </div>
           </li>
        ))}
      </ul>
    </div>
  );
}