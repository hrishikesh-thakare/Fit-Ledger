import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../api'
import { getMuscle } from '../../utils/exercise'
import { useAuth } from '../../contexts/AuthContext'
import { fromKg } from '../../utils/unit'

interface HistoryItem {
  id?: string | number
  _id?: string | number
  title?: string
  name?: string
  date: string
  durationSeconds?: number
  volumeKg?: number
  [key: string]: any
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Dashboard() {
  const { theme, isDark } = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  
  const unit = user?.preferredUnit === 'lb' ? 'LBS' : 'KG'
  
  const [timeFilter, setTimeFilter] = useState<'30_days' | '3_months' | 'year' | 'all_time'>('30_days')
  const [showTimeFilter, setShowTimeFilter] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<any>(null)

  useFocusEffect(useCallback(() => {
    setLoading(true)
    Promise.all([
      api.fetchHistory(),
      api.customFetch('/custom/dashboard/stats').catch(() => null)
    ]).then(([historyDocs, statsRes]) => {
      setHistory(Array.isArray(historyDocs) ? historyDocs : (historyDocs?.docs && Array.isArray(historyDocs.docs) ? historyDocs.docs : []))
      setDashboardStats(statsRes || null)
      setLoading(false)
    }).catch(err => {
      console.log('Error fetching dashboard data', err)
      setLoading(false)
    })
  }, []))

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  // --- Section 1: Summary (Current Month vs Previous Month) ---
  const currentNow = new Date()
  const currentY = currentNow.getFullYear()
  const currentM = currentNow.getMonth()

  const startOfCurrentMonth = new Date(currentY, currentM, 1).getTime()
  const startOfPreviousMonth = new Date(currentM === 0 ? currentY - 1 : currentY, currentM === 0 ? 11 : currentM - 1, 1).getTime()
  const endOfPreviousMonth = new Date(currentY, currentM, 0, 23, 59, 59, 999).getTime()

  let curWorkouts = 0
  let curDuration = 0
  let curVolume = 0

  let prevWorkouts = 0
  let prevDuration = 0
  let prevVolume = 0

  history.forEach(h => {
    const dStr = h.date || h.startedAt || h.createdAt || new Date().toISOString()
    const t = new Date(dStr).getTime()
    if (t >= startOfCurrentMonth) {
      curWorkouts++
      curDuration += (h.durationSeconds || 0)
      curVolume += (h.volumeKg || 0)
    } else if (t >= startOfPreviousMonth && t <= endOfPreviousMonth) {
      prevWorkouts++
      prevDuration += (h.durationSeconds || 0)
      prevVolume += (h.volumeKg || 0)
    }
  })

  const curSets = dashboardStats?.curSets || 0
  const prevSets = dashboardStats?.prevSets || 0
  
  const curDurMins = Math.round(curDuration / 60)
  const prevDurMins = Math.round(prevDuration / 60)

  // --- Section 3: Radar Chart (Dynamic Time Filter) ---
  const muscleSets: Record<string, number> = dashboardStats?.muscleSets?.[timeFilter] || {
    back: 0, chest: 0, core: 0, shoulders: 0, arms: 0, legs: 0
  }
  
  const maxMuscleSets = Math.max(1, ...Object.values(muscleSets))
  const rBack = muscleSets.back / maxMuscleSets
  const rChest = muscleSets.chest / maxMuscleSets
  const rCore = muscleSets.core / maxMuscleSets
  const rShoulders = muscleSets.shoulders / maxMuscleSets
  const rArms = muscleSets.arms / maxMuscleSets
  const rLegs = muscleSets.legs / maxMuscleSets

  // --- Section 2: Current Month Mini Calendar ---
  const now = new Date()
  const cYear = now.getFullYear()
  const cMonth = now.getMonth()
  const firstDay = new Date(cYear, cMonth, 1).getDay()
  const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate()
  
  const grid: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i)
  }

  // Map workouts to current month days
  const currentMonthWorkouts: Record<number, string | number | boolean> = {}
  history.forEach(h => {
    const dStr = h.date || h.startedAt || h.createdAt || new Date().toISOString()
    const d = new Date(dStr)
    if (d.getFullYear() === cYear && d.getMonth() === cMonth) {
      currentMonthWorkouts[d.getDate()] = h.id || h._id || true
    }
  })

  const renderTrend = (cur: number, prev: number, format: (val: number) => string | number = (v) => v) => {
    const isUp = cur > prev
    const isDown = cur < prev
    const color = isUp ? (theme.colors as any).success || '#10b981' : isDown ? (theme.colors as any).error || '#ef4444' : theme.colors.textSecondary
    const icon = isUp ? 'trending-up' : isDown ? 'trending-down' : 'minus'
    
    return (
      <View style={{ marginTop: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name={icon as any} size={14} color={color} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
            {format(prev)}
          </Text>
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>vs last month</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {history.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Feather name="activity" size={40} color={theme.colors.primary} />
            </View>
            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>Welcome to Fit Ledger</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              Your dashboard will automatically populate with your statistics, calendar, and muscle distribution once you log your first workout.
            </Text>
          </View>
        ) : (
          <>
        {/* Section 1: Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            <View style={[styles.statCard, { alignItems: 'flex-start' }]}>
              <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Workouts</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '700' }}>{curWorkouts}</Text>
              {renderTrend(curWorkouts, prevWorkouts)}
            </View>
            <View style={[styles.statCard, { alignItems: 'flex-start' }]}>
              <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Duration</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '700' }}>{curDurMins}min</Text>
              {renderTrend(curDurMins, prevDurMins, (v) => `${v}min`)}
            </View>
            <View style={[styles.statCard, { alignItems: 'flex-start' }]}>
              <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Volume</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '700' }}>{Math.round(fromKg(curVolume, user?.preferredUnit || 'kg')).toLocaleString('en-US')} {unit.toLowerCase()}</Text>
              {renderTrend(curVolume, prevVolume, (v) => `${Math.round(fromKg(v, user?.preferredUnit || 'kg')).toLocaleString('en-US')} ${unit.toLowerCase()}`)}
            </View>
            <View style={[styles.statCard, { alignItems: 'flex-start' }]}>
              <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Sets</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '700' }}>{curSets}</Text>
              {renderTrend(curSets, prevSets)}
            </View>
          </View>
        </View>

        {/* Section 2: Current Month */}
        <View style={styles.section}>
          <View style={styles.calendarHeaderRow}>
            <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Current Month</Text>
            <Pressable 
              onPress={() => navigation.navigate('DashboardCalendar')}
              style={{ padding: 4, flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>View Full</Text>
              <Feather name="chevron-right" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>

          <View style={styles.miniCalendarCard}>
            <View style={styles.daysOfWeekRow}>
              {DAYS_OF_WEEK.map((d, i) => (
                <Text key={i} style={styles.dayOfWeekText}>{d}</Text>
              ))}
            </View>
            <View style={styles.miniDaysGrid}>
              {grid.map((dayNum, index) => {
                if (dayNum === null) {
                  return <View key={`empty-${index}`} style={styles.miniDayCell} />
                }
                
                const workoutId = currentMonthWorkouts[dayNum]
                const isToday = dayNum === now.getDate()
                
                return (
                  <View key={dayNum} style={styles.miniDayCell}>
                    <View style={[
                      styles.miniDayCircle, 
                      workoutId ? styles.miniDayCircleActive : null,
                      isToday && !workoutId ? { borderWidth: 1.5, borderColor: theme.colors.borderInput } : null
                    ]}>
                      <Text style={[styles.miniDayText, workoutId ? styles.miniDayTextActive : null]}>
                        {dayNum}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* Section 3: Muscle Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Muscle distribution</Text>

          <View style={styles.radarCard}>
            <Pressable 
              style={styles.radarDropdown}
              onPress={() => setShowTimeFilter(true)}
            >
              <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>
                {timeFilter === '30_days' ? 'Last 30 days' : timeFilter === '3_months' ? 'Last 3 months' : timeFilter === 'year' ? 'Last 1 year' : 'All time'}
              </Text>
              <Feather name="chevron-down" size={16} color={theme.colors.primary} />
            </Pressable>
            
            <View style={{ width: '100%', aspectRatio: 1.35, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width="100%" height="100%" viewBox="-5 15 310 225">
                {/* 5 Concentric Hexagons */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => {
                  const points = [
                    `${150 + 100 * scale * Math.cos(-Math.PI * 2 / 3)},${130 + 100 * scale * Math.sin(-Math.PI * 2 / 3)}`,
                    `${150 + 100 * scale * Math.cos(-Math.PI / 3)},${130 + 100 * scale * Math.sin(-Math.PI / 3)}`,
                    `${150 + 100 * scale * Math.cos(0)},${130 + 100 * scale * Math.sin(0)}`,
                    `${150 + 100 * scale * Math.cos(Math.PI / 3)},${130 + 100 * scale * Math.sin(Math.PI / 3)}`,
                    `${150 + 100 * scale * Math.cos(Math.PI * 2 / 3)},${130 + 100 * scale * Math.sin(Math.PI * 2 / 3)}`,
                    `${150 + 100 * scale * Math.cos(Math.PI)},${130 + 100 * scale * Math.sin(Math.PI)}`,
                  ].join(' ')
                  return <Polygon key={i} points={points} stroke={isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"} strokeWidth="1" fill="none" />
                })}
                
                {/* 6 Axes */}
                {[
                  -Math.PI * 2 / 3, // Top Left (Back)
                  -Math.PI / 3,     // Top Right (Chest)
                  0,                // Right (Core)
                  Math.PI / 3,      // Bottom Right (Shoulders)
                  Math.PI * 2 / 3,  // Bottom Left (Arms)
                  Math.PI           // Left (Legs)
                ].map((angle, i) => (
                  <Line 
                    key={i} 
                    x1="150" 
                    y1="130" 
                    x2={150 + 100 * Math.cos(angle)} 
                    y2={130 + 100 * Math.sin(angle)} 
                    stroke={isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"} 
                    strokeWidth="1" 
                  />
                ))}

                {/* Labels */}
                <SvgText x={150 + 115 * Math.cos(-Math.PI * 2 / 3)} y={130 + 115 * Math.sin(-Math.PI * 2 / 3)} fill={theme.colors.textSecondary} fontSize="12" textAnchor="end" alignmentBaseline="middle">Back</SvgText>
                <SvgText x={150 + 115 * Math.cos(-Math.PI / 3)} y={130 + 115 * Math.sin(-Math.PI / 3)} fill={theme.colors.textSecondary} fontSize="12" textAnchor="start" alignmentBaseline="middle">Chest</SvgText>
                <SvgText x={150 + 115 * Math.cos(0)} y={130 + 115 * Math.sin(0)} fill={theme.colors.textSecondary} fontSize="12" textAnchor="start" alignmentBaseline="middle">Core</SvgText>
                <SvgText x={150 + 115 * Math.cos(Math.PI / 3)} y={130 + 115 * Math.sin(Math.PI / 3)} fill={theme.colors.textSecondary} fontSize="12" textAnchor="start" alignmentBaseline="middle">Shoulders</SvgText>
                <SvgText x={150 + 115 * Math.cos(Math.PI * 2 / 3)} y={130 + 115 * Math.sin(Math.PI * 2 / 3)} fill={theme.colors.textSecondary} fontSize="12" textAnchor="end" alignmentBaseline="middle">Arms</SvgText>
                <SvgText x={150 + 115 * Math.cos(Math.PI)} y={130 + 115 * Math.sin(Math.PI)} fill={theme.colors.textSecondary} fontSize="12" textAnchor="end" alignmentBaseline="middle">Legs</SvgText>

                {/* Data Polygon (Current) */}
                <Polygon 
                  points={[
                    `${150 + (100 * Math.max(0.01, rBack)) * Math.cos(-Math.PI * 2 / 3)},${130 + (100 * Math.max(0.01, rBack)) * Math.sin(-Math.PI * 2 / 3)}`,
                    `${150 + (100 * Math.max(0.01, rChest)) * Math.cos(-Math.PI / 3)},${130 + (100 * Math.max(0.01, rChest)) * Math.sin(-Math.PI / 3)}`,
                    `${150 + (100 * Math.max(0.01, rCore)) * Math.cos(0)},${130 + (100 * Math.max(0.01, rCore)) * Math.sin(0)}`,
                    `${150 + (100 * Math.max(0.01, rShoulders)) * Math.cos(Math.PI / 3)},${130 + (100 * Math.max(0.01, rShoulders)) * Math.sin(Math.PI / 3)}`,
                    `${150 + (100 * Math.max(0.01, rArms)) * Math.cos(Math.PI * 2 / 3)},${130 + (100 * Math.max(0.01, rArms)) * Math.sin(Math.PI * 2 / 3)}`,
                    `${150 + (100 * Math.max(0.01, rLegs)) * Math.cos(Math.PI)},${130 + (100 * Math.max(0.01, rLegs)) * Math.sin(Math.PI)}`,
                  ].join(' ')}
                  stroke={theme.colors.primary} 
                  strokeWidth="2" 
                  fill={theme.colors.primary} 
                  fillOpacity="0.4" 
                />
              </Svg>
            </View>
          </View>
        </View>
        </>
        )}

      </ScrollView>

      {/* Time Filter Modal */}
      <Modal visible={showTimeFilter} transparent animationType="fade" onRequestClose={() => setShowTimeFilter(false)}>
        <TouchableWithoutFeedback onPress={() => setShowTimeFilter(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Time Range</Text>
                
                <Pressable style={styles.modalOption} onPress={() => { setTimeFilter('30_days'); setShowTimeFilter(false) }}>
                  <Text style={[styles.modalOptionText, timeFilter === '30_days' && { color: theme.colors.primary }]}>Last 30 days</Text>
                </Pressable>
                
                <Pressable style={styles.modalOption} onPress={() => { setTimeFilter('3_months'); setShowTimeFilter(false) }}>
                  <Text style={[styles.modalOptionText, timeFilter === '3_months' && { color: theme.colors.primary }]}>Last 3 months</Text>
                </Pressable>
                
                <Pressable style={styles.modalOption} onPress={() => { setTimeFilter('year'); setShowTimeFilter(false) }}>
                  <Text style={[styles.modalOptionText, timeFilter === 'year' && { color: theme.colors.primary }]}>Last 1 year</Text>
                </Pressable>

                <Pressable style={styles.modalOption} onPress={() => { setTimeFilter('all_time'); setShowTimeFilter(false) }}>
                  <Text style={[styles.modalOptionText, timeFilter === 'all_time' && { color: theme.colors.primary }]}>All time</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.background },
  pageTitle: { ...theme.typography.headerTitle },
  
  scrollContent: { padding: 16, paddingBottom: 10 },
  
  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },

  // Stat Card
  statCard: { 
    width: '48%',
    height: 96,
    padding: 16, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    borderRadius: 16, 
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  },

  // Mini Calendar
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 12
  },
  miniCalendarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary
  },
  miniDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  miniDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniDayCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  miniDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  miniDayTextActive: {
    fontWeight: '700',
    color: theme.colors.background,
  },

  // Radar Chart
  radarCard: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 16, 
    padding: 16, 
    paddingBottom: 8,
    alignItems: 'center' 
  },
  radarDropdown: { 
    backgroundColor: theme.colors.surfaceVariant, 
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginBottom: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  }
})
