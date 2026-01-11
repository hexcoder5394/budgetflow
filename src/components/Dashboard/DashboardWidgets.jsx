import React from 'react';
import { TrendingUp, Activity, Plus, ArrowRightLeft, DollarSign, Clock } from 'lucide-react';

export function QuickStats({ items, income, setActiveTab }) {
  const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);
  const saved = Math.max(0, income - totalSpent);
  const savingsRate = income > 0 ? ((saved / income) * 100).toFixed(1) : 0;

  // Clean navigation helper
  const handleNavigation = (tab) => {
    setActiveTab(tab);
    // Scroll past the widgets so the user sees the forms immediately
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Widget 1: Savings Rate */}
      <div className="glass-card p-5 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp size={60} />
        </div>
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Savings Rate</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{savingsRate}%</span>
          <span className="text-sm text-green-500 font-medium">of income</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-4 rounded-full overflow-hidden">
          <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(savingsRate, 100)}%` }}></div>
        </div>
      </div>

      {/* Widget 2: Recent Activity */}
      <div className="glass-card p-5 col-span-1 md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} /> Recent Activity
          </h3>
        </div>
        <div className="space-y-3">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
              <span className="text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">${item.amount}</span>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-400 text-sm italic">No recent transactions</p>}
        </div>
      </div>

      {/* Widget 3: Quick Actions */}
      <div className="glass-card p-5 flex flex-col justify-center space-y-3">
         <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Quick Actions</h3>
         
         <button 
            onClick={() => handleNavigation('planner')} 
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-200"
         >
            <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded text-blue-600 dark:text-blue-400">
                <Plus size={16} />
            </div>
            Add Expense
         </button>

         <button 
            onClick={() => handleNavigation('planner')} 
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-200"
         >
            <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 rounded text-purple-600 dark:text-purple-400">
                <ArrowRightLeft size={16} />
            </div>
            Transfer
         </button>
      </div>
    </div>
  );
}