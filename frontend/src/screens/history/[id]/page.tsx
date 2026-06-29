import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import api from '../../../api'
import { theme } from '../../../theme'
import { useAuth } from '../../../contexts/AuthContext'
import { fromKg } from '../../../utils/unit'

type SetDisplayType = 'Warmup' | 'Working' | 'Drop'

interface SetDetail {
  id: number
  type: SetDisplayType
  weight: string
  reps: number | string
  displayLabel?: string
}

const getSetLabel = (sets: SetDetail[], currentIndex: number) => {
  const currentSet = sets[currentIndex]
  if (currentSet.type === 'Warmup') return 'W'
  if (currentSet.type === 'Drop') return 'D'

  let normalCount = 0
  for (let i = 0; i <= currentIndex; i++) {
    if (sets[i].type === 'Working') normalCount++
  }
  return normalCount
}

interface ExerciseDetail {
  id: number
  name: string
  equipment?: string[]
  sets: SetDetail[]
}

interface WorkoutDetailsData {
  id: number
  name: string
  date: string
  startTime: string
  endTime: string
  duration: string
  volume: string
  exercises: ExerciseDetail[]
}

export default function WorkoutDetails({ route }: any) {
  const navigation = useNavigation()
  const { user } = useAuth()
  const unit = user?.preferredUnit || 'kg'
  const workoutId = route.params?.id

  const [details, setDetails] = useState<WorkoutDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)
        const response = await api.customFetch(`/custom/workouts/${workoutId}/details`)
        const workoutDay = response.workoutDay
        const workoutExercisesDocs = response.workoutExercises
        const setsDocs = response.workoutSets

        const setsByExercise: Record<number, any[]> = {}

        setsDocs.forEach((set: any) => {
          const exerciseId = typeof set.workoutExercise === 'object' ? set.workoutExercise.id : set.workoutExercise
          const idNum = Number(exerciseId)
          if (!setsByExercise[idNum]) setsByExercise[idNum] = []
          setsByExercise[idNum].push(set)
        })

        const setLabelMap: Record<string, SetDisplayType> = {
          warmup: 'Warmup',
          working: 'Working',
          drop: 'Drop',
        }

        const exercisesWithSets = workoutExercisesDocs.map((workoutExercise: any) => {
          const sets = setsByExercise[workoutExercise.id] || []
          const exercise = typeof workoutExercise.exercise === 'object' ? workoutExercise.exercise : null

          return {
            id: workoutExercise.id,
            name: exercise?.name || 'Unknown Exercise',
            equipment: Array.isArray(exercise?.equipment) 
              ? exercise.equipment 
              : (typeof exercise?.equipment === 'string' ? [exercise.equipment] : []),
            sets: sets.map((set: any) => ({
              id: set.id,
              type: setLabelMap[set.setLabel] || 'Working',
              weight: set.weight ? String(Math.round(fromKg(Number(set.weight), unit, true) * 10) / 10) : '0',
              reps: set.reps || '-',
              displayLabel: set.displayLabel,
            })),
          }
        })

        // Calculate total volume (now in the preferred unit)
        const totalVolume = exercisesWithSets.reduce((sum: number, exercise: ExerciseDetail) => {
          return sum + exercise.sets.reduce((exSum: number, set: SetDetail) => {
            const repsNum = set.reps === '-' ? 0 : Number(set.reps)
            return exSum + parseFloat(set.weight) * repsNum
          }, 0)
        }, 0)

        const durationSeconds = workoutDay.durationSeconds || 0
        const hours = Math.floor(durationSeconds / 3600)
        const minutes = Math.floor((durationSeconds % 3600) / 60)
        const seconds = durationSeconds % 60
        const durationStr =
          hours > 0
            ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

        const workoutDate = new Date(workoutDay.date || workoutDay.createdAt)
        const fullDate = workoutDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
        const startTime = workoutDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })

        setDetails({
          id: workoutDay.id,
          name: workoutDay.title || 'Workout',
          date: fullDate,
          startTime,
          endTime: '',
          duration: durationStr,
          volume: `${Math.round(totalVolume).toLocaleString('en-US')} ${unit}`,
          exercises: exercisesWithSets,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load details')
      } finally {
        setLoading(false)
      }
    }

    if (workoutId) fetchDetails()
  }, [workoutId, unit])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout Details</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error || !details ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.error }}>{error || 'Not found'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryContainer}>
            <Text style={styles.title}>{details.name.toUpperCase()}</Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={styles.dateText}>{details.date} • {details.startTime}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DURATION</Text>
                <View style={styles.statValueRow}>
                  <Feather name="clock" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.statValue}>{details.duration}</Text>
                </View>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>VOLUME</Text>
                <View style={styles.statValueRow}>
                  <MaterialCommunityIcons name="dumbbell" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.statValue}>{details.volume}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.exercisesContainer}>
            {details.exercises.map(exercise => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.equipment && (
                    <View style={{ flexDirection: 'row' }}>
                      {(Array.isArray(exercise.equipment) ? exercise.equipment : [exercise.equipment]).map((eq: string) => (
                        <View key={eq} style={styles.chip}>
                          <Text style={styles.chipText}>{typeof eq === 'string' ? eq.charAt(0).toUpperCase() + eq.slice(1) : 'Machine'}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>SET</Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>WEIGHT <Text style={styles.tableHeaderSub}>({unit})</Text></Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>REPS</Text>
                </View>

                {exercise.sets.map((set, index) => {
                  const label = set.displayLabel || getSetLabel(exercise.sets, index)
                  const isWarmup = set.type === 'Warmup'
                  const isDrop = set.type === 'Drop'
                  
                  let labelColor = theme.colors.textMuted
                  let labelWeight: any = '600'
                  
                  if (isWarmup) {
                    labelColor = theme.colors.primary // Orange
                    labelWeight = 'bold'
                  } else if (isDrop) {
                    labelColor = theme.colors.primary // Blue
                    labelWeight = 'bold'
                  }

                  return (
                    <View key={set.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1, color: labelColor, fontWeight: labelWeight }]}>{label}</Text>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{set.weight}</Text>
                      <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>{set.reps}</Text>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  statBox: {
    justifyContent: 'center',
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
  },
  exercisesContainer: {
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  chip: {
    backgroundColor: theme.colors.primary + '33', // 20% opacity of the theme primary
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  chipText: {
    color: theme.colors.primary, // Exact theme primary
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  tableHeaderText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableHeaderSub: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableCell: {
    color: theme.colors.text,
    fontSize: 15,
    textAlign: 'center',
  },
})
