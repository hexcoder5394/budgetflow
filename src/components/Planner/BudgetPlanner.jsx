import React, { useState, useEffect } from 'react';
import BudgetColumn from './BudgetColumn';
import SummaryCard from './SummaryCard';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

// Define rules
const RULES = {
  '50/30/20': [
    { key: 'needs', label: 'Needs', percent: 0.50, color: 'green' },
    { key: 'wants', label: 'Wants', percent: 0.30, color: 'blue' },
    { key: 'savings', label: 'Savings', percent: 0.20, color: 'purple', isTransfer: true }
  ],
  '80/20': [
    { key: 'spending', label: 'Spending', percent: 0.80, color: 'gray' },
    { key: 'savings', label: 'Savings', percent: 0.20, color: 'purple', isTransfer: true }
  ],
  '70/20/10': [
    { key: 'spending', label: 'Spending', percent: 0.70, color: 'gray' },
    { key: 'debt', label: 'Debt', percent: 0.20, color: 'orange' },
    { key: 'savings', label: 'Savings', percent: 0.10, color: 'purple', isTransfer: true }
  ]
};

const appId = 'default-503020-app';

export default function BudgetPlanner({ monthData, items, accounts, monthYear }) {
  const { currentUser } = useAuth();
  
  const income = monthData?.income || 0;
  const currentRule = monthData?.budgetRule || '50/30/20';
  const [localIncome, setLocalIncome] = useState(income);

  useEffect(() => { setLocalIncome(income); }, [income]);

  const handleIncomeUpdate = async () => {
    if (!currentUser || localIncome === income) return;
    const docPath = `artifacts/${appId}/users/${currentUser.uid}/budget/${monthYear}`;
    await updateDoc(doc(db, docPath), { income: parseFloat(localIncome) || 0 });
  };

  const handleRuleChange = async (e) => {
    const newRule = e.target.value;
    if (!currentUser) return;
    const docPath = `artifacts/${appId}/users/${currentUser.uid}/budget/${monthYear}`;
    await updateDoc(doc(db, docPath), { budgetRule: newRule });
  };

  const activeColumns = RULES[currentRule] || RULES['50/30/20'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Config Bar */}
      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Monthly Income</label>
          <input 
            type="number" 
            className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:text-white font-bold"
            value={localIncome}
            onChange={(e) => setLocalIncome(e.target.value)}
            onBlur={handleIncomeUpdate}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Budget Rule</label>
          <select 
            className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:text-white font-medium"
            value={currentRule}
            onChange={handleRuleChange}
          >
            <option value="50/30/20">50/30/20 Rule</option>
            <option value="80/20">80/20 Rule</option>
            <option value="70/20/10">70/20/10 Rule</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeColumns.map(col => {
          const budgetTarget = income * col.percent;
          const spent = items.filter(i => i.category === col.key).reduce((sum, i) => sum + i.amount, 0); 
          return <SummaryCard key={col.key} label={`${col.label} (${col.percent * 100}%)`} total={budgetTarget} spent={spent} color={col.color} />;
        })}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeColumns.map(col => (
          <BudgetColumn 
            key={col.key} category={col.key} label={col.label} color={col.color} isTransfer={col.isTransfer}
            items={items.filter(i => i.category === col.key)} accounts={accounts} monthYear={monthYear}
          />
        ))}
      </div>
    </div>
  );
}