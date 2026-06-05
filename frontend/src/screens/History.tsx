import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../api'
import { theme } from '../theme'

const PERIODS = ['All', 'This Week', 'This Month', 'Last Month']

export default function History() {
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('All')

  useEffect(() => {
    api
      .fetchHistory()
      .then((data: any) => setItems(data || []))
      .catch((err: any) => setError(err?.message || String(err)))
      .finally(() => setLoading(false))
  }, [])

  // Filter Logic
  const filteredItems = items.filter((workout) => {
    const d = new Date(workout.startedAt || workout.createdAt)
    const now = new Date()
    
    if (selectedPeriod === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    if (selectedPeriod === 'Last Month') {
      const lastMonth = new Date()
      lastMonth.setMonth(now.getMonth() - 1)
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
    }
    if (selectedPeriod === 'This Week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      startOfWeek.setHours(0,0,0,0)
      return d >= startOfWeek
    }
    return true
  })

  // Group by month
  const grouped = filteredItems.reduce((acc: any, workout) => {
    const d = new Date(workout.startedAt || workout.createdAt)
    const month = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(workout)
    return acc
  }, {})

  if (loading) {
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

      <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PERIODS.map(p => (
            <Pressable 
              key={p} 
              style={[styles.chip, selectedPeriod === p && styles.chipActive]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text style={[styles.chipText, selectedPeriod === p && styles.chipTextActive]}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && <Text style={styles.error}>{error}</Text>}
        {filteredItems.length === 0 && (
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
              const dateStr = new Date(h.startedAt || h.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })
              return (
                <View key={h.id || h._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{h.name || 'Workout'}</Text>
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statText}>⏱ {h.duration || '0m'}</Text>
                    <Text style={styles.statDivider}>·</Text>
                    <Text style={styles.statText}>🏋️ {h.volume || '0kg'}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text },
  
  chipScrollWrapper: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: theme.colors.primary },

  scrollContent: { padding: 16, paddingBottom: 100 },
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
})
