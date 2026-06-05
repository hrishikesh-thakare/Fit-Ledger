import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { theme } from '../../theme'

export default function SignUp() {
  const navigation = useNavigation<any>()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!name.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      // Create account via Payload CMS users collection
      const signUpResponse = await fetch('http://192.168.0.108:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: name.trim(),
        }),
      })

      const signUpData = await signUpResponse.json()

      if (!signUpResponse.ok) {
        const errMsg = signUpData.message || signUpData.errors?.[0]?.message || 'Registration failed'
        throw new Error(errMsg)
      }

      // Auto-login after successful signup
      const loginResponse = await fetch('http://192.168.0.108:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(loginData.message || 'Auto-login failed')
      }

      if (loginData.token) {
        await login(loginData.token)
      } else {
        throw new Error('No token received from server')
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <Text style={styles.title}>FitLedger</Text>
        <Text style={styles.hint}>Create your account</Text>
      </View>

      <Text style={styles.inputLabel}>Name</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textDisabled}
          style={styles.input}
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <Text style={styles.inputLabel}>Email</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={theme.colors.textDisabled}
          keyboardType="email-address"
          style={styles.input}
          autoCapitalize="none"
          editable={!loading}
        />
      </View>

      <Text style={styles.inputLabel}>Password</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={theme.colors.textDisabled}
          secureTextEntry={!showPassword}
          style={styles.input}
          autoCapitalize="none"
          editable={!loading}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
          <MaterialCommunityIcons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>

      <Text style={styles.inputLabel}>Confirm Password</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          placeholderTextColor={theme.colors.textDisabled}
          secureTextEntry={!showConfirmPassword}
          style={styles.input}
          autoCapitalize="none"
          editable={!loading}
        />
        <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={12}>
          <MaterialCommunityIcons
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </Pressable>

      <Pressable style={styles.linkButton} onPress={() => navigation.navigate('Login')} disabled={loading}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background },
  headerContainer: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: 8, letterSpacing: 0.5 },
  hint: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '400' },
  inputLabel: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, marginBottom: 20, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: theme.colors.text, fontSize: 16, height: '100%' },
  button: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: 12, marginTop: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: theme.colors.background, fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: theme.colors.textMuted, fontSize: 14 },
  linkTextBold: { color: theme.colors.primary, fontWeight: '700' },
})
