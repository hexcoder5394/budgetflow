import React from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import Navbar from './components/Layout/Navbar'; // We built this earlier

function App() {
  const { currentUser } = useAuth();

  // 1. Show nothing (or a spinner) while checking login status
  // (Optional: You can add the loading spinner styles here)
  
  // 2. If not logged in, show Auth Page
  if (!currentUser) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <AuthPage />
      </div>
    );
  }

  // 3. If logged in, show the Main App
  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <Dashboard />
    </div>
  );
}

export default App;
