import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { Toast } from '../../components/CustomToast'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/ThemeContext'
import { API_URL } from '../../api'

export default function Login() {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show('Please enter both email and password.', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      if (data.token) {
        await login(data.token)
      } else {
        throw new Error('No token received from server')
      }
    } catch (err: any) {
      Toast.show(err.message || 'Check your credentials and try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      keyboardShouldPersistTaps="handled" 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>FitLedger</Text>
        <Text style={styles.hint}>Track your fitness journey</Text>
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

      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <Pressable style={styles.linkButton} onPress={() => navigation.navigate('SignUp')} disabled={loading}>
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { padding: 24, flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background },
  headerContainer: { marginBottom: 40, alignItems: 'center' },
  title: { ...theme.typography.display, marginBottom: 8, letterSpacing: 0.5 },
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
