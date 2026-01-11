import React from 'react';

export default function SummaryCard({ label, total, spent, color }) {
  const remaining = total - spent;
  const progress = total > 0 ? (spent / total) * 100 : 0;
  
  // Dynamic styling maps
  const colorStyles = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      border: 'border-green-500',
      text: 'text-green-700 dark:text-green-300',
      bar: 'bg-green-500',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      border: 'border-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      bar: 'bg-blue-500',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/40',
      border: 'border-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
      bar: 'bg-purple-500',
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-700/50',
      border: 'border-gray-500',
      text: 'text-gray-700 dark:text-gray-300',
      bar: 'bg-gray-500',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/40',
      border: 'border-orange-500',
      text: 'text-orange-700 dark:text-orange-300',
      bar: 'bg-orange-500',
    },
  };

  const style = colorStyles[color] || colorStyles.gray;

  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-5 rounded-lg shadow-sm transition-all`}>
      <h2 className={`text-sm font-bold uppercase ${style.text} mb-1`}>{label}</h2>
      
      <div className="flex justify-between items-end mb-2">
         <p className={`text-3xl font-bold ${style.text}`}>${remaining.toFixed(2)}</p>
         <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Left of ${total.toFixed(0)}</span>
      </div>

      <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-2">
        <div 
            className={`${style.bar} h-2 rounded-full transition-all duration-500`} 
            style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}