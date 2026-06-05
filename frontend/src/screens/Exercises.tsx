import React, { useEffect, useState, useRef } from 'react'
import { ScrollView, Text, View, StyleSheet, ActivityIndicator, Pressable, TextInput, Modal, Animated } from 'react-native'
import { CustomAlert as Alert } from '../components/CustomAlert'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../api'
import { theme } from '../theme'

export default function Exercises() {
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState('')
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

  const fetchExercises = () => {
    api
      .fetchExercises()
      .then((data) => setItems(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  const handleAdd = async () => {
    if (!newName.trim() || !newMuscle.trim()) {
      return Alert.alert('Error', 'Please provide a name and muscle group.')
    }
    setSaving(true)
    try {
      await api.createExercise({ name: newName.trim(), muscleGroup: newMuscle.trim() })
      setIsModalOpen(false)
      setNewName('')
      setNewMuscle('')
      fetchExercises()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create exercise.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to delete this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteExercise(id)
          fetchExercises()
        } catch (err: any) {
          Alert.alert('Error', 'Failed to delete exercise.')
        }
      }}
    ])
  }

  const filteredItems = items.filter((e) => 
    (e.name || e.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Exercises</Text>
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💪</Text>
            <Text style={styles.hint}>No exercises found</Text>
            <Text style={styles.subHint}>Add your first exercise to the database</Text>
          </View>
        )}
        
        {filteredItems.map((e) => (
          <Pressable key={e.id || e._id} style={styles.card} onLongPress={() => handleDelete(e.id)} onPress={() => {}}>
            <View>
              <Text style={styles.cardTitle}>{e.name || e.title}</Text>
              {e.muscles && e.muscles.length > 0 && (
                <Text style={styles.cardMeta}>{e.muscles.join(', ')}</Text>
              )}
              {e.muscleGroup && (
                <Text style={styles.cardMeta}>{e.muscleGroup}</Text>
              )}
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </Animated.ScrollView>

      <Animated.View style={[styles.fabContainer, { opacity: fabAnim }]} pointerEvents={fabVisible ? 'auto' : 'none'}>
        <Pressable style={styles.fab} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Animated.View>

      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Exercise</Text>
            <TextInput
              style={styles.input}
              placeholder="Exercise Name"
              placeholderTextColor={theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Primary Muscle (e.g. Chest)"
              placeholderTextColor={theme.colors.textMuted}
              value={newMuscle}
              onChangeText={setNewMuscle}
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
  container: { padding: 16, flexGrow: 1, backgroundColor: theme.colors.background },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text },
  searchInput: { backgroundColor: theme.colors.background, color: theme.colors.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: theme.colors.background, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 22, fontWeight: '400', lineHeight: 28, color: theme.colors.text },
  cardMeta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12, lineHeight: 16, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  arrow: { fontSize: 24, color: theme.colors.primary, fontWeight: '300' },
  
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
  input: { backgroundColor: theme.colors.surfaceElevated, color: theme.colors.text, fontSize: 16, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  modalButtons: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, padding: 16, backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, alignItems: 'center' },
  btnCancelText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  btnConfirm: { flex: 1, padding: 16, backgroundColor: theme.colors.primary, borderRadius: 12, alignItems: 'center' },
  btnConfirmText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },
})
