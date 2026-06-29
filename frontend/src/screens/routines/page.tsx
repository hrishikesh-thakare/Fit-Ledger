import React, { useEffect, useState, useRef } from 'react'
import { ScrollView, Text, View, StyleSheet, Pressable, ActivityIndicator, Modal, TextInput, Animated } from 'react-native'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { Toast } from '../../components/CustomToast'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useFocusEffect } from '@react-navigation/core'
import { Feather } from '@expo/vector-icons'
import api from '../../api'
import { theme } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'

export default function Routines() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const [routines, setRoutines] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [optionsRoutine, setOptionsRoutine] = useState<any>(null)
  const sheetAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (optionsRoutine) {
      sheetAnim.setValue(300)
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10
      }).start()
    }
  }, [optionsRoutine])

  const handleEditPress = () => {
    if (!optionsRoutine) return
    const id = optionsRoutine.id
    setOptionsRoutine(null)
    navigation.navigate('EditRoutine', { id })
  }

  const handleDeletePress = () => {
    if (!optionsRoutine) return
    const id = optionsRoutine.id
    setOptionsRoutine(null)
    handleDelete(id)
  }

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

  const fetchRoutines = (silent = false) => {
    if (!user?.id) return
    if (!silent) setLoading(true)
    api
      .fetchRoutines(user.id)
      .then((data: any) => setRoutines(data || []))
      .catch((err: any) => setError(err.message))
      .finally(() => { if (!silent) setLoading(false) })
  }

  const hasFetchedRef = useRef(false)

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutines(hasFetchedRef.current)
      hasFetchedRef.current = true
    }, [user?.id])
  )

  const handleAdd = () => {
    navigation.navigate('CreateRoutine')
  }

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete Routine', 'Are you sure you want to delete this routine?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteRoutine(id)
          Toast.show('Routine deleted', 'info')
          fetchRoutines()
        } catch (err) {
          Toast.show('Failed to delete routine.', 'error')
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
          const numExercises = r.exerciseCount || 0
          // Mock preview text if not available
          const previewText = (r.previewExercises && r.previewExercises.length > 0) ? r.previewExercises.join(' · ') : 'No exercises added'
          
          return (
            <View key={r.id || r._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{r.name || r.title}</Text>
                <Pressable hitSlop={15} onPress={() => setOptionsRoutine(r)} style={styles.menuButton}>
                  <Feather name="more-vertical" size={20} color={theme.colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.chipRow}>
                {mg.slice(0, 4).map((m: string) => (
                  <View key={m} style={styles.chip}>
                    <Text style={styles.chipText}>{m}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={styles.previewText} numberOfLines={2}>
                {previewText}
              </Text>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  {numExercises} {numExercises === 1 ? 'Exercise' : 'Exercises'}
                  {r.duration ? (
                    <Text style={styles.estDurationText}>
                      {' • Est. '}{r.duration.replace('~', '')}
                    </Text>
                  ) : null}
                </Text>
                <Pressable style={styles.startButton} onPress={() => navigation.navigate('RoutineDetails', { id: r.id || r._id })}>
                  <Text style={styles.startButtonText}>View</Text>
                  <Feather name="arrow-right" size={18} color={theme.colors.background} />
                </Pressable>
              </View>
            </View>
          )
        })}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fabContainer, { opacity: fabAnim }]} pointerEvents={fabVisible ? 'auto' : 'none'}>
        <Pressable style={styles.fab} onPress={handleAdd}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Animated.View>

      {/* Options Bottom Sheet */}
      <Modal visible={!!optionsRoutine} transparent animationType="fade" onRequestClose={() => setOptionsRoutine(null)}>
        <Pressable style={styles.modalBgTransparent} onPress={() => setOptionsRoutine(null)}>
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]} onStartShouldSetResponder={() => true}>
            <View style={styles.bottomSheetDragHandle} />
            
            {optionsRoutine && (
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetVal}>{optionsRoutine.name || optionsRoutine.title}</Text>
              </View>
            )}

            <View style={styles.optionsCard}>
              <Pressable style={styles.optionRow} onPress={handleEditPress}>
                <Feather name="edit-2" size={20} color={theme.colors.text} />
                <Text style={styles.optionText}>Edit</Text>
              </Pressable>
              <View style={styles.optionsDivider} />
              <Pressable style={styles.optionRow} onPress={handleDeletePress}>
                <Feather name="trash-2" size={20} color={theme.colors.error} />
                <Text style={[styles.optionText, { color: theme.colors.error }]}>Delete Routine</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.background },
  headerTitle: { ...theme.typography.headerTitle },
  container: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  card: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.background, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 22, fontWeight: '400', lineHeight: 28, color: theme.colors.text, textTransform: 'capitalize' },
  menuButton: { padding: 4, marginRight: -4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { backgroundColor: theme.colors.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: theme.colors.primary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginTop: 4, marginBottom: 12 },
  previewText: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24, fontWeight: '400', marginBottom: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  estDurationText: { color: theme.colors.textMuted, fontStyle: 'italic', fontWeight: '400' },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  startButtonText: { color: theme.colors.background, fontWeight: '700', fontSize: 14, lineHeight: 20, marginRight: 6 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  hint: { color: theme.colors.text, fontSize: 18, fontWeight: '500', marginBottom: 8 },
  subHint: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' },
  
  error: { color: theme.colors.error, marginBottom: 16 },
  fabContainer: { position: 'absolute', bottom: 24, right: 24 },
  fab: { backgroundColor: theme.colors.primary, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  fabText: { color: theme.colors.background, fontSize: 32, fontWeight: '400', marginTop: -2 },
  modalBgTransparent: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.border, borderBottomWidth: 0 },
  bottomSheetDragHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  bottomSheetHeader: { alignItems: 'center', marginBottom: 16 },
  bottomSheetSub: { fontSize: 16, color: theme.colors.textMuted, fontWeight: '500' },
  bottomSheetVal: { fontSize: 22, color: theme.colors.text, fontWeight: '700' },
  optionsCard: { backgroundColor: theme.colors.surfaceVariant, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  optionText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  optionsDivider: { height: 1, backgroundColor: theme.colors.border },
})
