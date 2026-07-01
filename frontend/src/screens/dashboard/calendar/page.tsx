import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '../../../contexts/ThemeContext'
import api from '../../../api'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthData {
  id: string
  year: number
  month: number // 0-11
}

const generateMonths = (): MonthData[] => {
  const data: MonthData[] = []
  const now = new Date()
  
  let y = now.getFullYear()
  let m = now.getMonth()
  
  // Generate backwards until we hit Jan 2026
  while (y > 2026 || (y === 2026 && m >= 0)) {
    data.push({ id: `${y}-${m}`, year: y, month: m })
    m--
    if (m < 0) {
      m = 11
      y--
    }
  }
  return data
}

export default function DashboardCalendar() {
  const { theme, isDark } = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation<any>()
  const [loading, setLoading] = useState(true)
  
  // Map of date string (YYYY-MM-DD) to workout ID (or just true if multiple)
  const [workoutDates, setWorkoutDates] = useState<Record<string, string | number>>({})
  
  const [monthsData] = useState<MonthData[]>(generateMonths())
  const flatListRef = React.useRef<FlatList>(null)

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      api.fetchHistory().then((docs: any) => {
        const history = Array.isArray(docs) ? docs : (docs?.docs && Array.isArray(docs.docs) ? docs.docs : [])
        const datesMap: Record<string, string | number> = {}
        
        history.forEach((h: any) => {
          const dStr = h.date || h.startedAt || h.createdAt
          if (dStr) {
            const d = new Date(dStr)
            // local YYYY-MM-DD format
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const key = `${y}-${m}-${day}`
            datesMap[key] = h.id || h._id
          }
        })
        
        setWorkoutDates(datesMap)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }, [])
  )

  const renderMonth = ({ item }: { item: MonthData }) => {
    const firstDay = new Date(item.year, item.month, 1).getDay() // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(item.year, item.month + 1, 0).getDate()
    
    // Create grid array (padded with nulls at the start)
    const grid: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(i)
    }

    return (
      <View style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{MONTHS[item.month]} {item.year}</Text>
        
        <View style={styles.daysGrid}>
          {grid.map((dayNum, index) => {
            if (dayNum === null) {
              return <View key={`empty-${index}`} style={styles.dayCell} />
            }
            
            const key = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const workoutId = workoutDates[key]
            
            return (
              <Pressable 
                key={dayNum} 
                style={styles.dayCell}
                onPress={() => {
                  if (workoutId) navigation.navigate('WorkoutDetails', { id: workoutId })
                }}
              >
                <View style={[styles.dayCircle, workoutId ? styles.dayCircleActive : null]}>
                  <Text style={[styles.dayText, workoutId ? styles.dayTextActive : null]}>
                    {dayNum}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.daysOfWeekRow}>
        {DAYS_OF_WEEK.map(d => (
          <Text key={d} style={styles.dayOfWeekText}>{d}</Text>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={monthsData}
          keyExtractor={item => item.id}
          renderItem={renderMonth}
          contentContainerStyle={{ paddingTop: 40, paddingBottom: 0 }}
          inverted={true}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.borderLight, marginHorizontal: 16, marginVertical: 4 }} />}
        />
      )}
    </SafeAreaView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { ...theme.typography.subheading, color: theme.colors.text },
  
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  daysOfWeekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary
  },
  
  monthContainer: {
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: 8,
    marginBottom: 16
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  dayCell: {
    width: '14.28%', // 100 / 7
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  dayTextActive: {
    fontWeight: '700',
    color: theme.colors.onPrimary,
  }
})
