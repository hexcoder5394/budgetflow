import React, { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // We'll create this later

export default function Navbar() {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <nav className="glass-card mb-6 p-4 flex justify-between items-center sticky top-4 z-50 mx-4 md:mx-8">
      <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
        <Wallet className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight">BudgetFlow</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button 
          onClick={logout}
          className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}