import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, Modal, Switch, ActivityIndicator, ScrollView, TouchableWithoutFeedback } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '../contexts/ThemeContext'
import api from '../api'
import { Toast } from './CustomToast'

interface CreateExerciseModalProps {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

const EQUIPMENT_OPTIONS = [
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Machine', value: 'machine' },
  { label: 'Cable', value: 'cable' },
  { label: 'Smith Machine', value: 'smith_machine' },
  { label: 'Bodyweight', value: 'bodyweight' },
]

export function CreateExerciseModal({ visible, onClose, onCreated }: CreateExerciseModalProps) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [name, setName] = useState('')
  const [muscleGroupId, setMuscleGroupId] = useState<string | number>('')
  const [muscleGroupLabel, setMuscleGroupLabel] = useState<string>('')
  const [equipment, setEquipment] = useState<string>('')
  const [equipmentLabel, setEquipmentLabel] = useState<string>('')

  const [muscleGroups, setMuscleGroups] = useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dropdown states
  const [showMuscleDropdown, setShowMuscleDropdown] = useState(false)
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false)

  useEffect(() => {
    if (visible) {
      setName('')
      setMuscleGroupId('')
      setMuscleGroupLabel('')
      setEquipment('')
      setEquipmentLabel('')
      
      setLoadingGroups(true)
      api.fetchMuscleGroups()
        .then((data: any) => {
          setMuscleGroups(data)
        })
        .catch(console.error)
        .finally(() => setLoadingGroups(false))
    } else {
      setMuscleGroups([])
    }
  }, [visible])

  const handleCreate = async () => {
    if (!name.trim()) return Toast.show('Exercise Name is required', 'error')
    if (!muscleGroupId) return Toast.show('Muscle Group is required', 'error')

    setIsSubmitting(true)
    try {
      await api.createExercise({
        name: name.trim(),
        muscleGroupId,
        equipment: equipment || undefined
      })
      Toast.show('Custom exercise created!', 'success')
      onCreated()
      onClose()
    } catch (err: any) {
      Toast.show(err.message || 'Failed to create exercise', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Create Custom Exercise</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Exercise Name"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Muscle Group Dropdown */}
          <View style={styles.inputContainer}>
            <Pressable 
              style={styles.dropdownButton} 
              onPress={() => { setShowMuscleDropdown(true); setShowEquipmentDropdown(false) }}
            >
              <Text style={[styles.dropdownButtonText, !muscleGroupLabel && { color: theme.colors.textMuted }]}>
                {muscleGroupLabel || 'Muscle Group'}
              </Text>
              <Feather name="chevron-down" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Equipment Dropdown */}
          <View style={styles.inputContainer}>
            <Pressable 
              style={styles.dropdownButton} 
              onPress={() => { setShowEquipmentDropdown(true); setShowMuscleDropdown(false) }}
            >
              <Text style={[styles.dropdownButtonText, !equipmentLabel && { color: theme.colors.textMuted }]}>
                {equipmentLabel || 'Equipment (Optional)'}
              </Text>
              <Feather name="chevron-down" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>



          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.createBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.createBtnText}>Create</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Nested Modals for Dropdowns */}
        
        {/* Muscle Group Selection Modal */}
        <Modal visible={showMuscleDropdown} transparent animationType="fade" onRequestClose={() => setShowMuscleDropdown(false)}>
          <TouchableWithoutFeedback onPress={() => setShowMuscleDropdown(false)}>
            <View style={styles.dropdownOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownContent}>
                  <Text style={styles.dropdownTitle}>Select Muscle Group</Text>
                  {loadingGroups ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
                  ) : (
                    <ScrollView style={{ maxHeight: 300 }}>
                      {muscleGroups.map(mg => (
                        <Pressable 
                          key={mg.id} 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setMuscleGroupId(mg.id)
                            setMuscleGroupLabel(mg.name)
                            setShowMuscleDropdown(false)
                          }}
                        >
                          <Text style={[styles.dropdownItemText, muscleGroupId === mg.id && { color: theme.colors.primary }]}>{mg.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Equipment Selection Modal */}
        <Modal visible={showEquipmentDropdown} transparent animationType="fade" onRequestClose={() => setShowEquipmentDropdown(false)}>
          <TouchableWithoutFeedback onPress={() => setShowEquipmentDropdown(false)}>
            <View style={styles.dropdownOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownContent}>
                  <Text style={styles.dropdownTitle}>Select Equipment</Text>
                  <ScrollView style={{ maxHeight: 300 }}>
                    <Pressable 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setEquipment('')
                        setEquipmentLabel('None')
                        setShowEquipmentDropdown(false)
                      }}
                    >
                      <Text style={[styles.dropdownItemText, equipment === '' && { color: theme.colors.primary }]}>None</Text>
                    </Pressable>
                    {EQUIPMENT_OPTIONS.map(eq => (
                      <Pressable 
                        key={eq.value} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEquipment(eq.value)
                          setEquipmentLabel(eq.label)
                          setShowEquipmentDropdown(false)
                        }}
                      >
                        <Text style={[styles.dropdownItemText, equipment === eq.value && { color: theme.colors.primary }]}>{eq.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </View>
    </Modal>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceDropdown,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.text,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 40,
  },
  dropdownContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 8,
    maxHeight: '80%',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMuted,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text,
  }
})
