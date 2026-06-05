import React, { useState, useEffect } from 'react'
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../api'
import { theme } from '../../theme'

export default function Workout() {
  const [running, setRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [activeExercise, setActiveExercise] = useState('Bench Press')

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (running) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [running])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    if (running) {
      setRunning(false)
      setElapsedTime(0)
      return
    }
    setRunning(true)
    try {
      await api.startWorkout({ startedAt: Date.now() })
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Workout</Text>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>DURATION</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {!running ? (
          <View style={styles.emptyState}>
            <Text style={styles.hint}>Ready to crush it?</Text>
            <Text style={styles.subHint}>Start an empty workout to log sets on the fly.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{activeExercise}</Text>
                <Pressable hitSlop={10}><Text style={styles.menuIcon}>⋮</Text></Pressable>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.5 }]}>SET</Text>
                <Text style={[styles.th, { flex: 1 }]}>KG</Text>
                <Text style={[styles.th, { flex: 1 }]}>REPS</Text>
                <Text style={[styles.th, { flex: 0.5, textAlign: 'right' }]}>✓</Text>
              </View>

              {[1, 2, 3].map((setNum) => (
                <View key={setNum} style={styles.tableRow}>
                  <Text style={[styles.tdSet, { flex: 0.5 }]}>{setNum}</Text>
                  <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.tdVal}>60.0</Text>
                  </View>
                  <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.tdVal}>10</Text>
                  </View>
                  <View style={[styles.checkCircle, { flex: 0.5 }]}></View>
                </View>
              ))}

              <Pressable style={styles.addSetButton}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>

            <Pressable style={styles.addExerciseBtn}>
              <Text style={styles.addExerciseText}>+ Add Exercise</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.button, { backgroundColor: running ? theme.colors.error : theme.colors.primary }]} 
          onPress={handleStart}
        >
          <Text style={[styles.buttonText, { color: running ? theme.colors.text : theme.colors.background }]}>
            {running ? 'Finish Workout' : 'Start Empty Workout'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text },
  timerBox: { alignItems: 'flex-end' },
  timerLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1 },
  timerValue: { fontSize: 22, fontWeight: '700', color: theme.colors.primary, fontFamily: 'monospace' },
  scrollArea: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { color: theme.colors.text, fontSize: 22, fontWeight: '500', marginBottom: 8 },
  subHint: { color: theme.colors.textMuted, fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: theme.colors.background, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  cardTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  menuIcon: { color: theme.colors.textMuted, fontSize: 20, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  th: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  tdSet: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '700' },
  tdVal: { color: theme.colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  inputBox: { backgroundColor: theme.colors.surfaceElevated, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  checkCircle: { height: 32, width: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceElevated, borderWidth: 2, borderColor: theme.colors.border, alignSelf: 'flex-end' },
  addSetButton: { padding: 16, alignItems: 'center' },
  addSetText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
  addExerciseBtn: { padding: 16, alignItems: 'center', borderRadius: 16, backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: 'rgba(255, 90, 0, 0.3)' },
  addExerciseText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontWeight: '700', fontSize: 16 },
})
