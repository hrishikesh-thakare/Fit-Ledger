import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Modal, Animated, PanResponder, Keyboard, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { CustomAlert as Alert } from '../../../../components/CustomAlert'
import { theme } from '../../../../theme'
import api from '../../../../api'

export default function EditRoutine({ route }: any) {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { id } = route.params || {}
  
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const kws = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true))
    const kds = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const kwh = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
    const kdh = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => {
      kws.remove()
      kds.remove()
      kwh.remove()
      kdh.remove()
    }
  }, [])
  
  const [routine, setRoutine] = useState<any>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const hasUnsavedChanges = useRef(false)
  
  const scrollRef = useRef<ScrollView>(null)
  const cardYPositions = useRef<Record<number, number>>({})

  const handleFocusInput = (idx: number) => {
    const y = cardYPositions.current[idx]
    if (typeof y === 'number') {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: y - 12, animated: true })
      }, 150)
    }
  }
  const [showReorderModal, setShowReorderModal] = useState(false)
  const [selectedSet, setSelectedSet] = useState<{ exIdx: number, sIdx: number, type: string } | null>(null)

  // Add Exercise State
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [showAddExerciseDrawer, setShowAddExerciseDrawer] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [equipmentFilter, setEquipmentFilter] = useState('All')
  
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

  useEffect(() => {
    if (showAddExerciseDrawer) {
      if (availableExercises.length === 0) {
        api.fetchExercises().then((data: any) => setAvailableExercises(data || [])).catch(console.error)
      }
      addExPanY.setValue(800)
      Animated.spring(addExPanY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start()
    }
  }, [showAddExerciseDrawer])

  const closeAddExerciseDrawer = () => {
    Animated.timing(addExPanY, { toValue: 800, duration: 250, useNativeDriver: true }).start(() => {
      setShowAddExerciseDrawer(false)
    })
  }

  const handleSelectExercise = (exercise: any) => {
    const newRoutine = { ...routine }
    newRoutine.exercises.push({
      id: Math.random().toString(),
      exerciseId: exercise.id,
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      sets: [{ id: Math.random().toString(), type: 'Normal', weight: '', reps: '' }]
    })
    setRoutine(newRoutine)
    hasUnsavedChanges.current = true
    closeAddExerciseDrawer()
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

  const setOptionsPanY = useRef(new Animated.Value(500)).current
  const setOptionsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) setOptionsPanY.setValue(gestureState.dy)
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(setOptionsPanY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true
          }).start(() => setSelectedSet(null))
        } else {
          Animated.spring(setOptionsPanY, { toValue: 0, useNativeDriver: true }).start()
        }
      }
    })
  ).current

  useEffect(() => {
    if (selectedSet) {
      setOptionsPanY.setValue(500)
      Animated.spring(setOptionsPanY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10
      }).start()
    }
  }, [selectedSet])

  useEffect(() => {
    if (id) {
      api.fetchRoutine(id).then((data: any) => {
        setRoutine(data)
        setName(data.name || data.title || '')
        hasUnsavedChanges.current = false
      }).catch((err: any) => console.error(err))
    }
  }, [id])

  // Intercept the back button action if there are unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges.current) return;
      
      e.preventDefault();
      
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsubscribe;
  }, [navigation]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Routine name is required')
    setSaving(true)
    try {
      const exercisesToSave = routine.exercises.map((ex: any, index: number) => ({
        id: String(ex.id).includes('.') ? undefined : ex.id, // Skip temp ids
        exerciseId: ex.exerciseId || ex.exercise?.id || ex.id,
        sets: ex.sets.map((set: any, setIdx: number) => ({
          id: String(set.id).includes('.') ? undefined : set.id,
          type: set.type === 'Warmup' || set.type === 'W' ? 'W' : set.type === 'Drop' || set.type === 'D' ? 'D' : 'N',
          weight: set.weight ? Number(set.weight) : 0,
          reps: set.reps ? Number(set.reps) : 0,
          setOrder: setIdx,
        })),
        order: index,
      }))

      await api.updateRoutine(id, { name, exercises: exercisesToSave })
      hasUnsavedChanges.current = false // Disable unsaved changes blocker
      setTimeout(() => navigation.goBack(), 0)
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save routine')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRoutine = () => {
    Alert.alert('Delete Routine', 'Are you sure you want to delete this routine entirely?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteRoutine(id)
          hasUnsavedChanges.current = false // Bypass beforeRemove lock
          setTimeout(() => navigation.navigate('MainTabs', { screen: 'Routines' }), 0)
        } catch (err) {
          Alert.alert('Error', 'Failed to delete routine')
        }
      }}
    ])
  }

  const handleMoreOptions = () => {
    setShowReorderModal(true)
  }

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...routine.exercises];
    const ex = updatedExercises[exerciseIndex];
    const lastSet = ex.sets?.[ex.sets?.length - 1];
    
    ex.sets = [...(ex.sets || []), {
      id: Math.random().toString(),
      type: 'N',
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : ''
    }];
    
    setRoutine({ ...routine, exercises: updatedExercises });
    hasUnsavedChanges.current = true;
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise from the routine?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const updatedExercises = [...routine.exercises];
        updatedExercises.splice(exerciseIndex, 1);
        setRoutine({ ...routine, exercises: updatedExercises });
        hasUnsavedChanges.current = true;
      }}
    ])
  }

  const handleUpdateSet = (exIdx: number, sIdx: number, field: string, value: string) => {
    const newRoutine = { ...routine }
    newRoutine.exercises[exIdx].sets[sIdx][field] = value
    setRoutine(newRoutine)
    hasUnsavedChanges.current = true
  }

  const closeSetOptions = (callback?: () => void) => {
    Animated.timing(setOptionsPanY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => {
      setSelectedSet(null)
      if (callback) callback()
    })
  }

  const handleChangeSetType = (type: string) => {
    if (!selectedSet) return
    const newRoutine = { ...routine }
    newRoutine.exercises[selectedSet.exIdx].sets[selectedSet.sIdx].type = type
    setRoutine(newRoutine)
    hasUnsavedChanges.current = true
    closeSetOptions()
  }

  const handleRemoveSet = () => {
    if (!selectedSet) return
    const newRoutine = { ...routine }
    newRoutine.exercises[selectedSet.exIdx].sets.splice(selectedSet.sIdx, 1)
    setRoutine(newRoutine)
    hasUnsavedChanges.current = true
    closeSetOptions()
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routine.exercises.length - 1) return;
    
    const newExercises = [...routine.exercises];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newExercises[index];
    newExercises[index] = newExercises[swapIndex];
    newExercises[swapIndex] = temp;
    
    setRoutine({ ...routine, exercises: newExercises });
    hasUnsavedChanges.current = true;
  }

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 50 }}>Loading...</Text>
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
          <Text style={styles.headerTitle}>Edit Routine</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Pressable hitSlop={10} onPress={handleDeleteRoutine} style={{ marginLeft: 16 }}>
            <Feather name="trash-2" size={20} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable hitSlop={10} onPress={handleMoreOptions} style={{ marginLeft: 16 }}>
            <Feather name="more-vertical" size={20} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={[styles.scrollArea, keyboardVisible && { paddingBottom: 300 }]} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Floating Label Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputLegend}>
            <Text style={styles.inputLegendText}>Routine Name</Text>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => { setName(t); hasUnsavedChanges.current = true; }}
            placeholder="Routine Name"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Exercises Section Header */}
        <View style={styles.exercisesHeader}>
          <Text style={styles.sectionTitle}>EXERCISES</Text>
          <Pressable hitSlop={10} style={styles.addExerciseBtn} onPress={() => setShowAddExerciseDrawer(true)}>
            <Feather name="plus" size={18} color={theme.colors.primary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>
        </View>

        {/* Exercise Cards */}
        {routine.exercises?.map((ex: any, idx: number) => {
          let normalCount = 0;
          return (
            <View 
              key={ex.id || idx} 
              style={styles.exerciseCard}
              onLayout={(e) => {
                cardYPositions.current[idx] = e.nativeEvent.layout.y
              }}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={styles.exName}>{ex.exercise?.name || ex.name || 'Unknown'}</Text>
                  <View style={styles.machineBadge}>
                    <Text style={styles.machineBadgeText}>{getEquipment(ex.exercise || ex) || 'Machine'}</Text>
                  </View>
                </View>
                <Pressable hitSlop={10} onPress={() => handleRemoveExercise(idx)}>
                  <Feather name="trash-2" size={18} color={theme.colors.textMuted} />
                </Pressable>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1, textAlign: 'left' }]}>Set</Text>
                <Text style={[styles.th, { flex: 2 }]}>kg</Text>
                <Text style={[styles.th, { flex: 2 }]}>Reps</Text>
              </View>

              {/* Table Rows */}
              {ex.sets?.map((set: any, sIdx: number) => {
                let setLabel = set.type
                let labelColor = theme.colors.text
                let labelBg = 'transparent'
                
                if (set.type === 'Warmup' || set.type === 'W' || set.type === 'Warm Up') {
                  setLabel = 'W'
                  labelColor = '#D97706' // Orange
                  labelBg = '#2A1F16'
                } else if (set.type === 'Drop' || set.type === 'D' || set.type === 'Drop Set') {
                  setLabel = 'D'
                  labelColor = '#60A5FA' // Blue
                  labelBg = '#1E293B'
                } else {
                  normalCount++
                  setLabel = normalCount.toString()
                  labelColor = theme.colors.text
                  labelBg = 'transparent'
                }

                return (
                  <View key={set.id || sIdx} style={styles.tableRow}>
                    <View style={{ flex: 1, alignItems: 'flex-start' }}>
                      <Pressable 
                        hitSlop={10}
                        onPress={() => setSelectedSet({ exIdx: idx, sIdx, type: set.type || 'Normal' })}
                        style={{ width: 24, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text style={{ color: labelColor, fontWeight: '700', fontSize: 13 }}>{setLabel}</Text>
                      </Pressable>
                    </View>
                    <TextInput 
                      style={[styles.td, styles.tableInput, { flex: 2 }]} 
                      value={set.weight ? String(set.weight) : ''} 
                      onChangeText={(val) => handleUpdateSet(idx, sIdx, 'weight', val)}
                      keyboardType="numeric"
                      placeholder="-"
                      placeholderTextColor={theme.colors.textMuted}
                      onFocus={() => handleFocusInput(idx)}
                    />
                    <TextInput 
                      style={[styles.td, styles.tableInput, { flex: 2 }]} 
                      value={set.reps ? String(set.reps) : ''} 
                      onChangeText={(val) => handleUpdateSet(idx, sIdx, 'reps', val)}
                      keyboardType="numeric"
                      placeholder="-"
                      placeholderTextColor={theme.colors.textMuted}
                      onFocus={() => handleFocusInput(idx)}
                    />
                  </View>
                )
              })}

              {/* Add Set Button */}
              <Pressable style={styles.addSetBtn} onPress={() => handleAddSet(idx)}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          )
        })}
      </ScrollView>

      {/* Floating Update Button */}
      {!keyboardVisible && (
        <View style={[styles.footer, { paddingBottom: 28 }]}>
          <Pressable 
            style={[styles.updateBtn, saving && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={saving}
          >
            <Text style={styles.updateBtnText}>{saving ? 'Updating...' : 'Update Routine'}</Text>
          </Pressable>
        </View>
      )}

      {/* Reorder Exercises Modal */}
      <Modal visible={showReorderModal} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.reorderCard}>
            <Text style={styles.reorderTitle}>Reorder Exercises</Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {routine?.exercises?.map((ex: any, idx: number) => (
                <View key={ex.id || idx} style={styles.reorderItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="drag-horizontal" size={24} color={theme.colors.textMuted} style={{ marginRight: 16 }} />
                    <Text style={styles.reorderItemText}>{ex.exercise?.name || ex.name || 'Unknown'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable hitSlop={10} onPress={() => moveExercise(idx, 'up')} disabled={idx === 0}>
                      <Feather name="chevron-up" size={24} color={idx === 0 ? '#484550' : theme.colors.textMuted} />
                    </Pressable>
                    <Pressable hitSlop={10} onPress={() => moveExercise(idx, 'down')} disabled={idx === routine.exercises.length - 1}>
                      <Feather name="chevron-down" size={24} color={idx === routine.exercises.length - 1 ? '#484550' : theme.colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Pressable hitSlop={15} onPress={() => setShowReorderModal(false)} style={styles.reorderDoneBtn}>
              <Text style={styles.reorderDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Set Options Modal */}
      <Modal visible={!!selectedSet} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
        <View style={styles.modalBgTransparent}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSetOptions()} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: setOptionsPanY }] }]}>
            <View {...setOptionsPanResponder.panHandlers} style={{ paddingBottom: 16, backgroundColor: 'transparent' }}>
              <View style={styles.bottomSheetDragHandle} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sheetTitle}>Set Options</Text>
                <Pressable hitSlop={15} onPress={() => closeSetOptions()}>
                  <Feather name="x" size={24} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={styles.sheetDivider} />
            
            <Pressable style={styles.sheetOption} onPress={() => handleChangeSetType('Normal')}>
              <Text style={styles.sheetOptionText}>Normal Set</Text>
              {(!selectedSet?.type || selectedSet?.type === 'Normal' || selectedSet?.type === 'N') && <Feather name="check" size={20} color={theme.colors.text} />}
            </Pressable>
            <View style={styles.sheetDivider} />

            <Pressable style={styles.sheetOption} onPress={() => handleChangeSetType('Warmup')}>
              <Text style={styles.sheetOptionText}>Warm Up</Text>
              {(selectedSet?.type === 'Warmup' || selectedSet?.type === 'W' || selectedSet?.type === 'Warm Up') && <Feather name="check" size={20} color={theme.colors.text} />}
            </Pressable>
            <View style={styles.sheetDivider} />

            <Pressable style={styles.sheetOption} onPress={() => handleChangeSetType('Drop')}>
              <Text style={styles.sheetOptionText}>Drop Set</Text>
              {(selectedSet?.type === 'Drop' || selectedSet?.type === 'D' || selectedSet?.type === 'Drop Set') && <Feather name="check" size={20} color={theme.colors.text} />}
            </Pressable>
            <View style={styles.sheetDivider} />

            <Pressable style={styles.sheetOption} onPress={handleRemoveSet}>
              <Text style={[styles.sheetOptionText, { color: '#F87171' }]}>Delete Set</Text>
              <Feather name="trash-2" size={20} color="#F87171" />
            </Pressable>
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

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  
  scrollArea: { padding: 16, paddingBottom: 90 }, // Decreased paddingBottom
  
  // Floating Label Input Style
  inputContainer: { marginTop: 8, marginBottom: 24, position: 'relative' },
  inputLegend: { position: 'absolute', top: -10, left: 12, backgroundColor: theme.colors.background, paddingHorizontal: 4, zIndex: 1 },
  inputLegendText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, fontSize: 16, color: theme.colors.text, fontWeight: '500' },

  exercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addExerciseText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },

  // Exercise Card
  exerciseCard: { backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  exName: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginRight: 8 },
  machineBadge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  machineBadgeText: { color: theme.colors.primary, fontSize: 10, fontWeight: '700' },
  
  // Table
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  th: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14 },
  td: { color: theme.colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  
  // Add Set Button
  addSetBtn: { borderTopWidth: 1, borderTopColor: theme.colors.borderLight, paddingVertical: 14, alignItems: 'center', backgroundColor: theme.colors.surfaceVariant },
  addSetText: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },

  // Footer Button
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  updateBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  updateBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: '700' },

  // Reorder Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  reorderCard: { backgroundColor: '#36343B', width: '100%', borderRadius: 24, padding: 24 },
  reorderTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 24 },
  reorderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2A282E', borderWidth: 1, borderColor: '#484550', borderRadius: 24, padding: 16, marginBottom: 12 },
  reorderItemText: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  reorderDoneBtn: { alignSelf: 'flex-end', marginTop: 12, padding: 8, paddingRight: 0 },
  reorderDoneText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  // Set Inputs
  tableInput: { padding: 0, margin: 0, textAlign: 'center' },

  // Bottom Sheet Modal
  modalBgTransparent: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48, borderWidth: 1, borderColor: theme.colors.borderLight, borderBottomWidth: 0 },
  bottomSheetDragHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderInput, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  sheetDivider: { height: 1, backgroundColor: '#38383A', marginHorizontal: -24 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  sheetOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },

  // Select Exercise Filters
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#484550', marginRight: 8 },
  filterChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  filterChipText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  filterChipTextActive: { color: theme.colors.primary },
  
  // Exercise List Item
  exerciseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  exListTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  exListMeta: { color: theme.colors.textMuted, fontSize: 12 },
})
