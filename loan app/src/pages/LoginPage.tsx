// pages/LoginPage.tsx (Lengkap & Sudah Diperbaiki)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppRoutes } from '../constants';
import Input from '../components/Input';
import Button from '../components/Button';
import PageTitle from '../components/PageTitle';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    
    // Kirim username dalam format UPPERCASE agar konsisten dengan pencarian di service
    const success = await login(username.toUpperCase(), password);
    
    if (success) {
      navigate(AppRoutes.DASHBOARD);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl">
        <div>
          <PageTitle title="Inventory System Login" />
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Input
                id="username"
                label="Username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                Icon={UserIcon}
              />
            </div>
            <div>
              <Input
                id="password"
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                Icon={LockClosedIcon}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading} variant="primary">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
