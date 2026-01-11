import React, { useState, useEffect } from 'react';
import { List, Flag, BarChart2, Wallet, Calendar, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useBudget } from '../../hooks/useBudget';
import { useAccounts } from '../../hooks/useAccounts';
import { useAuth } from '../../context/AuthContext';

// Logic
import { processRecurringBills } from '../../utils/recurringHelper';

// Main Views
import BudgetPlanner from '../Planner/BudgetPlanner';
import BanksView from '../Accounts/BanksView';
import GoalsView from '../Goals/GoalsView';
import TrackerView from '../Tracker/TrackerView';
import RecurringView from '../Recurring/RecurringView';

// Widgets
import { QuickStats } from './DashboardWidgets';
import { UpcomingBillsWidget } from './UpcomingBillsWidget';
import { FinancialCalendar } from './FinancialCalendar';
import { CurrencyConverter } from './CurrencyConverter';
import { CategorySpeedometer } from './CategorySpeedometer';

export default function Dashboard() {
  // --- STATE ---
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(today.getFullYear());
  const [activeTab, setActiveTab] = useState('planner');
  
  // --- GREETING LOGIC ---
  const { currentUser } = useAuth();
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // --- AUTOMATION ---
  useEffect(() => {
     if (currentUser) {
         processRecurringBills(currentUser.uid, `${year}-${month}`);
     }
  }, [currentUser, month, year]);

  const getUserName = () => {
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'There';
  };

  // --- DATA FETCHING ---
  const { budgetData, items, loading: budgetLoading } = useBudget(month, year);
  const { accounts, loading: accountsLoading } = useAccounts();

  const isLoading = budgetLoading || accountsLoading;

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="relative min-h-screen">
      
      {/* --- NEW: ANIMATED BACKGROUND GLOWS --- */}
      {/* These drift behind your glass cards */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Blue Orb (Top Left) */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          
          {/* Purple Orb (Top Right) */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          
          {/* Pink Orb (Bottom Center) */}
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-500/20 dark:bg-pink-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        
        {/* 1. HEADER & DATE SELECTION */}
        <motion.div variants={itemVariants} className="glass-card p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {greeting}, <span className="text-blue-600 dark:text-blue-400 capitalize">{getUserName()}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                 <Calendar size={12} /> {year}-{month}
              </span>
              <span>Ready to manage your finances?</span>
            </p>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg shadow-inner">
             <select 
               value={month} 
               onChange={(e) => setMonth(e.target.value)}
               className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-2 pl-3 pr-8"
             >
               {Array.from({length: 12}, (_, i) => (
                 <option key={i+1} value={String(i+1).padStart(2, '0')}>
                   {new Date(0, i).toLocaleString('default', { month: 'long' })}
                 </option>
               ))}
             </select>
             
             <div className="w-px bg-gray-300 dark:bg-gray-600 my-2"></div>

             <select
               value={year}
               onChange={(e) => setYear(Number(e.target.value))}
               className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-2 pl-3 pr-8"
             >
               {[year-1, year, year+1].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>
        </motion.div>

        {/* 2. DASHBOARD WIDGETS AREA */}
        <AnimatePresence mode="wait">
          {!isLoading && (
            <motion.div 
              key="widgets-area"
              variants={itemVariants} 
              initial="hidden"
              animate="visible" 
              exit="hidden"
              className="mb-8 space-y-6"
              layout
            >
                <QuickStats items={items} income={budgetData?.income || 0} setActiveTab={setActiveTab} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 h-full">
                        <FinancialCalendar items={items} month={month} year={year} />
                    </div>
                    
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <UpcomingBillsWidget /> 
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <CategorySpeedometer items={items} totalIncome={budgetData?.income || 0} />
                            <CurrencyConverter />
                        </div>
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. TAB NAVIGATION */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-xl shadow-inner overflow-x-auto">
              <TabButton id="planner" label="Planner" icon={<List size={18} />} active={activeTab} set={setActiveTab} />
              <TabButton id="goals" label="Goals" icon={<Flag size={18} />} active={activeTab} set={setActiveTab} />
              <TabButton id="recurring" label="Subs" icon={<RefreshCw size={18} />} active={activeTab} set={setActiveTab} />
              <TabButton id="tracker" label="Tracker" icon={<BarChart2 size={18} />} active={activeTab} set={setActiveTab} />
              <TabButton id="banks" label="Banks" icon={<Wallet size={18} />} active={activeTab} set={setActiveTab} />
          </div>
        </motion.div>

        {/* 4. MAIN CONTENT AREA */}
        <div className="min-h-[400px] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 h-full">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 font-medium">Syncing with cloud...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'planner' && <BudgetPlanner monthData={budgetData} items={items} accounts={accounts} monthYear={`${year}-${month}`} />}
                {activeTab === 'goals' && <GoalsView />}
                {activeTab === 'recurring' && <RecurringView accounts={accounts} />}
                {activeTab === 'tracker' && <TrackerView items={items} />}
                {activeTab === 'banks' && <BanksView accounts={accounts} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function TabButton({ id, label, icon, active, set }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => set(id)}
      className={`
        flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap relative
        ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
      `}
    >
      {isActive && (
        <motion.div 
          layoutId="activeTab"
          className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center">
        <span className={`mr-2 ${isActive ? 'text-blue-500' : 'opacity-70'}`}>{icon}</span>
        {label}
      </span>
    </button>
  );
}