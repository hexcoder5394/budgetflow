import React from 'react';
import { Gauge } from 'lucide-react';

export function CategorySpeedometer({ items, totalIncome }) {
  // 1. Group items by name/type (simplified to categories for now)
  const categoryMap = {};
  let totalSpent = 0;

  items.forEach(item => {
    // Skip savings/income
    if(item.category === 'savings' || item.category === 'income') return;
    
    // Group by item name (e.g. "Groceries") or category if name is generic
    // We normalize names to avoid duplicates like "Uber" vs "uber"
    const key = item.name.toLowerCase(); 
    if(!categoryMap[key]) categoryMap[key] = { name: item.name, amount: 0, category: item.category };
    
    categoryMap[key].amount += item.amount;
    totalSpent += item.amount;
  });

  // 2. Get Top 3 Highest Spenders
  const topCategories = Object.values(categoryMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Helper for color logic
  const getProgressColor = (percent) => {
    if (percent > 40) return 'bg-red-500';
    if (percent > 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Gauge size={14} /> Top Spenders
        </h3>
      </div>

      <div className="space-y-4 flex-1">
        {topCategories.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">No spending data yet.</p>
        )}
        
        {topCategories.map((cat, idx) => {
            // Calculate percentage relative to Income (Impact on Wallet)
            const percentOfIncome = totalIncome > 0 ? (cat.amount / totalIncome) * 100 : 0;
            const barColor = getProgressColor(percentOfIncome);
            
            return (
                <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-200 capitalize truncate w-24">{cat.name}</span>
                        <div className="text-right">
                           <span className="font-bold text-gray-900 dark:text-white">${cat.amount}</span>
                           <span className="text-xs text-gray-400 ml-1">({percentOfIncome.toFixed(1)}%)</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${barColor} transition-all duration-500`} 
                            style={{ width: `${Math.min(percentOfIncome * 2, 100)}%` }} // Scaling x2 for visual effect so 50% fills bar
                        ></div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}