import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const AUTH_PROFILE_KEY = '@emart_user';
const AUTH_TOKEN_KEY = '@emart_auth_token';

const stripToken = (userData = {}) => {
  const { token, ...profile } = userData;
  return profile;
};

export const saveAuthUser = async (userData = {}) => {
  const profile = stripToken(userData);

  await AsyncStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));

  if (userData.token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, userData.token);
  } else {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }

  return profile;
};

export const restoreAuthUser = async () => {
  const saved = await AsyncStorage.getItem(AUTH_PROFILE_KEY);
  if (!saved) return null;

  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== 'object') return null;

  if (parsed.token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, parsed.token);
    const profile = stripToken(parsed);
    await AsyncStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  return parsed;
};

export const getAuthToken = async () => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (token) return token;

  const saved = await AsyncStorage.getItem(AUTH_PROFILE_KEY);
  if (!saved) return null;

  const parsed = JSON.parse(saved);
  if (!parsed?.token) return null;

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, parsed.token);
  const profile = stripToken(parsed);
  await AsyncStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
  return parsed.token;
};

export const clearAuthUser = async () => {
  await AsyncStorage.removeItem(AUTH_PROFILE_KEY);
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};
