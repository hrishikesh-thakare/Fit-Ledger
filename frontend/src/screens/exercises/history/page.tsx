import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../../../contexts/AuthContext'
import api from '../../../api'
import { useTheme } from '../../../contexts/ThemeContext'

interface HistoryEntry {
  date: string
  weight: number
  reps: number
  volume: number
  sets: number
  isPR: boolean
}

interface ProcessedExercise {
  id: string | number
  name: string
  muscleGroup: string
  personalBest: {
    weight: number
    reps: number
    date: string
  } | null
  history: HistoryEntry[]
}

export default function ExerciseHistory({ route }: any) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation()
  const { user } = useAuth()
  const exerciseParam = route.params?.exercise

  const [exercise, setExercise] = useState<ProcessedExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = months[d.getMonth()]
      const day = d.getDate()
      const year = d.getFullYear()
      let hours = d.getHours()
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12
      return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`
    } catch (e) {
      return dateStr
    }
  }

  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!exerciseParam) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const numericId = exerciseParam.id

        const muscleGroupName =
          exerciseParam.bodyPart ||
          (typeof exerciseParam.muscleGroup === 'object' && exerciseParam.muscleGroup !== null
            ? exerciseParam.muscleGroup.name
            : (typeof exerciseParam.muscleGroup === 'string' ? exerciseParam.muscleGroup : 'Unknown'))

        if (!user?.id) {
          throw new Error('User not authenticated')
        }

        // Fetch exercise history from the dedicated endpoint
        const response = await api.customFetch(
          `/custom/exercises/${numericId}/history?userId=${user.id}`
        )

        if (response.error) {
          throw new Error(response.error)
        }

        setExercise({
          id: response.exercise.id,
          name: response.exercise.name,
          muscleGroup: muscleGroupName,
          personalBest: response.exercise.personalBest,
          history: response.history,
        })
      } catch (err: any) {
        console.error('Error fetching exercise data:', err)
        setError(err.message || 'Failed to load exercise data')
      } finally {
        setLoading(false)
      }
    }

    fetchExerciseData()
  }, [exerciseParam])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={32}
          color={theme.colors.text}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise?.name || exerciseParam?.name || exerciseParam?.title || 'Exercise'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : exercise ? (
          <>
            {/* Personal Best Card */}
            {exercise.personalBest && (
              <View style={styles.pbCard}>
                <View style={styles.pbHeader}>
                  <MaterialCommunityIcons name="trending-up" size={24} color={theme.colors.primary} />
                  <Text style={styles.pbTitle}>Personal Best</Text>
                </View>
                <View style={styles.pbStats}>
                  <Text style={styles.pbWeight}>{exercise.personalBest.weight} kg</Text>
                  <Text style={styles.pbMultiply}>×</Text>
                  <Text style={styles.pbReps}>{exercise.personalBest.reps}</Text>
                </View>
                <Text style={styles.pbDate}>Set on {formatDate(exercise.personalBest.date)}</Text>
              </View>
            )}

            {/* Historical Performances */}
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>HISTORY</Text>

              {exercise.history.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="dumbbell" size={64} color={theme.colors.border} />
                  <Text style={styles.emptyStateTitle}>No workout history yet</Text>
                  <Text style={styles.emptyStateText}>
                    Start a workout with this exercise to see your history here
                  </Text>
                </View>
              ) : (
                <View style={styles.historyCard}>
                  {exercise.history.map((entry, index) => (
                    <View key={index}>
                      <View style={styles.historyItem}>
                        <View style={styles.historyItemHeader}>
                          <MaterialCommunityIcons name="calendar-blank" size={16} color={theme.colors.textMuted} />
                          <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                          {entry.isPR && (
                            <View style={styles.prBadge}>
                              <Text style={styles.prBadgeText}>PR</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.historyItemStats}>
                          <View style={styles.statColumn}>
                            <Text style={styles.statLabel}>Best Set</Text>
                            <Text style={styles.statValue}>{entry.weight}kg × {entry.reps}</Text>
                          </View>
                          <View style={styles.statColumn}>
                            <Text style={styles.statLabel}>Volume</Text>
                            <Text style={styles.statValue}>{entry.volume} kg</Text>
                          </View>
                          <View style={styles.statColumn}>
                            <Text style={styles.statLabel}>Sets</Text>
                            <Text style={styles.statValue}>{entry.sets}</Text>
                          </View>
                        </View>
                      </View>
                      {index < exercise.history.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: theme.colors.errorLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  worseBadge: {
    backgroundColor: theme.colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
  },
  worseText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  pbCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  pbTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  pbStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  pbWeight: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginRight: 6,
  },
  pbMultiply: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginRight: 6,
  },
  pbReps: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  pbDate: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  historyItem: {
    padding: 20,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginLeft: 6,
    flex: 1,
  },
  prBadge: {
    backgroundColor: theme.colors.primaryLight, // Primary with opacity
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  historyItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: 20,
  },
})
