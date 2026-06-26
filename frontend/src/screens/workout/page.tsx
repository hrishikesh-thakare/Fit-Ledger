import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Modal, Animated, PanResponder, Keyboard, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { Toast } from '../../components/CustomToast'
import { theme } from '../../theme'
import api from '../../api'
import { getMuscle, getEquipment, capitalize } from '../../utils/exercise'
import { useWorkoutContext } from '../../contexts/WorkoutContext'
import { CreateExerciseModal } from '../../components/CreateExerciseModal'

interface WorkoutSet {
  id: string
  type: string
  weight: string
  reps: string
  completed: boolean
  previous?: string
}

interface WorkoutExercise {
  id: string
  exerciseId?: string
  name: string
  restTime: number
  sets: WorkoutSet[]
}

export default function Workout({ route }: any) {
  const navigation = useNavigation<any>()
  const routineId = route.params?.routineId || route.params?.id

  const insets = useSafeAreaInsets()
  
  const {
    isActive,
    elapsedTime,
    exercises,
    activeRestTimer,
    remainingRest,
    setRemainingRest,
    setExercises,
    setActiveRestTimer,
    startWorkout,
    endWorkout,
    formatTime,
  } = useWorkoutContext()

  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Confirmation Dialogs
  const [showFinishDialog, setShowFinishDialog] = useState(false)

  // Modals
  const [activeSet, setActiveSet] = useState<{ exerciseId: string, setId: string } | null>(null)
  const [activeRestTimeExerciseId, setActiveRestTimeExerciseId] = useState<string | null>(null)

  // Add Exercise State
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [showAddExerciseDrawer, setShowAddExerciseDrawer] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('All')

  const generateId = () => "temp." + Date.now().toString(36) + Math.random().toString(36).substring(2)

  // Load workout data via the load API
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    const loadData = async () => {
      // If a workout is already active, resume it instead of reloading
      if (isActive && exercises.length > 0) {
        hasInitializedRef.current = true
        return
      }

      if (!routineId || hasInitializedRef.current) return
      
      hasInitializedRef.current = true
      setIsLoading(true)
      try {
        const workoutData = await api.loadWorkout(routineId)
        if (workoutData && workoutData.exercises) {
          const loadedEx = workoutData.exercises.map((ex: any) => ({
            id: ex.id || generateId(),
            exerciseId: ex.exerciseId || ex.id,
            name: ex.name || 'Unknown Exercise',
            restTime: ex.restTime || 60,
            sets: (ex.sets || []).map((s: any) => ({
              id: s.id || generateId(),
              type: s.type || 'N',
              weight: s.weight ? String(s.weight) : '',
              reps: s.reps ? String(s.reps) : '',
              completed: false,
              previous: s.previous || '-',
            }))
          }))
          startWorkout(routineId, loadedEx)
        }
      } catch (err) {
        Toast.show('Failed to load workout data', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [routineId, isActive])

  // Animations for bottom sheets
  const setOptionsPanY = useRef(new Animated.Value(500)).current
  const restTimePanY = useRef(new Animated.Value(500)).current
  const addExPanY = useRef(new Animated.Value(800)).current
  const restProgressAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (activeRestTimer && activeRestTimer.duration > 0) {
      Animated.timing(restProgressAnim, {
        toValue: remainingRest / activeRestTimer.duration,
        duration: 300,
        useNativeDriver: false
      }).start()
    }
  }, [remainingRest, activeRestTimer])

  const addExPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) addExPanY.setValue(gestureState.dy)
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          closeAddExerciseDrawer()
        } else {
          Animated.spring(addExPanY, { toValue: 0, useNativeDriver: true }).start()
        }
      }
    })
  ).current

  const closeSetOptions = () => {
    Animated.timing(setOptionsPanY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => setActiveSet(null))
  }

  const closeRestTimePicker = () => {
    Animated.timing(restTimePanY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => setActiveRestTimeExerciseId(null))
  }

  const closeAddExerciseDrawer = () => {
    Animated.timing(addExPanY, { toValue: 800, duration: 250, useNativeDriver: true }).start(() => setShowAddExerciseDrawer(false))
  }

  useEffect(() => {
    if (activeSet) Animated.spring(setOptionsPanY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start()
  }, [activeSet])

  useEffect(() => {
    if (activeRestTimeExerciseId) Animated.spring(restTimePanY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start()
  }, [activeRestTimeExerciseId])

  useEffect(() => {
    if (showAddExerciseDrawer) {
      if (availableExercises.length === 0) {
        api.fetchExercises().then((data: any) => setAvailableExercises(data || [])).catch(console.error)
      }
      addExPanY.setValue(800)
      Animated.spring(addExPanY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start()
    }
  }, [showAddExerciseDrawer])

  // Handlers
  const handleSetChange = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
    }))
  }

  const handleToggleComplete = (exerciseId: string, setId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    const set = exercise.sets.find(s => s.id === setId)
    if (!set) return

    const isCompleting = !set.completed

    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      return { ...ex, sets: ex.sets.map(s => {
        if (s.id === setId) {
          return { ...s, completed: !s.completed }
        }
        return s
      })}
    }))

    if (isCompleting) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setActiveRestTimer({
        endTime: Date.now() + exercise.restTime * 1000,
        duration: exercise.restTime,
        exerciseId
      })
      setRemainingRest(exercise.restTime)
    }
  }

  const handleToggleAllSets = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      const allCompleted = ex.sets.every(s => s.completed)
      return { ...ex, sets: ex.sets.map(s => ({ ...s, completed: !allCompleted })) }
    }))
  }

  const handleAddSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      const lastSet = ex.sets[ex.sets.length - 1]
      const newSet: WorkoutSet = {
        id: generateId(),
        type: 'N',
        weight: lastSet ? lastSet.weight : '',
        reps: lastSet ? lastSet.reps : '',
        completed: false,
        previous: '-'
      }
      return { ...ex, sets: [...ex.sets, newSet] }
    }))
  }

  const handleChangeSetType = (type: string) => {
    if (!activeSet) return
    setExercises(prev => prev.map(ex => {
      if (ex.id !== activeSet.exerciseId) return ex
      return { ...ex, sets: ex.sets.map(s => s.id === activeSet.setId ? { ...s, type } : s) }
    }))
    closeSetOptions()
  }

  const handleRemoveSet = () => {
    if (!activeSet) return
    setExercises(prev => prev.map(ex => {
      if (ex.id !== activeSet.exerciseId) return ex
      return { ...ex, sets: ex.sets.filter(s => s.id !== activeSet.setId) }
    }))
    closeSetOptions()
  }

  const handleUpdateRestTime = (seconds: number) => {
    if (!activeRestTimeExerciseId) return
    setExercises(prev => prev.map(ex => ex.id === activeRestTimeExerciseId ? { ...ex, restTime: seconds } : ex))
    closeRestTimePicker()
  }

  const handleSelectExercise = (exercise: any) => {
    setExercises(prev => [
      ...prev,
      {
        id: generateId(),
        exerciseId: exercise.id,
        name: exercise.name,
        restTime: 60,
        sets: [{ id: generateId(), type: 'N', weight: '', reps: '', completed: false, previous: '-' }]
      }
    ])
    closeAddExerciseDrawer()
  }

  const handleFinishWorkout = () => {
    const hasCompletedSets = exercises.some(ex => ex.sets.some(s => s.completed))
    if (!hasCompletedSets) {
      Toast.show('Complete at least one set to save', 'error')
      return
    }
    setShowFinishDialog(true)
  }

  const handleConfirmSave = async () => {
    // Only save exercises that have at least one completed set
    const exercisesToSave = exercises
      .filter(ex => ex.sets.some(s => s.completed))
      .map(ex => ({
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        // Send ALL sets (including uncompleted ones) so the backend's updatePrevWeights
        // doesn't delete uncompleted sets from the routine template!
        // The backend `start.ts` checks `s.completed` to avoid logging history for uncompleted ones.
        sets: ex.sets.map((s, idx) => {
          let prevW, prevR
          if (s.previous && s.previous !== '-') {
            const parts = s.previous.split('x')
            if (parts.length === 2) {
              prevW = Number(parts[0])
              prevR = Number(parts[1])
            }
          }
          return {
            weight: String(Number(s.weight) || 0),
            reps: String(Number(s.reps) || 0),
            setLabel: s.type === 'W' || s.type === 'Warmup' ? 'warmup' : s.type === 'D' || s.type === 'Drop' ? 'drop' : 'working',
            completed: s.completed,
            setOrder: idx,
            displayLabel: getSetLabelText(ex.sets, idx),
            previousWeight: prevW,
            previousReps: prevR,
          }
        })
      }))

    setSaving(true)
    setShowFinishDialog(false)
    try {
      const savePayload = {
        routineId: routineId,
        date: new Date().toISOString(),
        durationSeconds: elapsedTime,
        exercises: exercisesToSave,
      }

      // Build summary data for the summary screen
      const summaryExercises = exercisesToSave.map(ex => {
        // For the summary, we only want to calculate stats based on COMPLETED sets
        const completedSets = ex.sets.filter(s => s.completed)
        const weights = completedSets.map(s => Number(s.weight) || 0)
        const bestWeight = weights.length > 0 ? Math.max(...weights) : 0
        const totalReps = completedSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0)
        const volume = completedSets.reduce((sum, s) => sum + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0)
        
        return {
          name: ex.name,
          sets: completedSets.length,
          totalReps,
          bestWeight,
          volume,
        }
      })
      const totalVolume = summaryExercises.reduce((sum, ex) => sum + ex.volume, 0)

      navigation.navigate('WorkoutSummary', {
        summaryData: {
          savePayload,
          routineId,
          duration: elapsedTime,
          totalVolume,
          exercises: summaryExercises,
        }
      })
    } catch (err) {
      Toast.show('Failed to prepare summary', 'error')
    } finally {
      setSaving(false)
    }
  }

  const uniqueMuscles = ['All', ...Array.from(new Set(availableExercises.map(getMuscle).filter(Boolean)))]
  const uniqueEquipment = ['All', ...Array.from(new Set(availableExercises.map(getEquipment).filter(Boolean)))]

  const filteredExercises = availableExercises.filter(e => {
    const m = getMuscle(e);
    const eq = getEquipment(e);
    const matchMuscle = muscleFilter === 'All' || m === muscleFilter;
    const matchEquipment = equipmentFilter === 'All' || eq === equipmentFilter;
    const matchSearch = (e.name || e.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchMuscle && matchEquipment && matchSearch;
  })

  const getSetLabelText = (exSets: WorkoutSet[], idx: number) => {
    const set = exSets[idx]
    if (set.type === 'W' || set.type === 'Warmup') return 'W'
    if (set.type === 'D' || set.type === 'Drop' || set.type === 'Drop Set') return 'D'
    let normalCount = 0
    for (let i = 0; i <= idx; i++) {
      if (exSets[i].type === 'N' || exSets[i].type === 'Normal') normalCount++
    }
    return normalCount.toString()
  }

  const getSetLabelColor = (type: string) => {
    if (type === 'W' || type === 'Warmup') return theme.colors.primary
    if (type === 'D' || type === 'Drop' || type === 'Drop Set') return theme.colors.primary
    return theme.colors.textMuted
  }

  if (!routineId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable hitSlop={15} onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="info" size={32} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
          <Text style={styles.hint}>Please start a workout from a routine.</Text>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable hitSlop={15} onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout</Text>
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>DURATION</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>

      {/* Main List */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.scrollArea, { paddingBottom: (activeRestTimer && remainingRest > 0) ? 180 : 100 }]} 
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {exercises.map((ex, exIdx) => {
              const allCompleted = ex.sets.length > 0 && ex.sets.every(s => s.completed)
              return (
                <View key={ex.id || exIdx} style={styles.card}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{ex.name}</Text>
                    <Pressable style={styles.restTimeBtn} onPress={() => setActiveRestTimeExerciseId(ex.id)}>
                      <Feather name="clock" size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.restTimeText}>{ex.restTime}s</Text>
                    </Pressable>
                  </View>

                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { width: 40, textAlign: 'center' }]}>SET</Text>
                    <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>PREV</Text>
                    <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>KG</Text>
                    <Text style={[styles.th, { flex: 1.5, textAlign: 'center' }]}>REPS</Text>
                    <Pressable hitSlop={10} onPress={() => handleToggleAllSets(ex.id)} style={{ width: 40, alignItems: 'center' }}>
                      {allCompleted ? <Feather name="check-circle" size={18} color={theme.colors.primary} /> : <Feather name="check" size={18} color={theme.colors.textMuted} />}
                    </Pressable>
                  </View>

                  {/* Rows */}
                  {ex.sets.map((set, sIdx) => {
                    const isChecked = set.completed
                    const rowBg = isChecked ? theme.colors.primaryLight : 'transparent'
                    return (
                      <View key={set.id || sIdx} style={[styles.tableRow, { backgroundColor: rowBg }]}>
                        {/* Set Number/Type */}
                        <Pressable 
                          style={{ width: 40, alignItems: 'center', paddingVertical: 8 }}
                          onPress={() => setActiveSet({ exerciseId: ex.id, setId: set.id })}
                        >
                          <Text style={[styles.tdSet, { color: getSetLabelColor(set.type) }]}>
                            {getSetLabelText(ex.sets, sIdx)}
                          </Text>
                        </Pressable>

                        {/* Previous */}
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={styles.tdPrev}>{set.previous}</Text>
                        </View>

                        {/* Weight */}
                        <View style={{ flex: 1.5, alignItems: 'center' }}>
                          <TextInput
                            style={[styles.tdInput, isChecked && { color: theme.colors.textMuted }]}
                            value={set.weight}
                            onChangeText={(val) => handleSetChange(ex.id, set.id, 'weight', val)}
                            keyboardType="numeric"
                            placeholder="-"
                            placeholderTextColor={theme.colors.textMuted}
                            cursorColor={theme.colors.primary}
                            selectionColor={theme.colors.primary}
                          />
                        </View>

                        {/* Reps */}
                        <View style={{ flex: 1.5, alignItems: 'center' }}>
                          <TextInput
                            style={[styles.tdInput, isChecked && { color: theme.colors.textMuted }]}
                            value={set.reps}
                            onChangeText={(val) => handleSetChange(ex.id, set.id, 'reps', val)}
                            keyboardType="numeric"
                            placeholder="-"
                            placeholderTextColor={theme.colors.textMuted}
                            cursorColor={theme.colors.primary}
                            selectionColor={theme.colors.primary}
                          />
                        </View>

                        {/* Checkbox */}
                        <Pressable 
                          style={{ width: 40, alignItems: 'center', paddingVertical: 8 }}
                          onPress={() => handleToggleComplete(ex.id, set.id)}
                        >
                          <View style={[styles.checkCircle, isChecked && styles.checkCircleActive]}>
                            {isChecked && <Feather name="check" size={16} color={theme.colors.background} />}
                          </View>
                        </Pressable>
                      </View>
                    )
                  })}

                  {/* Add Set Button */}
                  <Pressable style={styles.addSetBtn} onPress={() => handleAddSet(ex.id)}>
                    <Text style={styles.addSetText}>+ Add Set</Text>
                  </Pressable>
                </View>
              )
            })}
            
            {exercises.length > 0 && (
              <Pressable style={styles.addExerciseCardBtn} onPress={() => setShowAddExerciseDrawer(true)}>
                <Feather name="plus" size={16} color={theme.colors.textMuted} />
                <Text style={styles.addExerciseCardText}>Add Exercise</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom bar: rest timer stacked directly above finish button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {activeRestTimer && remainingRest > 0 && (
          <View style={styles.restBanner}>
            <Animated.View style={[styles.restProgressBar, { 
              width: restProgressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }]} />
            <View style={styles.restBannerInner}>
              <Pressable style={[styles.restBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => {
                setActiveRestTimer(prev => prev ? { ...prev, endTime: prev.endTime - 15000, duration: Math.max(15, prev.duration - 15) } : null)
                setRemainingRest(r => Math.max(0, r - 15))
              }}>
                <Text style={[styles.restBtnText, { color: theme.colors.background }]}>-15</Text>
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.restBannerLabel}>RESTING</Text>
                <Text style={styles.restBannerTime}>{formatTime(remainingRest)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.restBtn, { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 8 }]} onPress={() => setActiveRestTimer(null)}>
                  <Text style={[styles.restBtnText, { color: theme.colors.primary }]}>Skip</Text>
                </Pressable>
                <Pressable style={[styles.restBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => {
                   setActiveRestTimer(prev => prev ? { ...prev, endTime: prev.endTime + 15000, duration: prev.duration + 15 } : null)
                   setRemainingRest(r => r + 15)
                }}>
                  <Text style={[styles.restBtnText, { color: theme.colors.background }]}>+15</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.footer, activeRestTimer && remainingRest > 0 && styles.footerWithRestBanner]}>
          <Pressable 
            style={[styles.finishBtn, saving && { opacity: 0.7 }]} 
            onPress={handleFinishWorkout}
            disabled={saving}
          >
            <Text style={styles.finishBtnText}>{saving ? 'Saving...' : 'Finish Workout'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Set Options Modal */}
      <Modal visible={!!activeSet} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBgTransparent}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSetOptions} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: setOptionsPanY }] }]}>
            <View style={{ paddingBottom: 16 }}>
              <View style={styles.bottomSheetDragHandle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sheetTitle}>Set Options</Text>
                <Pressable hitSlop={15} onPress={closeSetOptions}><Feather name="x" size={24} color={theme.colors.text} /></Pressable>
              </View>
            </View>
            <View style={styles.sheetDivider} />
            <Pressable style={styles.sheetOption} onPress={() => handleChangeSetType('Normal')}>
              <Text style={styles.sheetOptionText}>Normal Set</Text>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable style={styles.sheetOption} onPress={() => handleChangeSetType('Warmup')}>
              <Text style={styles.sheetOptionText}>Warm Up</Text>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable style={styles.sheetOption} onPress={() => handleChangeSetType('Drop')}>
              <Text style={styles.sheetOptionText}>Drop Set</Text>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable style={styles.sheetOption} onPress={handleRemoveSet}>
              <Text style={[styles.sheetOptionText, { color: theme.colors.error }]}>Delete Set</Text>
              <Feather name="trash-2" size={20} color={theme.colors.error} />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Rest Time Modal */}
      <Modal visible={!!activeRestTimeExerciseId} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBgTransparent}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRestTimePicker} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: restTimePanY }] }]}>
            <View style={{ paddingBottom: 16 }}>
              <View style={styles.bottomSheetDragHandle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sheetTitle}>Rest Time</Text>
                <Pressable hitSlop={15} onPress={closeRestTimePicker}><Feather name="x" size={24} color={theme.colors.text} /></Pressable>
              </View>
            </View>
            <View style={styles.sheetDivider} />
            {[30, 60, 90, 120, 180, 240, 300].map((t) => (
              <View key={t}>
                <Pressable style={styles.sheetOption} onPress={() => handleUpdateRestTime(t)}>
                  <Text style={styles.sheetOptionText}>{t}s ({Math.floor(t/60)}m {t%60 > 0 ? `${t%60}s` : ''})</Text>
                </Pressable>
                <View style={styles.sheetDivider} />
              </View>
            ))}
          </Animated.View>
        </View>
      </Modal>

      {/* Add Exercise Drawer */}
      <Modal visible={showAddExerciseDrawer} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
        <View style={styles.modalBgTransparent}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAddExerciseDrawer} />
          <Animated.View style={[styles.bottomSheet, { height: '85%', paddingBottom: 0, paddingHorizontal: 0, transform: [{ translateY: addExPanY }] }]}>
            <View {...addExPanResponder.panHandlers} style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, backgroundColor: 'transparent' }}>
              <View style={styles.bottomSheetDragHandle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sheetTitle}>Select Exercise</Text>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <Pressable hitSlop={15} onPress={() => setShowCreateModal(true)}><Feather name="plus" size={24} color={theme.colors.text} /></Pressable>
                  <Pressable hitSlop={15} onPress={closeAddExerciseDrawer}><Feather name="x" size={24} color={theme.colors.text} /></Pressable>
                </View>
              </View>
            </View>
            
            {/* Search Bar */}
            <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
              <View style={styles.searchInputWrapper}>
                <Feather name="search" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <Feather name="x-circle" size={16} color={theme.colors.textMuted} />
                  </Pressable>
                )}
              </View>
            </View>
            
            {/* Chips */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, marginTop: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {uniqueMuscles.map((m: any) => (
                  <Pressable key={m} onPress={() => setMuscleFilter(m)} style={[styles.filterChip, muscleFilter === m && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, muscleFilter === m && styles.filterChipTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {uniqueEquipment.map((eq: any) => (
                  <Pressable key={eq} onPress={() => setEquipmentFilter(eq)} style={[styles.filterChip, equipmentFilter === eq && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, equipmentFilter === eq && styles.filterChipTextActive]}>{eq}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.sheetDivider, { marginHorizontal: 0 }]} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
              {filteredExercises.map((e: any, idx: number) => (
                <View key={e.id || idx}>
                  <View style={styles.exerciseListItem}>
                    <Pressable style={{ flex: 1, paddingVertical: 4 }} onPress={() => handleSelectExercise(e)}>
                      <Text style={styles.exListTitle}>{e.name || e.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={styles.exListMeta}>{getMuscle(e) || 'Other'}</Text>
                        {getEquipment(e) && (
                          <View style={styles.machineBadge}>
                            <Text style={styles.machineBadgeText}>{getEquipment(e)}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <Pressable 
                      hitSlop={15} 
                      style={{ padding: 8, marginRight: -8 }}
                      onPress={() => {
                        closeAddExerciseDrawer();
                        navigation.navigate('ExerciseHistory', { exercise: e });
                      }}
                    >
                      <Feather name="chevron-right" size={20} color={theme.colors.primary} />
                    </Pressable>
                  </View>
                  <View style={[styles.sheetDivider, { marginHorizontal: 0 }]} />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <CreateExerciseModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          api.fetchExercises().then((data: any) => setAvailableExercises(data || [])).catch(console.error)
        }}
      />

      {/* Finish Workout Confirmation Dialog */}
      <Modal visible={showFinishDialog} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.confirmModalBg}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmModalTitle}>Save Workout?</Text>
            <Text style={styles.confirmModalText}>
              Your completed sets will be saved. Unchecked sets will be discarded.
            </Text>
            <View style={styles.confirmModalButtons}>
              <Pressable
                style={styles.confirmModalCancelBtn}
                onPress={() => setShowFinishDialog(false)}
                disabled={saving}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmModalSaveBtn}
                onPress={handleConfirmSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.background} size="small" />
                ) : (
                  <Text style={styles.confirmModalSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { ...theme.typography.heading },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1 },
  timerValue: { fontSize: 22, fontWeight: '800', color: theme.colors.primary, fontFamily: 'monospace' },
  
  scrollArea: { padding: 16, paddingBottom: 85, flexGrow: 1 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { color: theme.colors.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.colors.surfaceVariant, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.borderLight },
  backBtnText: { color: theme.colors.text, fontWeight: '600' },

  card: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.borderLight, overflow: 'hidden', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, flex: 1 },
  restTimeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  restTimeText: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
  
  tableHeader: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  th: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  tdSet: { fontSize: 15, fontWeight: '700' },
  tdPrev: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  tdInput: { color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', minWidth: 60 },
  
  checkCircle: { height: 26, width: 26, borderRadius: 13, backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.borderInput, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  
  addSetBtn: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.borderLight, backgroundColor: theme.colors.surfaceVariant },
  addSetText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },

  addExerciseCardBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 0 },
  addExerciseCardText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '700' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, backgroundColor: theme.colors.background },
  restBanner: { backgroundColor: theme.colors.surfaceElevated, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, borderTopLeftRadius: 16, borderTopRightRadius: 16, elevation: 10, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  restProgressBar: { height: 3, backgroundColor: theme.colors.primary, position: 'absolute', top: 0, left: 0 },
  restBannerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  restBtn: { backgroundColor: theme.colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderLight },
  restBtnText: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  restBannerLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  restBannerTime: { color: theme.colors.primary, fontSize: 24, fontWeight: '800', fontFamily: 'monospace' },

  footer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  footerWithRestBanner: { borderTopWidth: 0, paddingTop: 15 },
  finishBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  finishBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },

  modalBgTransparent: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: theme.colors.surfaceElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.borderLight, borderBottomWidth: 0 },
  bottomSheetDragHandle: { width: 40, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
  sheetDivider: { height: 1, backgroundColor: theme.colors.borderLight, marginHorizontal: -24 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  sheetOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: theme.colors.borderLight },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 16 },

  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderLight, marginRight: 8 },
  filterChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  filterChipText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  filterChipTextActive: { color: theme.colors.primary },
  
  exerciseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  exListTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  exListMeta: { color: theme.colors.textMuted, fontSize: 12 },
  machineBadge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  machineBadgeText: { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },

  // Confirmation Dialogs
  confirmModalBg: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmModalCard: { width: '100%', backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 20, padding: 24 },
  confirmModalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 10 },
  confirmModalText: { fontSize: 15, color: theme.colors.textMuted, marginBottom: 24, lineHeight: 22 },
  confirmModalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  confirmModalCancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  confirmModalCancelText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 15 },
  confirmModalSaveBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: theme.colors.primary, minWidth: 80, alignItems: 'center' },
  confirmModalSaveText: { color: theme.colors.background, fontWeight: '700', fontSize: 15 },
  confirmModalDiscardBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: theme.colors.error, minWidth: 80, alignItems: 'center' },
  confirmModalDiscardText: { color: theme.colors.text, fontWeight: '700', fontSize: 15 },
})
