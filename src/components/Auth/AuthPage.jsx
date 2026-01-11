import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wallet } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError('Failed to ' + (isLogin ? 'log in' : 'create account'));
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full glass-card p-8 transition-all">
      <div className="text-center mb-8">
        <Wallet className="w-12 h-12 text-blue-500 mx-auto mb-2" />
        <h2 className="text-3xl font-bold dark:text-white">Welcome</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your money with clarity</p>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            !isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-100 text-red-600 p-3 rounded text-sm text-center">{error}</div>}
        
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
        </button>
      </form>
    </div>
  );
}