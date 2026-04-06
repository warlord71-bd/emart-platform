import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    register({
      name: fullName,
      phone,
      email,
    });

    navigation.navigate('AccountMain');
  };

  const fields = [
    { key: 'name', icon: 'person-outline', placeholder: 'Full Name *', value: fullName, setter: setFullName },
    { key: 'phone', icon: 'call-outline', placeholder: 'Phone Number *', value: phone, setter: setPhone, keyboard: 'phone-pad' },
    { key: 'email', icon: 'mail-outline', placeholder: 'Email Address', value: email, setter: setEmail, keyboard: 'email-address' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          </View>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={COLORS.gradientAccent}
            style={styles.iconCircle}
          >
            <Ionicons name="person-add-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join eMart BD for the best beauty deals</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.key} style={styles.inputWrap}>
              <Ionicons name={field.icon} size={18} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textLight}
                style={styles.input}
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.keyboard || 'default'}
                autoCapitalize={field.key === 'email' ? 'none' : 'words'}
              />
            </View>
          ))}

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              placeholder="Password *"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm Password *"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showPassword}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleRegister}>
            <LinearGradient
              colors={COLORS.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerBtn}
            >
              <Text style={styles.registerText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.bottomLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 0,
    zIndex: 10,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...COLORS.shadow,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    ...COLORS.shadow,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: 4,
  },
  registerBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  registerText: {
    color: '#fff',
    fontSize: 15,
    ...FONTS.bold,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  bottomText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomLink: {
    fontSize: 13,
    color: COLORS.accent,
    ...FONTS.bold,
  },
});
