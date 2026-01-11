import React from 'react';
import { CalendarClock, CheckCircle } from 'lucide-react';
import { useRecurring } from '../../hooks/useRecurring';

export function UpcomingBillsWidget() {
  const { recurringItems } = useRecurring();
  const today = new Date();
  const currentDay = today.getDate();

  // Filter: Find bills due in the next 7 days OR bills that are overdue/today
  const upcoming = recurringItems.filter(item => {
    // If day is 5 and today is 2, diff is 3 (Upcoming)
    // If day is 5 and today is 5, diff is 0 (Due Today)
    const diff = item.dayOfMonth - currentDay;
    return diff >= 0 && diff <= 7;
  });

  if (upcoming.length === 0) return null; // Hide if nothing is upcoming

  return (
    <div className="glass-card p-5 col-span-1 md:col-span-2 border-l-4 border-l-pink-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <CalendarClock size={14} /> Upcoming Bills (Next 7 Days)
        </h3>
      </div>
      
      <div className="space-y-3">
        {upcoming.map(item => {
            const diff = item.dayOfMonth - currentDay;
            let dueText = diff === 0 ? "Due Today" : diff === 1 ? "Tomorrow" : `In ${diff} Days`;
            let color = diff === 0 ? "text-red-500 font-bold" : "text-gray-500";

            return (
                <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full text-pink-600 dark:text-pink-400">
                           <CalendarClock size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className={`text-xs ${color}`}>{dueText}</p>
                        </div>
                    </div>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">${item.amount}</span>
                </div>
            );
        })}
      </div>
    </div>
  );
}