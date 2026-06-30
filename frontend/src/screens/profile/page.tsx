import React, { useState, useEffect, useRef } from 'react'
import { ScrollView, Text, View, StyleSheet, Pressable, Modal, TextInput, ActivityIndicator, Animated } from 'react-native'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { Toast } from '../../components/CustomToast'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../api'
import { toKg, fromKg } from '../../utils/unit'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const { theme, mode, setMode } = useTheme()
  const styles = getStyles(theme)
  
  const [aboutOpen, setAboutOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [targetWeightOpen, setTargetWeightOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  
  const [displayName, setDisplayName] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [localUnit, setLocalUnit] = useState<'kg' | 'lb'>(user?.preferredUnit || 'kg')
  
  // Animation state for weight unit segmented control slider
  const slideAnim = useRef(new Animated.Value(localUnit === 'lb' ? 1 : 0)).current

  // Animation state for theme mode segmented control slider
  const themeAnim = useRef(new Animated.Value(mode === 'system' ? 2 : mode === 'dark' ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: mode === 'system' ? 2 : mode === 'dark' ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start()
  }, [mode])

  const themeTranslateX = themeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 50, 100]
  })

  useEffect(() => {
    if (user?.preferredUnit) {
      setLocalUnit(user.preferredUnit as 'kg' | 'lb')
    }
  }, [user?.preferredUnit])

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: localUnit === 'lb' ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start()
  }, [localUnit])

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50]
  })

  // Sync state when user context changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      if (user.targetWeight) {
        const displayWeight = Math.round(fromKg(user.targetWeight, user.preferredUnit || 'kg') * 10) / 10
        setTargetWeight(displayWeight.toString())
      } else {
        setTargetWeight('')
      }
    }
  }, [user])

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    )
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Toast.show('Please enter a display name.', 'error')
      return
    }

    setSaving(true)
    try {
      await api.updateUser(user.id, { displayName: displayName.trim() })

      Toast.show('Profile updated', 'info')
      await refreshUser()
      setEditOpen(false)
    } catch (err: any) {
      Toast.show(err.message || 'Could not update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTargetWeight = async () => {
    const weightNum = parseFloat(targetWeight)
    if (isNaN(weightNum) || weightNum <= 0) {
      Toast.show('Please enter a valid weight.', 'error')
      return
    }

    setSaving(true)
    try {
      const weightInKg = toKg(weightNum, user.preferredUnit || 'kg')
      
      await api.updateUser(user.id, { targetWeight: weightInKg })

      Toast.show('Target weight updated', 'info')
      await refreshUser()
      setTargetWeightOpen(false)
    } catch (err: any) {
      Toast.show(err.message || 'Could not update target weight', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectUnit = async (newUnit: 'kg' | 'lb') => {
    if (localUnit === newUnit) return

    const previousUnit = localUnit
    setLocalUnit(newUnit) // Optimistic update

    try {
      await api.updateUser(user.id, { preferredUnit: newUnit })

      Toast.show('Unit updated', 'info')
      await refreshUser()
    } catch (err: any) {
      setLocalUnit(previousUnit) // Revert on failure
      Toast.show(err.message || 'Could not update preferred unit', 'error')
    }
  }

  const handleExportData = () => {
    setExportOpen(true)
  }

  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    }
    return user.email[0].toUpperCase()
  }

  const getMemberDate = () => {
    const rawDate = user.createdAt || user.updatedAt
    if (rawDate) {
      const date = new Date(rawDate)
      return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }
    return null
  }

  const displayTargetWeight = user.targetWeight 
    ? `${Math.round(fromKg(user.targetWeight, localUnit) * 10) / 10} ${localUnit}`
    : 'Not set'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>{user.displayName || 'FitLedger Athlete'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {getMemberDate() && <Text style={styles.memberSince}>{getMemberDate()}</Text>}

          <Pressable style={styles.editBtn} onPress={() => setEditOpen(true)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.sectionCard}>
          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <MaterialCommunityIcons name="theme-light-dark" size={20} color={theme.colors.textMuted} style={styles.listIcon} />
              <Text style={styles.listItemText}>Appearance</Text>
            </View>
            <View style={[styles.segmentedControl, { width: 156 }]}>
              <Animated.View 
                style={[
                  styles.segmentBackground, 
                  {
                    transform: [{ translateX: themeTranslateX }]
                  }
                ]} 
              />
              <Pressable style={styles.segmentButton} onPress={() => setMode('light')}>
                <Text style={[styles.segmentText, mode === 'light' && styles.segmentTextActive]}>Light</Text>
              </Pressable>
              <Pressable style={styles.segmentButton} onPress={() => setMode('dark')}>
                <Text style={[styles.segmentText, mode === 'dark' && styles.segmentTextActive]}>Dark</Text>
              </Pressable>
              <Pressable style={styles.segmentButton} onPress={() => setMode('system')}>
                <Text style={[styles.segmentText, mode === 'system' && styles.segmentTextActive]}>Auto</Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <MaterialCommunityIcons name="dumbbell" size={20} color={theme.colors.textMuted} style={styles.listIcon} />
              <Text style={styles.listItemText}>Weight Units</Text>
            </View>
            <View style={styles.segmentedControl}>
              <Animated.View 
                style={[
                  styles.segmentBackground, 
                  {
                    transform: [{ translateX }]
                  }
                ]} 
              />
              <Pressable 
                style={styles.segmentButton}
                onPress={() => handleSelectUnit('kg')}
              >
                <Text style={[styles.segmentText, localUnit === 'kg' && styles.segmentTextActive]}>kg</Text>
              </Pressable>
              <Pressable 
                style={styles.segmentButton}
                onPress={() => handleSelectUnit('lb')}
              >
                <Text style={[styles.segmentText, localUnit === 'lb' && styles.segmentTextActive]}>lb</Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.listItem} onPress={() => setTargetWeightOpen(true)}>
            <View style={styles.listItemLeft}>
              <MaterialCommunityIcons name="flag-outline" size={20} color={theme.colors.textMuted} style={styles.listIcon} />
              <View>
                <Text style={styles.listItemText}>Target Weight</Text>
                <Text style={styles.listItemSubText}>{displayTargetWeight}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
          </Pressable>
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Data</Text>
        <View style={styles.sectionCard}>
          <Pressable style={styles.listItem} onPress={handleExportData}>
            <View style={styles.listItemLeft}>
              <MaterialCommunityIcons name="cloud-download-outline" size={20} color={theme.colors.textMuted} style={styles.listIcon} />
              <Text style={styles.listItemText}>Export Data</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
          </Pressable>
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.sectionCard}>
          <Pressable style={styles.listItem} onPress={() => setAboutOpen(true)}>
            <View style={styles.listItemLeft}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.textMuted} style={styles.listIcon} />
              <Text style={styles.listItemText}>About FitLedger</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textDisabled} />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editOpen} animationType="fade" transparent onRequestClose={() => !saving && setEditOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalLabel}>Display Name</Text>
            <TextInput 
              style={styles.modalInput} 
              value={displayName} 
              onChangeText={setDisplayName} 
              placeholder="Enter your name" 
              placeholderTextColor={theme.colors.textDisabled}
              editable={!saving}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setEditOpen(false)} disabled={saving}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={theme.colors.background} size="small" />
                ) : (
                  <Text style={styles.modalBtnTextSave}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Target Weight Modal */}
      <Modal visible={targetWeightOpen} animationType="fade" transparent onRequestClose={() => !saving && setTargetWeightOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Target Weight</Text>
            <Text style={styles.modalLabel}>Target Weight ({localUnit})</Text>
            <TextInput 
              style={styles.modalInput} 
              value={targetWeight} 
              onChangeText={setTargetWeight} 
              placeholder="e.g. 75.0" 
              placeholderTextColor={theme.colors.textDisabled}
              keyboardType="numeric"
              editable={!saving}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setTargetWeightOpen(false)} disabled={saving}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveTargetWeight} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={theme.colors.background} size="small" />
                ) : (
                  <Text style={styles.modalBtnTextSave}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutOpen} animationType="fade" transparent onRequestClose={() => setAboutOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.aboutLogoContainer}>
              <View style={styles.aboutLogo}>
                <MaterialCommunityIcons name="dumbbell" size={32} color={theme.colors.background} />
              </View>
            </View>
            <Text style={styles.aboutTitle}>FitLedger</Text>
            <Text style={styles.aboutSubtitle}>Version 1.0.0</Text>
            <Text style={styles.aboutText}>A premium fitness tracking experience designed for progress.</Text>
            <Text style={styles.aboutSubText}>Built with modern technologies to help you reach your peak performance.</Text>
            
            <View style={styles.aboutDivider} />
            <Text style={styles.copyright}>Made with ❤️ by Hrishikesh Thakare</Text>

            <Pressable style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setAboutOpen(false)}>
              <Text style={styles.modalBtnTextClose}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Export Data Modal */}
      <Modal visible={exportOpen} animationType="fade" transparent onRequestClose={() => setExportOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.aboutLogoContainer}>
              <View style={styles.aboutLogo}>
                <MaterialCommunityIcons name="cloud-download-outline" size={32} color={theme.colors.background} />
              </View>
            </View>
            <Text style={styles.aboutTitle}>Export Data</Text>
            <Text style={styles.aboutText}>The data export feature is coming in a future update.</Text>
            <Text style={styles.aboutSubText}>You will be able to download your entire workout history as a CSV file.</Text>
            
            <View style={styles.aboutDivider} />

            <Pressable style={[styles.modalBtn, styles.modalBtnClose]} onPress={() => setExportOpen(false)}>
              <Text style={styles.modalBtnTextClose}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.background },
  headerTitle: { ...theme.typography.headerTitle },
  
  scrollArea: { paddingHorizontal: 16, paddingBottom: 0 },

  userCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: theme.colors.primary },
  avatarText: { fontSize: 28, fontWeight: '700', color: theme.colors.textMuted },
  userName: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  userEmail: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  memberSince: { fontSize: 12, color: theme.colors.textDisabled, marginTop: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.borderInput, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, width: '100%', justifyContent: 'center', marginTop: 20 },
  editBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginLeft: 8 },

  sectionHeader: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, marginTop: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  sectionCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 16, overflow: 'hidden' },
  
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listIcon: { marginRight: 12 },
  listItemText: { fontSize: 16, fontWeight: '500', color: theme.colors.text },
  listItemSubText: { fontSize: 14, color: theme.colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.borderLight, marginLeft: 48 },

  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.borderInput, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  dropdownText: { color: theme.colors.text, fontSize: 14, marginRight: 4, fontWeight: '600' },

  logoutButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.error, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32, marginBottom: 24 },
  logoutButtonText: { color: theme.colors.error, fontSize: 16, fontWeight: '700' },

  // Modals
  modalBg: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 20 },
  modalLabel: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.borderInput, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginLeft: 12, justifyContent: 'center', alignItems: 'center', minWidth: 90 },
  modalBtnCancel: { backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.borderInput },
  modalBtnSave: { backgroundColor: theme.colors.primary },
  modalBtnTextCancel: { color: theme.colors.textMuted, fontWeight: '600', fontSize: 15 },
  modalBtnTextSave: { color: theme.colors.background, fontWeight: '700', fontSize: 15 },

  // About Modal custom styling
  aboutLogoContainer: { alignItems: 'center', marginBottom: 16 },
  aboutLogo: { width: 60, height: 60, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  aboutTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  aboutSubtitle: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 4 },
  aboutText: { fontSize: 16, color: theme.colors.text, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  aboutSubText: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  aboutDivider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: 20 },
  copyright: { fontSize: 12, color: theme.colors.textDisabled, textAlign: 'center', marginBottom: 20 },
  modalBtnClose: { backgroundColor: theme.colors.primary, marginLeft: 0, marginTop: 10, width: '100%', paddingVertical: 14 },
  modalBtnTextClose: { color: theme.colors.background, fontWeight: '700', fontSize: 16 },

  // Segmented control specific styles
  segmentedControl: { flexDirection: 'row', backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: theme.colors.borderInput, width: 106, height: 34, position: 'relative' },
  segmentBackground: { position: 'absolute', top: 2, left: 2, width: 50, height: 28, borderRadius: 6, backgroundColor: theme.colors.primary },
  segmentButton: { width: 50, height: 28, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  segmentText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: theme.colors.background, fontWeight: '700' }
})
