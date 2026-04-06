import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { signIn, signInWithGoogle, googleReady } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email/phone and password');
      return;
    }
    const fakeName = emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : 'eMart User';
    signIn({ name: fakeName, emailOrPhone });
    navigation.navigate('AccountMain');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          </View>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={COLORS.gradientAccent} style={styles.iconCircle}>
            <Ionicons name="person-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your eMart BD account</Text>
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={signInWithGoogle}
          activeOpacity={0.85}
          disabled={!googleReady}
        >
          <View style={styles.googleIconWrap}>
            <Text style={{ fontSize: 18 }}>G</Text>
          </View>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput placeholder="Email or Phone" placeholderTextColor={COLORS.textLight} style={styles.input} value={emailOrPhone} onChangeText={setEmailOrPhone} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput placeholder="Password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} style={styles.input} value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={handleSignIn}>
            <LinearGradient colors={COLORS.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.signInBtn}>
              <Text style={styles.signInText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Create Account */}
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
          <Text style={styles.createText}>Create New Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 0, zIndex: 10 },
  backCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...COLORS.shadow },
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, ...FONTS.bold, color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, height: 52, marginBottom: 4, ...COLORS.shadow,
  },
  googleIconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
  },
  googleBtnText: { fontSize: 14, ...FONTS.semibold, color: COLORS.text },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textLight },

  form: { gap: 12 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 14, height: 52, ...COLORS.shadow,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: COLORS.text },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12, color: COLORS.accent, ...FONTS.semibold },
  signInBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  signInText: { color: '#fff', fontSize: 15, ...FONTS.bold },
  createBtn: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  createText: { color: COLORS.accent, fontSize: 14, ...FONTS.bold },
});
