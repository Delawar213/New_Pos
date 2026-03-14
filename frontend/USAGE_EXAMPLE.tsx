// Example of how to use the Auth API in your login component

'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/slices/auth/auth.slice';

export default function LoginExample() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error, isLoggedIn, message } = useAppSelector((state) => state.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dispatch the login action
    const result = await dispatch(loginUser({ username, password }));
    
    if (loginUser.fulfilled.match(result)) {
      console.log('Login successful!');
      // Redirect or do something after successful login
    } else {
      console.log('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="error">{message}</p>}
      {isLoggedIn && <p className="success">Logged in successfully!</p>}
    </form>
  );
}
