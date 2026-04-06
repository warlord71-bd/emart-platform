import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AUTH_KEY = '@emart_user';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '677229186181-jq1rl5jh26ifmkfu3eo6ggu50s9g29lg.apps.googleusercontent.com',
  });

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      fetchGoogleUser(response.authentication.accessToken);
    }
  }, [response]);

  const fetchGoogleUser = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const googleUser = await res.json();

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
      console.log('Google fetch error:', e);
    }
  };

  // Restore session on app launch
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch (e) {
        console.log('Auth restore error:', e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

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
      signInWithGoogle,
      googleReady: !!request,
      register,
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
