import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import api from '../../../api'
import { theme } from '../../../theme'

export default function RoutineDetails({ route }: any) {
  const navigation = useNavigation<any>()
  const { id } = route.params || {}
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routine, setRoutine] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])

  useFocusEffect(
    React.useCallback(() => {
      if (!id) return
      api.customFetch(`/custom/routines/${id}`)
        .then((data: any) => {
          setRoutine(data)
          setExercises(data.exercises || [])
        })
        .catch((err: any) => setError(err.message))
        .finally(() => setLoading(false))
    }, [id])
  )

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (error || !routine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.error }}>{error || 'Routine not found'}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Routine Details</Text>
        <Pressable onPress={() => navigation.navigate('EditRoutine', { id })} style={styles.editBtn}>
          <Feather name="edit-2" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.routineName}>{routine.name}</Text>
          {routine.description && <Text style={styles.routineDesc}>{routine.description}</Text>}
          
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <View style={styles.metricLabelRow}>
                <Feather name="list" size={14} color={theme.colors.primary} />
                <Text style={styles.metricLabel}>EXERCISES</Text>
              </View>
              <Text style={styles.metricValue}>{exercises.length}</Text>
            </View>

            <View style={styles.metricBox}>
              <View style={styles.metricLabelRow}>
                <MaterialCommunityIcons name="dumbbell" size={14} color={theme.colors.primary} />
                <Text style={styles.metricLabel}>TOTAL SETS</Text>
              </View>
              <Text style={styles.metricValue}>{totalSets}</Text>
            </View>

            <View style={styles.metricBox}>
              <View style={styles.metricLabelRow}>
                <Feather name="clock" size={14} color={theme.colors.primary} />
                <Text style={styles.metricLabel}>EST. TIME</Text>
              </View>
              <Text style={styles.metricValue}>~45m</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>WORKOUT PLAN</Text>

        {exercises.map((ex, index) => {
          let normalCount = 0
          return (
            <View key={ex.id || index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </View>
              
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'left' }]}>Set</Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>kg</Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Reps</Text>
                </View>
                {ex.sets?.map((set: any, sIdx: number) => {
                  let setLabel = set.type
                  if (set.type === 'N') {
                    normalCount++
                    setLabel = normalCount.toString()
                  }
                  
                  // Label styling based on set type
                  let labelColor = theme.colors.textMuted
                  if (set.type === 'W' || set.type === 'Working') {
                    labelColor = theme.colors.primary
                  } else if (set.type === 'D' || set.type === 'Drop') {
                    labelColor = theme.colors.error
                  }
                  
                  return (
                    <View key={set.id || sIdx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'left', fontWeight: 'bold', color: labelColor }]}>
                        {setLabel}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{set.weight || '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{set.reps || '-'}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.startBtn} onPress={() => navigation.navigate('Workout', { routineId: id })}>
          <Feather name="play" size={20} color={theme.colors.background} />
          <Text style={styles.startBtnText}>Start Workout</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { padding: 8, marginLeft: -8 },
  editBtn: { padding: 8, marginRight: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  
  scrollContent: { padding: 16, paddingBottom: 120 },
  
  titleSection: { marginBottom: 32 },
  routineName: { fontSize: 32, fontWeight: '700', color: theme.colors.text, textTransform: 'uppercase', marginBottom: 8 },
  routineDesc: { fontSize: 16, color: theme.colors.textMuted, marginBottom: 24 },
  
  metricsRow: { flexDirection: 'row', gap: 24 },
  metricBox: { flex: 1 },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metricLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
  metricValue: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
  
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, letterSpacing: 1, marginBottom: 16 },
  
  exerciseCard: { backgroundColor: theme.colors.background, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16, overflow: 'hidden' },
  exerciseHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  exerciseName: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  
  table: { paddingTop: 8 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  tableHeaderText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16 },
  tableCell: { color: theme.colors.text, fontSize: 15, textAlign: 'center' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, gap: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  startBtnText: { color: theme.colors.background, fontSize: 18, fontWeight: '700' }
})
