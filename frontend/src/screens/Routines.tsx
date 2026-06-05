import React, { useEffect, useState, useRef } from 'react'
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator, Modal, TextInput, Animated } from 'react-native'
import { CustomAlert as Alert } from '../components/CustomAlert'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../api'
import { theme } from '../theme'

export default function Routines() {
  const [routines, setRoutines] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  // Scroll logic for FAB
  const [fabVisible, setFabVisible] = useState(true)
  const lastOffsetY = useRef(0)
  const fabAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(fabAnim, { toValue: fabVisible ? 1 : 0, duration: 250, useNativeDriver: true }).start()
  }, [fabVisible])

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    if (offsetY > lastOffsetY.current + 10 && fabVisible) setFabVisible(false)
    else if (offsetY < lastOffsetY.current - 10 && !fabVisible) setFabVisible(true)
    lastOffsetY.current = offsetY
  }

  const fetchRoutines = () => {
    api
      .fetchRoutines()
      .then((data) => setRoutines(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRoutines()
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) {
      return Alert.alert('Error', 'Please provide a routine name.')
    }
    setSaving(true)
    try {
      await api.createRoutine({ name: newName.trim() })
      setIsModalOpen(false)
      setNewName('')
      fetchRoutines()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create routine.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete Routine', 'Are you sure you want to delete this routine?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteRoutine(id)
          fetchRoutines()
        } catch (err: any) {
          Alert.alert('Error', 'Failed to delete routine.')
        }
      }}
    ])
  }

  if (loading) {
    return (
      <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Routines</Text>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {error && <Text style={styles.error}>{error}</Text>}
        {routines.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.hint}>No routines yet</Text>
            <Text style={styles.subHint}>Create your first workout routine to get started</Text>
          </View>
        )}
        
        {routines.map((r) => {
          const mg = r.muscleGroups || []
          const numExercises = r.exercises?.length || 0
          // Mock preview text if not available
          const previewText = r.previewExercises?.join(' · ') || 'Decline Chest Press · Incline Chest Press · Bench Press · ...'
          
          return (
            <View key={r.id || r._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{r.name || r.title}</Text>
                <Pressable hitSlop={10} onPress={() => handleDelete(r.id || r._id)}>
                  <Text style={styles.menuIcon}>⋮</Text>
                </Pressable>
              </View>

              <View style={styles.chipRow}>
                {mg.slice(0, 4).map((m: string) => (
                  <View key={m} style={styles.chip}>
                    <Text style={styles.chipText}>{m}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.previewText} numberOfLines={2}>
                {previewText}
              </Text>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  {numExercises} Exercises • ~{r.duration || '1h 39m'}
                </Text>
                <Pressable style={styles.startButton} onPress={() => {}}>
                  <Text style={styles.startButtonText}>Start</Text>
                  <Text style={styles.startArrow}>→</Text>
                </Pressable>
              </View>
            </View>
          )
        })}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fabContainer, { opacity: fabAnim }]} pointerEvents={fabVisible ? 'auto' : 'none'}>
        <Pressable style={styles.fab} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Animated.View>

      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Routine</Text>
            <TextInput
              style={styles.input}
              placeholder="Routine Name"
              placeholderTextColor={theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.btnCancel} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnConfirm} onPress={handleAdd} disabled={saving}>
                <Text style={styles.btnConfirmText}>{saving ? 'Saving...' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.background },
  headerTitle: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text },
  container: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  card: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.background, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 22, fontWeight: '400', lineHeight: 28, color: theme.colors.text, textTransform: 'capitalize' },
  menuIcon: { color: theme.colors.textMuted, fontSize: 20, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: theme.colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: theme.colors.textSecondary },
  previewText: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24, fontWeight: '400', marginBottom: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  startButtonText: { color: theme.colors.background, fontWeight: '500', fontSize: 14, lineHeight: 20, marginRight: 6 },
  startArrow: { color: theme.colors.background, fontWeight: '800', fontSize: 16 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  hint: { color: theme.colors.text, fontSize: 18, fontWeight: '500', marginBottom: 8 },
  subHint: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' },
  
  error: { color: theme.colors.error, marginBottom: 16 },
  fabContainer: { position: 'absolute', bottom: 24, right: 24 },
  fab: { backgroundColor: theme.colors.primary, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  fabText: { color: theme.colors.background, fontSize: 32, fontWeight: '400', marginTop: -2 },
  modalBg: { flex: 1, backgroundColor: theme.colors.overlayLight, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.colors.background, borderRadius: 16, padding: 24, width: '100%', borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text, marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: theme.colors.surfaceElevated, color: theme.colors.text, fontSize: 16, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border },
  modalButtons: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, padding: 16, backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, alignItems: 'center' },
  btnCancelText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  btnConfirm: { flex: 1, padding: 16, backgroundColor: theme.colors.primary, borderRadius: 12, alignItems: 'center' },
  btnConfirmText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },
})
