import React, { useEffect, useState, useRef, useCallback } from 'react'
import { ScrollView, Text, View, StyleSheet, ActivityIndicator, Pressable, Modal, Animated, FlatList, PanResponder } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../api'
import { theme } from '../../theme'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useFocusEffect } from '@react-navigation/core'

const ITEM_HEIGHT = 60

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)
const PERIODS = ['All', 'This Week', 'This Month', 'Last Month']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const YEARS = Array.from({length: 10}, (_, i) => String(new Date().getFullYear() - i))

export default function History() {
  const navigation = useNavigation()
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('All')
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()])
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [customFilterActive, setCustomFilterActive] = useState(false)

  const lastScrollY = useRef(0)
  const [fabVisible, setFabVisible] = useState(true)
  const fabAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(fabAnim, { toValue: fabVisible ? 1 : 0, duration: 250, useNativeDriver: true }).start()
  }, [fabVisible])

  const monthScrollY = useRef(new Animated.Value(0)).current
  const yearScrollY = useRef(new Animated.Value(0)).current
  const monthScrollRef = useRef<any>(null)
  const yearScrollRef = useRef<any>(null)
  
  const panY = useRef(new Animated.Value(500)).current
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) panY.setValue(gestureState.dy)
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true
          }).start(() => setIsFilterOpen(false))
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start()
        }
      }
    })
  ).current

  useEffect(() => {
    if (isFilterOpen) {
      panY.setValue(500)
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10
      }).start()

      setTimeout(() => {
        const mIdx = MONTHS.indexOf(filterMonth)
        if (mIdx >= 0) {
          monthScrollY.setValue(mIdx * 50)
          monthScrollRef.current?.scrollToOffset({ offset: mIdx * 50, animated: false })
        }
        
        const yIdx = YEARS.indexOf(filterYear)
        if (yIdx >= 0) {
          yearScrollY.setValue(yIdx * 50)
          yearScrollRef.current?.scrollToOffset({ offset: yIdx * 50, animated: false })
        }
      }, 50)
    }
  }, [isFilterOpen])

  const fetchHistoryData = useCallback(() => {
    setIsFetching(true)
    let start: string | undefined
    let end: string | undefined

    const now = new Date()
    
    if (customFilterActive) {
      const monthIdx = MONTHS.indexOf(filterMonth)
      const year = parseInt(filterYear, 10)
      const dStart = new Date(year, monthIdx, 1)
      const dEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999)
      start = dStart.toISOString()
      end = dEnd.toISOString()
    } else if (selectedPeriod === 'This Month') {
      const dStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const dEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      start = dStart.toISOString()
      end = dEnd.toISOString()
    } else if (selectedPeriod === 'Last Month') {
      const dStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const dEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      start = dStart.toISOString()
      end = dEnd.toISOString()
    } else if (selectedPeriod === 'This Week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      start = startOfWeek.toISOString()
      end = now.toISOString()
    }

    api
      .fetchHistory(start, end)
      .then((data: any) => setItems(data || []))
      .catch((err: any) => setError(err?.message || String(err)))
      .finally(() => {
        setIsFetching(false)
        setInitialLoad(false)
      })
  }, [customFilterActive, filterMonth, filterYear, selectedPeriod])

  useFocusEffect(
    useCallback(() => {
      fetchHistoryData()
    }, [fetchHistoryData])
  )

  // Group by month
  const grouped = items.reduce((acc: any, workout) => {
    const d = new Date(workout.date || workout.startedAt || workout.createdAt)
    const month = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(workout)
    return acc
  }, {})

  const applyCustomFilter = () => {
    setCustomFilterActive(true)
    setSelectedPeriod('')
    setIsFilterOpen(false)
  }

  if (initialLoad) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      <Text style={styles.sectionLabel}>TIME PERIOD</Text>
      
      <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PERIODS.map(p => (
            <Pressable 
              key={p} 
              style={[styles.chip, selectedPeriod === p && styles.chipActive]}
              onPress={() => {
                setSelectedPeriod(p)
                setCustomFilterActive(false)
              }}
            >
              <Text style={[styles.chipText, selectedPeriod === p && styles.chipTextActive]}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          const currentOffset = e.nativeEvent.contentOffset.y
          if (currentOffset > lastScrollY.current && currentOffset > 50) {
            if (fabVisible) setFabVisible(false)
          } else if (currentOffset < lastScrollY.current) {
            if (!fabVisible) setFabVisible(true)
          }
          lastScrollY.current = currentOffset
        }}
        scrollEventThrottle={16}
      >
        {error && <Text style={styles.error}>{error}</Text>}
        {!isFetching && items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⏱️</Text>
            <Text style={styles.hint}>No workouts found</Text>
            <Text style={styles.subHint}>Try selecting a different time period</Text>
          </View>
        )}
        
        {Object.keys(grouped).map((month) => (
          <View key={month} style={styles.monthGroup}>
            <View style={styles.monthHeaderRow}>
              <Text style={styles.monthHeader}>{month.toUpperCase()}</Text>
            </View>
            
            {grouped[month].map((h: any) => {
              const dateStr = new Date(h.date || h.startedAt || h.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })
              const durationSeconds = h.durationSeconds || 0
              const hours = Math.floor(durationSeconds / 3600)
              const minutes = Math.floor((durationSeconds % 3600) / 60)
              const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
              const volume = h.volumeKg ? h.volumeKg.toLocaleString('en-US') + ' kg' : '0 kg'

              return (
                <Pressable key={h.id || h._id} style={styles.card} onPress={() => navigation.navigate('WorkoutDetails', { id: h.id || h._id })}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{h.title || h.name || 'Workout'}</Text>
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Feather name="clock" size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.statText}>{durationStr}</Text>
                    <Text style={styles.statDivider}>·</Text>
                    <MaterialCommunityIcons name="dumbbell" size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.statText}>{volume}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, { opacity: fabAnim, transform: [{ scale: fabAnim }], pointerEvents: fabVisible ? 'auto' : 'none' }]}>
        <Pressable style={styles.fabInner} onPress={() => setIsFilterOpen(true)}>
          <Feather name="calendar" size={24} color="#000" />
        </Pressable>
      </Animated.View>

      {/* Filter Modal */}
      <Modal visible={isFilterOpen} transparent animationType="fade">
        <View style={styles.modalBgTransparent}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => {
            Animated.timing(panY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => setIsFilterOpen(false))
          }} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: panY }] }]}>
            <View style={{ paddingBottom: 16, backgroundColor: 'transparent' }}>
              <View style={styles.bottomSheetDragHandle} {...panResponder.panHandlers} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Filter History</Text>
              </View>
            </View>
            
            <View style={styles.filterCarouselsWrapper}>
              {/* Month Picker */}
              <View style={[styles.carouselContainer, { width: 140 }]}>
                <AnimatedFlatList 
                  ref={monthScrollRef}
                  data={MONTHS}
                  keyExtractor={(item: any) => item}
                  showsVerticalScrollIndicator={false}
                  snapToOffsets={MONTHS.map((_, i) => i * 50)}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: 50 }}
                  getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: monthScrollY } } }],
                    { useNativeDriver: true }
                  )}
                  onMomentumScrollEnd={(e: any) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.y / 50)
                    if(MONTHS[idx]) setFilterMonth(MONTHS[idx])
                  }}
                  renderItem={({ item: m, index: idx }: any) => {
                    const inputRange = [
                      (idx - 1) * 50,
                      idx * 50,
                      (idx + 1) * 50
                    ]
                    const scale = monthScrollY.interpolate({
                      inputRange,
                      outputRange: [0.85, 1.1, 0.85],
                      extrapolate: 'clamp'
                    })
                    const activeOpacity = monthScrollY.interpolate({
                      inputRange,
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp'
                    })
                    const inactiveOpacity = monthScrollY.interpolate({
                      inputRange,
                      outputRange: [1, 0, 1],
                      extrapolate: 'clamp'
                    })
                    return (
                      <View style={styles.carouselItem}>
                        <Animated.View style={{ opacity: inactiveOpacity, transform: [{ scale }] }}>
                          <Text style={[styles.carouselTextAnimated, { color: '#555' }]}>{m}</Text>
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', opacity: activeOpacity, transform: [{ scale }] }]}>
                          <Text style={[styles.carouselTextAnimated, { color: theme.colors.primary }]}>{m}</Text>
                        </Animated.View>
                      </View>
                    )
                  }}
                />
              </View>
              
              {/* Year Picker */}
              <View style={[styles.carouselContainer, { width: 80 }]}>
                <AnimatedFlatList 
                  ref={yearScrollRef}
                  data={YEARS}
                  keyExtractor={(item: any) => item}
                  showsVerticalScrollIndicator={false}
                  snapToOffsets={YEARS.map((_, i) => i * 50)}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: 50 }}
                  getItemLayout={(_, index) => ({ length: 50, offset: 50 * index, index })}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: yearScrollY } } }],
                    { useNativeDriver: true }
                  )}
                  onMomentumScrollEnd={(e: any) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.y / 50)
                    if(YEARS[idx]) setFilterYear(YEARS[idx])
                  }}
                  renderItem={({ item: y, index: idx }: any) => {
                    const inputRange = [
                      (idx - 1) * 50,
                      idx * 50,
                      (idx + 1) * 50
                    ]
                    const scale = yearScrollY.interpolate({
                      inputRange,
                      outputRange: [0.85, 1.1, 0.85],
                      extrapolate: 'clamp'
                    })
                    const activeOpacity = yearScrollY.interpolate({
                      inputRange,
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp'
                    })
                    const inactiveOpacity = yearScrollY.interpolate({
                      inputRange,
                      outputRange: [1, 0, 1],
                      extrapolate: 'clamp'
                    })
                    return (
                      <View style={styles.carouselItem}>
                        <Animated.View style={{ opacity: inactiveOpacity, transform: [{ scale }] }}>
                          <Text style={[styles.carouselTextAnimated, { color: '#555' }]}>{y}</Text>
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', opacity: activeOpacity, transform: [{ scale }] }]}>
                          <Text style={[styles.carouselTextAnimated, { color: theme.colors.primary }]}>{y}</Text>
                        </Animated.View>
                      </View>
                    )
                  }}
                />
              </View>
              
              <View style={styles.carouselSelector} pointerEvents="none" />
            </View>

            <Pressable style={styles.applyBtn} onPress={applyCustomFilter}>
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...theme.typography.headerTitle },
  
  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginLeft: 16, marginBottom: 12, marginTop: 8 },

  chipScrollWrapper: { paddingBottom: 16 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: theme.colors.primary },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  monthGroup: { marginBottom: 24 },
  monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthHeader: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, marginLeft: 4 },
  
  card: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.background, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 22, fontWeight: '400', lineHeight: 28, textTransform: 'capitalize', color: theme.colors.text },
  dateText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '500' },
  statDivider: { color: theme.colors.borderInput, marginHorizontal: 8, fontSize: 14 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  hint: { color: theme.colors.text, fontSize: 18, fontWeight: '500', marginBottom: 8 },
  subHint: { color: theme.colors.textMuted, fontSize: 14 },
  error: { color: theme.colors.error, marginBottom: 16 },

  modalBgTransparent: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.borderLight, borderBottomWidth: 0 },
  bottomSheetDragHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderInput, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  
  filterCarouselsWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 150, marginBottom: 24, position: 'relative', gap: 16 },
  carouselContainer: { height: 150, position: 'relative', overflow: 'hidden' },
  carouselItem: { height: 50, justifyContent: 'center', alignItems: 'center' },
  carouselTextAnimated: { fontSize: 20, fontWeight: '700' },
  carouselSelector: { position: 'absolute', left: 16, right: 16, top: 50, height: 50, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.borderInput },
  
  applyBtn: { paddingVertical: 16, backgroundColor: theme.colors.primary, borderRadius: 24, alignItems: 'center' },
  applyBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },
  
  fab: { position: 'absolute', bottom: 32, right: 24, zIndex: 10, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
})
