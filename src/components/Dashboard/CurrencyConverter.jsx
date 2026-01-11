import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, DollarSign, RefreshCw } from 'lucide-react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState(1);
  const [isUsdToLkr, setIsUsdToLkr] = useState(true);
  const [rate, setRate] = useState(295); // Default fallback
  const [loading, setLoading] = useState(true);

  // Fetch Live Rate on Load
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if(data.rates.LKR) {
          setRate(data.rates.LKR);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Rate fetch error:", err);
        setLoading(false);
      });
  }, []);

  const converted = isUsdToLkr ? (amount * rate) : (amount / rate);
  
  return (
    <div className="glass-card p-5 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -right-4 -top-4 text-blue-50 dark:text-blue-900/20 opacity-50 rotate-12 pointer-events-none">
         <DollarSign size={100} />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <RefreshCw size={14} /> FX Converter
        </h3>
        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-mono">
           1 USD ≈ {rate.toFixed(0)} LKR
        </span>
      </div>

      <div className="space-y-4 relative z-10">
         {/* Input Area */}
         <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500 w-8">
                {isUsdToLkr ? 'USD' : 'LKR'}
            </span>
            <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
               className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono font-bold"
            />
         </div>

         {/* Swap Button */}
         <div className="flex justify-center">
             <button 
                onClick={() => setIsUsdToLkr(!isUsdToLkr)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
             >
                <ArrowRightLeft size={16} />
             </button>
         </div>

         {/* Result Area */}
         <div className="text-right">
             <span className="text-xs text-gray-400 block mb-1">
                {isUsdToLkr ? 'LKR (Approx)' : 'USD (Approx)'}
             </span>
             <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                {isUsdToLkr ? 'Rs ' : '$'}
                {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </p>
         </div>
      </div>
    </div>
  );
}