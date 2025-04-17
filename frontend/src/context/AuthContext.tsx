'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface DecodedToken {
  user: {
    id: number;
    role: 'admin' | 'user';
  };
  exp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Kiểm tra token trong localStorage khi component được mount
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(storedToken);

          // Kiểm tra xem token đã hết hạn chưa
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }

          setToken(storedToken);
          loadUser(storedToken);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } else {
      // Server-side rendering - set loading to false
      setLoading(false);
    }
  }, []);

  const loadUser = async (authToken: string) => {
    try {
      console.log('AuthContext: Loading user with token:', authToken ? 'Token exists' : 'No token');
      const apiUrl = 'http://localhost:5000/api';
      console.log('API URL:', `${apiUrl}/auth/me`);

      const res = await axios.get(`${apiUrl}/auth/me`, {
        headers: {
          'x-auth-token': authToken
        }
      });

      console.log('AuthContext: User data received:', res.data ? 'Yes' : 'No');
      setUser(res.data);
      setLoading(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error('AuthContext: Load user error:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with:', email);
      const apiUrl = 'http://localhost:5000/api';
      console.log('API URL:', `${apiUrl}/auth/login`);

      const res = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password
      });

      console.log('AuthContext: Login response:', res.status);
      const { token } = res.data;
      console.log('AuthContext: Token received:', token ? 'Yes' : 'No');

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setToken(token);
      await loadUser(token);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('AuthContext: Login error:', error);
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        throw new Error(error.response.data.message as string);
      }
      throw new Error('Đăng nhập thất bại');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const apiUrl = 'http://localhost:5000/api';
      const res = await axios.post(`${apiUrl}/auth/register`, {
        username,
        email,
        password
      });

      const { token } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setToken(token);
      await loadUser(token);
      router.push('/dashboard');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        throw new Error(error.response.data.message as string);
      }
      throw new Error('Đăng ký thất bại');
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
