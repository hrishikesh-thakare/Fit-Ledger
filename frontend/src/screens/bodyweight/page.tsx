import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, Animated, Dimensions, FlatList, PanResponder } from 'react-native'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../api'
import { theme } from '../../theme'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import DateTimePicker from '@react-native-community/datetimepicker'

const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_HEIGHT = 60
const CAROUSEL_HEIGHT = 180
const VERTICAL_PADDING = (CAROUSEL_HEIGHT - ITEM_HEIGHT) / 2

export default function Weight() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [editLogId, setEditLogId] = useState<string | number | null>(null)
  const [saving, setSaving] = useState(false)

  const [optionsLog, setOptionsLog] = useState<any>(null)

  // Carousel States
  const [selectedInt, setSelectedInt] = useState(70)
  const [selectedDec, setSelectedDec] = useState(0)

  // Scroll logic for FAB
  const [fabVisible, setFabVisible] = useState(true)
  const lastOffsetY = useRef(0)
  const fabAnim = useRef(new Animated.Value(1)).current
  const sheetAnim = useRef(new Animated.Value(300)).current
  const intScrollY = useRef(new Animated.Value(0)).current
  const decScrollY = useRef(new Animated.Value(0)).current

  // Date selection for modal
  const [loggedAt, setLoggedAt] = useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)



  useEffect(() => {
    Animated.timing(fabAnim, { toValue: fabVisible ? 1 : 0, duration: 250, useNativeDriver: true }).start()
  }, [fabVisible])

  useEffect(() => {
    if (optionsLog) {
      sheetAnim.setValue(300)
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10
      }).start()
    }
  }, [optionsLog])

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    if (offsetY > lastOffsetY.current + 10 && fabVisible) setFabVisible(false)
    else if (offsetY < lastOffsetY.current - 10 && !fabVisible) setFabVisible(true)
    lastOffsetY.current = offsetY
  }

  const fetchLogs = () => {
    api
      .fetchWeightLogs()
      .then((data) => {
        const processed = data.map((log: any, index: number) => {
          const nextLog = data[index + 1]
          let change = 0
          if (nextLog) change = log.weight - nextLog.weight
          return { ...log, change }
        })
        setLogs(processed || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const openNewPicker = () => {
    const w = logs.length > 0 ? logs[0].weight : 70.0
    setSelectedInt(Math.floor(w))
    setSelectedDec(Math.round((w - Math.floor(w)) * 10))
    setEditLogId(null)
    setLoggedAt(new Date())
    setIsPickerOpen(true)
  }

  const openEditPicker = () => {
    if (!optionsLog) return
    const w = optionsLog.weight
    setSelectedInt(Math.floor(w))
    setSelectedDec(Math.round((w - Math.floor(w)) * 10))
    setEditLogId(optionsLog.id)
    setLoggedAt(new Date(optionsLog.loggedAt))
    setOptionsLog(null)
    setIsPickerOpen(true)
  }

  const handleSaveWeight = async () => {
    const weightVal = selectedInt + (selectedDec / 10)
    if (weightVal <= 0) return Alert.alert('Error', 'Please select a valid weight.')
    
    setSaving(true)
    try {
      if (editLogId) {
        await api.updateWeightLog(editLogId, { weight: weightVal, loggedAt: loggedAt.toISOString() })
      } else {
        await api.createWeightLog({ weight: weightVal, loggedAt: loggedAt.toISOString() })
      }
      setIsPickerOpen(false)
      fetchLogs()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save weight.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!optionsLog) return
    const id = optionsLog.id
    setOptionsLog(null)

    Alert.alert('Delete Entry', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteWeightLog(id)
          fetchLogs()
        } catch (err: any) {
          Alert.alert('Error', 'Failed to delete entry.')
        }
      }}
    ])
  }

  const currentWeight = logs.length > 0 ? logs[0].weight : 0
  
  const { user } = useAuth()
  const targetWeight = user?.targetWeight || 0
  const diff = targetWeight > 0 ? Math.abs(targetWeight - currentWeight) : 0

  const integers = Array.from({length: 101}, (_, i) => i + 20) // 20 to 120
  const decimals = Array.from({length: 10}, (_, i) => i) // 0 to 9

  // Helper for initial scroll
  const intScrollRef = useRef<any>(null)
  const decScrollRef = useRef<any>(null)

  useEffect(() => {
    if (isPickerOpen) {
      setTimeout(() => {
        const intIdx = integers.indexOf(selectedInt)
        if (intIdx >= 0) {
          intScrollY.setValue(intIdx * ITEM_HEIGHT)
          intScrollRef.current?.scrollToOffset({ offset: intIdx * ITEM_HEIGHT, animated: false })
        }
        
        const decIdx = decimals.indexOf(selectedDec)
        if (decIdx >= 0) {
          decScrollY.setValue(decIdx * ITEM_HEIGHT)
          decScrollRef.current?.scrollToOffset({ offset: decIdx * ITEM_HEIGHT, animated: false })
        }
      }, 50)
    }
  }, [isPickerOpen])

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>Body Weight</Text>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>Current Weight</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 }}>
            <Text style={styles.currentWeightText}>{currentWeight > 0 ? currentWeight.toFixed(1) : '--'}</Text>
            <Text style={styles.unitText}> kg</Text>
          </View>
          {targetWeight > 0 ? (
            <Text style={styles.hint}>
              Target: {targetWeight}kg   •   {diff.toFixed(1)}kg to go
            </Text>
          ) : (
            <Text style={styles.hint}>Set your target weight in settings</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>History</Text>

        {error && <Text style={styles.error}>{error}</Text>}
        {logs.length === 0 && !error && <Text style={styles.hint}>No weight logs yet. Tap + to add your first entry!</Text>}

        <View style={[styles.card, { padding: 0 }]}>
          {logs.map((log, index) => {
            const dateStr = new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            return (
              <React.Fragment key={log.id || index}>
                <View style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                      <Feather name="calendar" size={14} color={theme.colors.textMuted} />
                      <Text style={styles.dateText}>{dateStr}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={styles.listItemWeight}>{log.weight.toFixed(1)}</Text>
                      <Text style={styles.unitText}> kg</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {log.change !== 0 ? (
                      <View style={styles.chip}>
                        <Text style={[styles.chipText, { color: log.change > 0 ? theme.colors.success : theme.colors.error }]}>
                          {log.change > 0 ? '+' : ''}{log.change.toFixed(1)}kg
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>No change</Text>
                      </View>
                    )}
                    <Pressable hitSlop={10} onPress={() => setOptionsLog(log)}>
                      <Feather name="more-vertical" size={20} color={theme.colors.textMuted} style={{ paddingHorizontal: 4 }} />
                    </Pressable>
                  </View>
                </View>
                {index < logs.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            )
          })}
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.fabContainer, { opacity: fabAnim }]} pointerEvents={fabVisible ? 'auto' : 'none'}>
        <Pressable style={styles.fab} onPress={openNewPicker}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Animated.View>

      {/* Options Bottom Sheet */}
      <Modal visible={!!optionsLog} transparent animationType="fade" onRequestClose={() => setOptionsLog(null)}>
        <Pressable style={styles.modalBgTransparent} onPress={() => setOptionsLog(null)}>
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]} onStartShouldSetResponder={() => true}>
            <View style={styles.bottomSheetDragHandle} />
            
            {optionsLog && (
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetSub}>{new Date(optionsLog.loggedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                <Text style={styles.bottomSheetVal}>{optionsLog.weight.toFixed(1)} kg</Text>
              </View>
            )}

            <View style={styles.optionsCard}>
              <Pressable style={styles.optionRow} onPress={openEditPicker}>
                <Feather name="edit-2" size={20} color={theme.colors.text} />
                <Text style={styles.optionText}>Edit</Text>
              </Pressable>
              <View style={styles.optionsDivider} />
              <Pressable style={styles.optionRow} onPress={handleDelete}>
                <Feather name="trash-2" size={20} color={theme.colors.error} />
                <Text style={[styles.optionText, { color: theme.colors.error }]}>Delete Entry</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Weight Carousel Modal */}
      <Modal visible={isPickerOpen} transparent animationType="fade" onRequestClose={() => !saving && setIsPickerOpen(false)}>
        <View style={styles.modalBgCenter}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !saving && setIsPickerOpen(false)} />
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>{editLogId ? 'Edit Weight' : 'Log Weight'}</Text>
            </View>
            
            {/* Outlined Date Picker Field */}
            <Pressable style={styles.dateInputContainer} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateInputLabel}>Date</Text>
              <Text style={styles.dateInputText}>
                {String(loggedAt.getDate()).padStart(2, '0')}/{String(loggedAt.getMonth() + 1).padStart(2, '0')}/{loggedAt.getFullYear()}
              </Text>
              <Feather name="calendar" size={20} color={theme.colors.textMuted} />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={loggedAt}
                mode="date"
                display="default"
                themeVariant="dark"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false)
                  if (selectedDate) {
                    setLoggedAt(selectedDate)
                  }
                }}
              />
            )}

            <View style={styles.verticalCarouselsWrapper}>
              <View style={[styles.verticalCarouselContainer, { width: 60 }]}>
                <Animated.FlatList 
                  ref={intScrollRef}
                  data={integers}
                  keyExtractor={(item: number) => item.toString()}
                  showsVerticalScrollIndicator={false}
                  snapToOffsets={integers.map((_, i) => i * ITEM_HEIGHT)}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: VERTICAL_PADDING }}
                  getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: intScrollY } } }],
                    { useNativeDriver: true }
                  )}
                  onMomentumScrollEnd={(e: any) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
                    if(integers[idx] !== undefined) setSelectedInt(integers[idx])
                  }}
                  renderItem={({ item: num, index: idx }: { item: number, index: number }) => {
                    const inputRange = [
                      (idx - 1) * ITEM_HEIGHT,
                      idx * ITEM_HEIGHT,
                      (idx + 1) * ITEM_HEIGHT
                    ]
                    const scale = intScrollY.interpolate({
                      inputRange,
                      outputRange: [0.75, 1.1, 0.75],
                      extrapolate: 'clamp'
                    })
                    const activeOpacity = intScrollY.interpolate({
                      inputRange,
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp'
                    })
                    const inactiveOpacity = intScrollY.interpolate({
                      inputRange,
                      outputRange: [1, 0, 1],
                      extrapolate: 'clamp'
                    })
                    return (
                      <View style={styles.verticalCarouselItem}>
                        <Animated.View style={{ opacity: inactiveOpacity, transform: [{ scale }] }}>
                          <Text style={[styles.carouselTextAnimated, { color: '#3A3A3C' }]}>{num}</Text>
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', opacity: activeOpacity, transform: [{ scale }] }]}>
                          <Text style={[styles.carouselTextAnimated, { color: theme.colors.primary }]}>{num}</Text>
                        </Animated.View>
                      </View>
                    )
                  }}
                />
              </View>

              <Text style={styles.decimalDot}>.</Text>

              <View style={[styles.verticalCarouselContainer, { width: 60 }]}>
                <Animated.FlatList 
                  ref={decScrollRef}
                  data={decimals}
                  keyExtractor={(item: number) => item.toString()}
                  showsVerticalScrollIndicator={false}
                  snapToOffsets={decimals.map((_, i) => i * ITEM_HEIGHT)}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: VERTICAL_PADDING }}
                  getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: decScrollY } } }],
                    { useNativeDriver: true }
                  )}
                  onMomentumScrollEnd={(e: any) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
                    if(decimals[idx] !== undefined) setSelectedDec(decimals[idx])
                  }}
                  renderItem={({ item: num, index: idx }: { item: number, index: number }) => {
                    const inputRange = [
                      (idx - 1) * ITEM_HEIGHT,
                      idx * ITEM_HEIGHT,
                      (idx + 1) * ITEM_HEIGHT
                    ]
                    const scale = decScrollY.interpolate({
                      inputRange,
                      outputRange: [0.75, 1.1, 0.75],
                      extrapolate: 'clamp'
                    })
                    const activeOpacity = decScrollY.interpolate({
                      inputRange,
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp'
                    })
                    const inactiveOpacity = decScrollY.interpolate({
                      inputRange,
                      outputRange: [1, 0, 1],
                      extrapolate: 'clamp'
                    })
                    return (
                      <View style={styles.verticalCarouselItem}>
                        <Animated.View style={{ opacity: inactiveOpacity, transform: [{ scale }] }}>
                          <Text style={[styles.carouselTextAnimated, { color: '#3A3A3C' }]}>{num}</Text>
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', opacity: activeOpacity, transform: [{ scale }] }]}>
                          <Text style={[styles.carouselTextAnimated, { color: theme.colors.primary }]}>{num}</Text>
                        </Animated.View>
                      </View>
                    )
                  }}
                />
              </View>

              <Text style={styles.carouselUnit}>kg</Text>
              
              <View style={[styles.verticalCarouselSelector, { top: VERTICAL_PADDING }]} pointerEvents="none" />
            </View>

            <View style={styles.modalButtons}>
              <Pressable style={styles.btnCancel} onPress={() => setIsPickerOpen(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.btnConfirm} onPress={handleSaveWeight} disabled={saving}>
                <Text style={styles.btnConfirmText}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 0, flex: 1, backgroundColor: theme.colors.background },
  headerBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.background },
  title: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text },
  scrollContent: { padding: 16, paddingBottom: 0, flexGrow: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 12, marginTop: 8 },
  card: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.borderLight },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  currentWeightText: { fontSize: 48, fontWeight: '800', color: theme.colors.text, marginRight: 2 },
  unitText: { fontSize: 16, fontWeight: '500', color: theme.colors.textMuted },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  listItemWeight: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  dateText: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '500' },
  chip: { backgroundColor: '#202023', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  chipText: { fontSize: 14, fontWeight: '700', color: theme.colors.textMuted },
  divider: { height: 1, backgroundColor: theme.colors.border, marginHorizontal: 16 },
  hint: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  error: { color: theme.colors.error, marginBottom: 16 },
  
  fabContainer: { position: 'absolute', bottom: 24, right: 24 },
  fab: { backgroundColor: theme.colors.primary, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  fabText: { color: theme.colors.background, fontSize: 32, fontWeight: '400', marginTop: -2 },
  
  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1A1A1A', borderRadius: 28, padding: 24, width: '100%', borderWidth: 1, borderColor: theme.colors.borderLight },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 24, textAlign: 'center' },
  
  dateInputContainer: { borderWidth: 1, borderColor: theme.colors.borderInput, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginTop: 8, marginBottom: 24 },
  dateInputLabel: { position: 'absolute', top: -10, left: 12, backgroundColor: '#1A1A1A', paddingHorizontal: 6, fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
  dateInputText: { fontSize: 16, color: theme.colors.text, fontWeight: '500' },

  verticalCarouselsWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: CAROUSEL_HEIGHT, backgroundColor: 'transparent', marginBottom: 24, position: 'relative' },
  verticalCarouselContainer: { height: CAROUSEL_HEIGHT, position: 'relative', overflow: 'hidden' },
  verticalCarouselItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  decimalDot: { fontSize: 28, fontWeight: '700', color: theme.colors.primary, marginHorizontal: 2 },
  carouselTextAnimated: { fontWeight: '700', fontSize: 28 },
  carouselText: { fontSize: 22, fontWeight: '700', color: '#3A3A3C' },
  carouselTextActive: { fontSize: 32, fontWeight: '700', color: theme.colors.primary },
  verticalCarouselSelector: { position: 'absolute', left: 16, right: 16, height: ITEM_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.borderInput },
  carouselUnit: { position: 'absolute', right: 32, fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  btnCancel: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  btnCancelText: { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '600' },
  btnConfirm: { paddingVertical: 16, paddingHorizontal: 36, backgroundColor: theme.colors.primary, borderRadius: 24, alignItems: 'center' },
  btnConfirmText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },

  modalBgTransparent: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.borderLight, borderBottomWidth: 0 },
  bottomSheetDragHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderInput, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  bottomSheetHeader: { alignItems: 'center', marginBottom: 20 },
  bottomSheetSub: { fontSize: 16, color: theme.colors.textMuted, fontWeight: '500' },
  bottomSheetVal: { fontSize: 22, color: theme.colors.text, fontWeight: '700', marginTop: 4 },
  optionsCard: { backgroundColor: '#2C2C2E', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.borderLight },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  optionText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  optionsDivider: { height: 1, backgroundColor: theme.colors.border },
})
