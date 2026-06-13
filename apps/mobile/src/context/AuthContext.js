import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { API_CONFIG } from '../config/api';

WebBrowser.maybeCompleteAuthSession();

const AUTH_KEY = '@emart_user';
const AuthContext = createContext();

const fetchWithTimeout = (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '677229186181-jq1rl5jh26ifmkfu3eo6ggu50s9g29lg.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      fetchGoogleUser(response.authentication.accessToken);
    }
  }, [response]);

  const fetchGoogleUser = async (token) => {
    try {
      const res = await fetchWithTimeout('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const googleUser = await res.json().catch(() => null);
      if (!res.ok || !googleUser) throw new Error('Failed to fetch Google profile');

      const userData = {
        name: googleUser.name,
        email: googleUser.email,
        emailOrPhone: googleUser.email,
        avatar: googleUser.picture,
        provider: 'google',
      };
      setUser(userData);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    } catch (e) {
      if (__DEV__) console.log('Google fetch error:', e);
    }
  };

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') setUser(parsed);
        }
      } catch (e) {
        if (__DEV__) console.log('Auth restore error:', e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // Real API login — calls BFF → WordPress JWT auth
  const apiSignIn = async (emailOrPhone, password) => {
    const res = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/mobile/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: emailOrPhone, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');

    const userData = {
      id: data.user?.id,
      name: [data.user?.first_name, data.user?.last_name].filter(Boolean).join(' ') || data.user?.username || emailOrPhone,
      email: data.user?.email,
      emailOrPhone,
      token: data.token,
      expires_at: data.expires_at,
      provider: 'email',
    };
    setUser(userData);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    return userData;
  };

  // Real API register — calls BFF → WordPress register
  const apiRegister = async ({ name, email, phone, password }) => {
    const res = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/mobile/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data; // { success, pending_verification, message }
  };

  const signIn = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    } catch (e) {
      console.log('Auth save error:', e);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (e) {
      console.log('Google sign-in error:', e);
    }
  };

  const register = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    } catch (e) {
      console.log('Auth save error:', e);
    }
  };

  const signOut = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (e) {
      console.log('Auth remove error:', e);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      loading,
      signIn,
      apiSignIn,
      signInWithGoogle,
      googleReady: !!request,
      register,
      apiRegister,
      signOut,
    }),
    [user, loading, request]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
