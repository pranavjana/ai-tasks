import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Button from './Button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        // Show email verification message for sign up
        setError({
          type: 'success',
          message: 'Check your email for the verification link!'
        });
      }
    } catch (error) {
      setError({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            {mode === 'login' 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-white hover:underline focus:outline-none"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.type === 'error' 
                ? 'bg-red-500/10 text-red-500' 
                : 'bg-green-500/10 text-green-500'
            }`}>
              {error.message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-700 text-white placeholder-neutral-400"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-700 text-white placeholder-neutral-400"
                placeholder="Password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 