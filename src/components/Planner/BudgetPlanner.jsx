import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, AlertCircle, Save } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { addBudgetItem, deleteBudgetItem } from '../../utils/budgetActions';
import { useAuth } from '../../context/AuthContext';

export default function BudgetPlanner({ monthData, items, accounts, monthYear }) {
  const { currentUser } = useAuth();
  
  // 1. Destructure the safe update functions from the hook
  const { updateIncome, updateRule } = useBudget(monthYear.split('-')[1], monthYear.split('-')[0]);

  // Local state for forms
  const [newItem, setNewItem] = useState({ name: '', amount: '', date: '', accountId: '' });
  const [activeCategory, setActiveCategory] = useState('needs');
  const [loading, setLoading] = useState(false);

  // --- DERIVED CALCULATIONS ---
  const income = monthData?.income || 0;
  const rule = monthData?.rule || '50/30/20';
  
  // Parse Rule (e.g., "50/30/20" -> [50, 30, 20])
  const [needsPct, wantsPct, savingsPct] = rule === '80/20 Rule' 
    ? [80, 0, 20] 
    : [50, 30, 20];

  // Calculate Limits
  const needsLimit = (income * needsPct) / 100;
  const wantsLimit = (income * wantsPct) / 100;
  const savingsLimit = (income * savingsPct) / 100;

  // Calculate Spent per Category
  const spentNeeds = items.filter(i => i.category === 'needs').reduce((sum, i) => sum + i.amount, 0);
  const spentWants = items.filter(i => i.category === 'wants').reduce((sum, i) => sum + i.amount, 0);
  const spentSavings = items.filter(i => i.category === 'savings').reduce((sum, i) => sum + i.amount, 0);

  // --- HANDLERS ---
  const handleAddItem = async (category) => {
    if (!newItem.name || !newItem.amount || !newItem.accountId) return alert("Please fill all fields");
    setLoading(true);
    try {
      await addBudgetItem(currentUser.uid, monthYear, { ...newItem, amount: parseFloat(newItem.amount) }, category);
      setNewItem({ name: '', amount: '', date: '', accountId: '' }); // Reset form
    } catch (error) {
      console.error("Add failed:", error);
      alert("Failed to add item. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (confirm(`Delete ${item.name}?`)) {
      await deleteBudgetItem(currentUser.uid, monthYear, item);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. CONFIGURATION CARD (Income & Rules) */}
      <div className="glass-card p-6 border-l-4 border-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Income Input */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Monthly Income</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
              <input 
                type="number" 
                value={income} 
                onChange={(e) => updateIncome(e.target.value)} // Safe Update
                className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Rule Selector */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Budget Rule</label>
            <select 
              value={rule} 
              onChange={(e) => updateRule(e.target.value)} // Safe Update
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-lg font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="50/30/20">50/30/20 Rule (Balanced)</option>
              <option value="80/20">80/20 Rule (Simple)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. BUDGET COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* NEEDS COLUMN */}
        <BudgetColumn 
          title="Needs" 
          percent={needsPct} 
          limit={needsLimit} 
          spent={spentNeeds} 
          color="green"
          items={items.filter(i => i.category === 'needs')}
          accounts={accounts}
          newItem={newItem}
          setNewItem={setNewItem}
          onAdd={() => handleAddItem('needs')}
          onDelete={handleDelete}
          isActive={activeCategory === 'needs'}
          setActive={() => setActiveCategory('needs')}
        />

        {/* WANTS COLUMN (Only show if rule has wants) */}
        {wantsPct > 0 && (
          <BudgetColumn 
            title="Wants" 
            percent={wantsPct} 
            limit={wantsLimit} 
            spent={spentWants} 
            color="blue"
            items={items.filter(i => i.category === 'wants')}
            accounts={accounts}
            newItem={newItem}
            setNewItem={setNewItem}
            onAdd={() => handleAddItem('wants')}
            onDelete={handleDelete}
            isActive={activeCategory === 'wants'}
            setActive={() => setActiveCategory('wants')}
          />
        )}

        {/* SAVINGS COLUMN */}
        <BudgetColumn 
          title="Savings" 
          percent={savingsPct} 
          limit={savingsLimit} 
          spent={spentSavings} 
          color="purple"
          items={items.filter(i => i.category === 'savings')}
          accounts={accounts}
          newItem={newItem}
          setNewItem={setNewItem}
          onAdd={() => handleAddItem('savings')}
          onDelete={handleDelete}
          isActive={activeCategory === 'savings'}
          setActive={() => setActiveCategory('savings')}
        />

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: BUDGET COLUMN ---
function BudgetColumn({ title, percent, limit, spent, color, items, accounts, newItem, setNewItem, onAdd, onDelete, isActive, setActive }) {
  const left = limit - spent;
  const isOver = left < 0;
  
  // Color Maps
  const colors = {
    green: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/10' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', light: 'bg-blue-50 dark:bg-blue-900/10' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', light: 'bg-purple-50 dark:bg-purple-900/10' },
  };
  const theme = colors[color];

  return (
    <div 
      onClick={setActive}
      className={`glass-card flex flex-col h-full transition-all duration-300 ${isActive ? `ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 ${theme.border}` : 'opacity-90 hover:opacity-100'}`}
    >
      {/* Header */}
      <div className={`p-5 ${theme.bg} text-white rounded-t-2xl`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">{title} ({percent}%)</h3>
            <p className="text-3xl font-bold mt-1">${spent.toFixed(2)}</p>
          </div>
          <div className="text-right text-white/80 text-xs">
            <p className="font-medium">Limit: ${limit.toFixed(0)}</p>
            <p className={`mt-1 font-bold ${isOver ? 'text-red-200' : 'text-emerald-100'}`}>
              {isOver ? 'Over by' : 'Left'}: ${Math.abs(left).toFixed(0)}
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-1.5 mt-4 rounded-full overflow-hidden">
          <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((spent/limit)*100, 100)}%` }}></div>
        </div>
      </div>

      {/* Input Area (Only visible if active) */}
      {isActive && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder={`e.g., ${title === 'Savings' ? 'Emergency Fund' : 'Groceries'}`}
              className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            <div className="flex gap-2">
               <div className="relative w-1/2">
                  <span className="absolute left-2 top-2 text-gray-500">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full pl-6 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
                    value={newItem.amount}
                    onChange={e => setNewItem({...newItem, amount: e.target.value})}
                  />
               </div>
               <input 
                  type="date" 
                  className="w-1/2 p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
                  value={newItem.date}
                  onChange={e => setNewItem({...newItem, date: e.target.value})}
               />
            </div>
            <select 
               className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
               value={newItem.accountId}
               onChange={e => setNewItem({...newItem, accountId: e.target.value})}
            >
              <option value="">Pay from...</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname} (${acc.balance})</option>)}
            </select>
            <button 
              onClick={onAdd}
              className={`w-full py-2 rounded text-sm font-bold text-white ${theme.bg} hover:opacity-90 flex justify-center items-center gap-2`}
            >
              <Plus size={16} /> Add {title}
            </button>
          </div>
        </div>
      )}

      {/* List Items */}
      <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No items yet</div>
        ) : (
          items.map(item => (
            <div key={item.id} className="group flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.name}</p>
                <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                   <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                   {item.isRecurring && <span className="text-blue-500 font-semibold flex items-center gap-1">⚡ Auto</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 dark:text-white">${item.amount}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}