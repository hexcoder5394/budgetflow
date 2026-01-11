import React from 'react';
import { Calendar } from 'lucide-react';

export function FinancialCalendar({ items, month, year }) {
  // 1. Setup Calendar Grid Logic
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  
  // 2. Process Spending Data
  const dailySpend = {};
  let totalSpend = 0;
  let spendDaysCount = 0;

  items.forEach(item => {
    // Only count expenses/spending, not income or transfers
    if (item.category === 'income' || item.category === 'savings') return;
    
    // Parse date (YYYY-MM-DD) safely
    if (!item.date) return;
    const day = parseInt(item.date.split('-')[2]); // Extract day part
    
    if (!dailySpend[day]) dailySpend[day] = 0;
    dailySpend[day] += item.amount;
  });

  // Calculate Thresholds for "High Spend"
  // We calculate average spend ONLY for days where money was actually spent
  Object.values(dailySpend).forEach(amount => {
    totalSpend += amount;
    spendDaysCount++;
  });
  
  const averageDaily = spendDaysCount > 0 ? totalSpend / spendDaysCount : 0;
  const highSpendThreshold = averageDaily * 1.5; // "High" is 50% more than average

  // 3. Generate Calendar Cells
  const calendarCells = [];
  
  // Add empty placeholders for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-10"></div>);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const spent = dailySpend[day] || 0;
    const isToday = new Date().getDate() === day && 
                    new Date().getMonth() + 1 === parseInt(month) && 
                    new Date().getFullYear() === parseInt(year);

    let dotColor = '';
    
    if (spent === 0) {
        // No Spend Day (Green) - Only show if day has passed or is today
        if (day <= new Date().getDate() || parseInt(month) < new Date().getMonth() + 1) {
            dotColor = 'bg-green-500'; 
        }
    } else if (spent > highSpendThreshold) {
        // High Spend Day (Red)
        dotColor = 'bg-red-500';
    } else {
        // Normal Spend (Gray/Blue)
        dotColor = 'bg-blue-300 dark:bg-blue-700';
    }

    calendarCells.push(
      <div key={day} className={`h-10 flex flex-col items-center justify-center rounded-lg relative ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}`}>
        <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>{day}</span>
        {/* The Dot Indicator */}
        {dotColor && (
            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`} title={`Spent: $${spent.toFixed(2)}`}></div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} /> Spending Habits
        </h3>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
         <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-gray-500 uppercase font-medium">No Spend</span>
         </div>
         <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[10px] text-gray-500 uppercase font-medium">High Spend</span>
         </div>
      </div>
    </div>
  );
}