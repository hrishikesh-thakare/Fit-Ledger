import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator, BackHandler } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { CustomAlert as Alert } from '../../../components/CustomAlert'
import { Toast } from '../../../components/CustomToast'
import { useTheme } from '../../../contexts/ThemeContext'
import api from '../../../api'
import { useWorkoutContext } from '../../../contexts/WorkoutContext'
import { useAuth } from '../../../contexts/AuthContext'
import { fromKg } from '../../../utils/unit'
interface SummaryExercise {
  name: string
  sets: number
  totalReps: number
  bestWeight: number
  volume: number
}

export interface WorkoutSetData {
  weight: string;
  reps: string;
  setLabel: string;
  completed: boolean;
  setOrder: number;
  displayLabel: string;
  previousWeight?: number;
  previousReps?: number;
}

export interface SaveWorkoutPayload {
  routineId: string | number;
  date: string;
  durationSeconds: number;
  exercises: Array<{ exerciseId: string | number; name?: string; sets: WorkoutSetData[] }>;
}

export interface WorkoutSummaryData {
  savePayload?: SaveWorkoutPayload;
  routineId?: string | number;
  duration: number; // seconds
  totalVolume: number;
  exercises: SummaryExercise[];
}

export default function WorkoutSummary({ route }: any) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const navigation = useNavigation()
  const summaryData: WorkoutSummaryData = route.params?.summaryData || {
    duration: 0,
    totalVolume: 0,
    exercises: [],
  }

  const { endWorkout, clientId } = useWorkoutContext()
  const { user } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [updateWeights, setUpdateWeights] = useState(true)

  const unit = user?.preferredUnit === 'lb' ? 'LBS' : 'KG'

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      return true
    })
    return () => sub.remove()
  }, [])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSave = async () => {
    if (!summaryData.savePayload) {
      navigation.navigate('MainTabs', { screen: 'Routines' })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...summaryData.savePayload,
        clientId,
        updatePrevWeights: updateWeights,
      }
      await api.saveWorkout(payload)
      endWorkout()
      navigation.navigate('MainTabs', { screen: 'Routines' })
    } catch (err) {
      Toast.show('Failed to save workout', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    Alert.alert(
      'Discard workout?',
      'Your workout will not be saved.',
      [
        { text: 'Keep going', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            endWorkout()
            navigation.navigate('MainTabs', { screen: 'Routines' })
          }
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Complete</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.wellDoneContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={48} color={theme.colors.primary} />
          <Text style={styles.wellDoneText}>Well Done!!</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(summaryData.duration)}</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fromKg(summaryData.totalVolume, user?.preferredUnit || 'kg').toFixed(0)}</Text>
            <Text style={styles.statLabel}>VOLUME ({unit})</Text>
          </View>
        </View>

        <View style={styles.exerciseList}>
          {summaryData.exercises.map((ex, idx) => (
            <View key={idx} style={styles.exerciseCard}>
              <View style={styles.exerciseIndex}>
                <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMeta}>{ex.sets} sets • {fromKg(ex.bestWeight, user?.preferredUnit || 'kg').toFixed(1)}{unit.toLowerCase()} best</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Toggle Section */}
        <View style={styles.toggleCard}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.toggleTitle}>Update Previous Weights</Text>
            <Text style={styles.toggleDesc}>Sync last performed weights to new workouts</Text>
          </View>
          <Pressable 
            style={[styles.toggleSwitch, updateWeights && styles.toggleSwitchActive]}
            onPress={() => setUpdateWeights(!updateWeights)}
          >
            <View style={[styles.toggleThumb, updateWeights && styles.toggleThumbActive]} />
          </Pressable>
        </View>

        <View style={styles.actionsContainer}>
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={theme.colors.onPrimary} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Workout</Text>
            )}
          </Pressable>

          <Pressable style={styles.discardBtn} onPress={handleDiscard}>
            <Text style={styles.discardBtnText}>Discard Workout</Text>
          </Pressable>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.subheading,
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  wellDoneContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  wellDoneText: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.primary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  exerciseList: {
    gap: 10,
    marginBottom: 32,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 14,
    padding: 16,
  },
  exerciseIndex: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  exerciseIndexText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 3,
  },
  exerciseMeta: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 32,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.textMuted,
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    backgroundColor: theme.colors.background,
    transform: [{ translateX: 20 }],
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
  },
  saveBtnText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  discardBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
  },
  discardBtnText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
})
