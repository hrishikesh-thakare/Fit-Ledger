import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Modal, Animated, PanResponder, Keyboard } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { CustomAlert as Alert } from '../../components/CustomAlert'
import { theme } from '../../theme'
import api from '../../api'

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
  
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Active Rest Timer
  const [activeRestTimer, setActiveRestTimer] = useState<{ endTime: number, duration: number, exerciseId: string } | null>(null)
  const [remainingRest, setRemainingRest] = useState(0)

  // Modals
  const [activeSet, setActiveSet] = useState<{ exerciseId: string, setId: string } | null>(null)
  const [activeRestTimeExerciseId, setActiveRestTimeExerciseId] = useState<string | null>(null)

  // Add Exercise State
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [showAddExerciseDrawer, setShowAddExerciseDrawer] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [equipmentFilter, setEquipmentFilter] = useState('All')

  // Timer Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isActive) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [isActive])

  // Rest Timer Effect
  useEffect(() => {
    if (!activeRestTimer) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeRestTimer.endTime - Date.now()) / 1000))
      setRemainingRest(remaining)
      if (remaining <= 0) {
        setActiveRestTimer(null)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [activeRestTimer])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Load routine
  useEffect(() => {
    const loadData = async () => {
      if (!routineId) return
      setIsLoading(true)
      try {
        const routineData = await api.fetchRoutine(routineId)
        if (routineData && routineData.exercises) {
          const loadedEx = routineData.exercises.map((ex: any) => ({
            id: ex.id || Math.random().toString(),
            exerciseId: ex.exercise?.id || ex.exerciseId || ex.id,
            name: ex.exercise?.name || ex.name || 'Unknown Exercise',
            restTime: 60, // Default rest time
            sets: (ex.sets || []).map((s: any) => ({
              id: s.id || Math.random().toString(),
              type: s.type || 'N',
              weight: s.weight ? String(s.weight) : '',
              reps: s.reps ? String(s.reps) : '',
              completed: false,
              previous: '-', // Backend doesn't provide previous directly in routine, need history API for this ideally
            }))
          }))
          setExercises(loadedEx)
          setIsActive(true) // Start timer automatically when routine loads
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load routine')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [routineId])

  // Animations for bottom sheets
  const setOptionsPanY = useRef(new Animated.Value(500)).current
  const restTimePanY = useRef(new Animated.Value(500)).current
  const addExPanY = useRef(new Animated.Value(800)).current

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
    let isCompleting = false
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex
      return { ...ex, sets: ex.sets.map(s => {
        if (s.id === setId) {
          isCompleting = !s.completed
          return { ...s, completed: !s.completed }
        }
        return s
      })}
    }))

    if (isCompleting) {
      const exercise = exercises.find(e => e.id === exerciseId)
      if (exercise) {
        setActiveRestTimer({
          endTime: Date.now() + exercise.restTime * 1000,
          duration: exercise.restTime,
          exerciseId
        })
        setRemainingRest(exercise.restTime)
      }
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
        id: Math.random().toString(),
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
        id: Math.random().toString(),
        exerciseId: exercise.id,
        name: exercise.name,
        restTime: 60,
        sets: [{ id: Math.random().toString(), type: 'N', weight: '', reps: '', completed: false, previous: '-' }]
      }
    ])
    closeAddExerciseDrawer()
  }

  const handleFinishWorkout = async () => {
    const exercisesToSave = exercises.map(ex => ({
      exercise: ex.exerciseId || ex.id,
      sets: ex.sets.filter(s => s.completed).map(s => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        setLabel: s.type === 'W' || s.type === 'Warmup' ? 'warmup' : s.type === 'D' || s.type === 'Drop' ? 'drop' : 'working',
        completed: true
      }))
    })).filter(ex => ex.sets.length > 0)

    if (exercisesToSave.length === 0) {
      Alert.alert('Empty Workout', 'You need to complete at least one set to save the workout.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        routine: routineId || undefined,
        startedAt: new Date(Date.now() - elapsedTime * 1000).toISOString(),
        durationSeconds: elapsedTime,
        exercises: exercisesToSave,
        date: new Date().toISOString()
      }
      
      await api.startWorkout(payload)
      setIsActive(false)
      Alert.alert('Workout Saved!', 'Great job!', [
        { text: 'OK', onPress: () => navigation.navigate('Routines') }
      ])
    } catch (err) {
      Alert.alert('Error', 'Failed to save workout.')
    } finally {
      setSaving(false)
    }
  }

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  const getMuscle = (e: any) => {
    if (!e) return null;
    const val = e.bodyPart || (e.muscleGroup && (typeof e.muscleGroup === 'object' ? e.muscleGroup.name : e.muscleGroup));
    return typeof val === 'string' ? capitalize(val) : null;
  }
  
  const getEquipment = (e: any) => {
    if (!e) return null;
    let val = '';
    if (typeof e.equipment === 'string') val = e.equipment;
    else if (Array.isArray(e.equipment)) {
      const eq = e.equipment[0];
      if (typeof eq === 'string') val = eq;
      else if (eq && typeof eq === 'object' && eq.name) val = eq.name;
      else if (typeof eq === 'object') val = 'Machine';
    }
    else if (e.equipment && typeof e.equipment === 'object' && e.equipment.name) val = e.equipment.name;
    return val ? capitalize(val) : null;
  }

  const uniqueMuscles = ['All', ...Array.from(new Set(availableExercises.map(getMuscle).filter(Boolean)))]
  const uniqueEquipment = ['All', ...Array.from(new Set(availableExercises.map(getEquipment).filter(Boolean)))]

  const filteredExercises = availableExercises.filter(e => {
    const m = getMuscle(e);
    const eq = getEquipment(e);
    const matchMuscle = muscleFilter === 'All' || m === muscleFilter;
    const matchEquipment = equipmentFilter === 'All' || eq === equipmentFilter;
    return matchMuscle && matchEquipment;
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollArea} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>Loading...</Text>
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
                    const rowBg = isChecked ? 'rgba(255, 90, 0, 0.05)' : 'transparent'
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

      {/* Active Rest Timer Banner */}
      {activeRestTimer && remainingRest > 0 && (
        <View style={styles.restBanner}>
          <View style={[styles.restProgressBar, { width: `${(remainingRest / activeRestTimer.duration) * 100}%` }]} />
          <View style={styles.restBannerInner}>
            <Pressable style={styles.restBtn} onPress={() => setRemainingRest(r => Math.max(0, r - 15))}>
              <Text style={styles.restBtnText}>-15</Text>
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.restBannerLabel}>RESTING</Text>
              <Text style={styles.restBannerTime}>{formatTime(remainingRest)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.restBtn} onPress={() => {
                 setActiveRestTimer(prev => prev ? { ...prev, endTime: prev.endTime + 15000 } : null)
                 setRemainingRest(r => r + 15)
              }}>
                <Text style={styles.restBtnText}>+15</Text>
              </Pressable>
              <Pressable style={[styles.restBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={() => setActiveRestTimer(null)}>
                <Text style={[styles.restBtnText, { color: theme.colors.background }]}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable 
          style={[styles.finishBtn, saving && { opacity: 0.7 }]} 
          onPress={handleFinishWorkout}
          disabled={saving}
        >
          <Text style={styles.finishBtnText}>{saving ? 'Saving...' : 'Finish Workout'}</Text>
        </Pressable>
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
              <Text style={[styles.sheetOptionText, { color: '#F87171' }]}>Delete Set</Text>
              <Feather name="trash-2" size={20} color="#F87171" />
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
                  <Pressable hitSlop={15}><Feather name="plus" size={24} color={theme.colors.text} /></Pressable>
                  <Pressable hitSlop={15} onPress={closeAddExerciseDrawer}><Feather name="x" size={24} color={theme.colors.text} /></Pressable>
                </View>
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
                  <Pressable style={styles.exerciseListItem} onPress={() => handleSelectExercise(e)}>
                    <View>
                      <Text style={styles.exListTitle}>{e.name || e.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={styles.exListMeta}>{getMuscle(e) || 'Other'}</Text>
                        {getEquipment(e) && (
                          <View style={styles.machineBadge}>
                            <Text style={styles.machineBadgeText}>{getEquipment(e)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
                  </Pressable>
                  <View style={[styles.sheetDivider, { marginHorizontal: 0 }]} />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 1 },
  timerValue: { fontSize: 22, fontWeight: '800', color: theme.colors.primary, fontFamily: 'monospace' },
  
  scrollArea: { padding: 16, paddingBottom: 85, flexGrow: 1 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { color: theme.colors.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.colors.surfaceVariant, borderRadius: 12 },
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

  addExerciseCardBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#484550', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 0 },
  addExerciseCardText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '700' },

  restBanner: { position: 'absolute', bottom: 85, left: 0, right: 0, backgroundColor: '#1A1A1A', borderTopWidth: 1, borderTopColor: theme.colors.borderLight, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  restProgressBar: { height: 3, backgroundColor: theme.colors.primary, position: 'absolute', top: 0, left: 0 },
  restBannerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  restBtn: { backgroundColor: theme.colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderLight },
  restBtnText: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  restBannerLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  restBannerTime: { color: theme.colors.primary, fontSize: 24, fontWeight: '800', fontFamily: 'monospace' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 16, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  finishBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  finishBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },

  modalBgTransparent: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.borderLight, borderBottomWidth: 0 },
  bottomSheetDragHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderInput, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  sheetDivider: { height: 1, backgroundColor: '#38383A', marginHorizontal: -24 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  sheetOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },

  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#484550', marginRight: 8 },
  filterChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  filterChipText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  filterChipTextActive: { color: theme.colors.primary },
  
  exerciseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  exListTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  exListMeta: { color: theme.colors.textMuted, fontSize: 12 },
  machineBadge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  machineBadgeText: { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
})
