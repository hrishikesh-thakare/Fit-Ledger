import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkoutContext } from '../contexts/WorkoutContext'
import { CustomAlert as Alert } from './CustomAlert'
import { Toast } from './CustomToast'

export default function ActiveWorkoutBar({ hasTabBar = true, hasBottomBar = false }: { hasTabBar?: boolean; hasBottomBar?: boolean }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const { isActive, elapsedTime, formatTime, endWorkout, routineId } = useWorkoutContext()
  const navigation = useNavigation() as { navigate: (screen: string, params?: Record<string, unknown>) => void }
  const insets = useSafeAreaInsets()

  if (!isActive) return null

  const handlePress = () => {
    // Navigate back to the active workout
    navigation.navigate('Workout', { routineId })
  }

  const handleDiscard = () => {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard your active workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            endWorkout()
            Toast.show('Workout discarded', 'info')
          }
        }
      ]
    )
  }

  // Calculate bottom position based on screen layout
  const bottomPosition = hasTabBar 
    ? theme.layout.tabBarHeight + (insets.bottom ? insets.bottom + 4 : 10) + 16
    : hasBottomBar 
      ? 96 
      : Math.max(insets.bottom, 16) + 12

  return (
    <View style={[styles.container, { bottom: bottomPosition }]}>
      <Pressable style={styles.pill} onPress={handlePress}>
        <Feather name="chevron-up" size={24} color={theme.colors.primary} />
        
        <View style={styles.centerContent}>
          <Text style={styles.titleText}>Workout In Progress</Text>
        </View>

        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>

        <Pressable hitSlop={15} onPress={handleDiscard} style={styles.deleteBtn}>
          <Feather name="trash-2" size={20} color={theme.colors.primary} />
        </Pressable>
      </Pressable>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  centerContent: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    marginRight: 16,
  },
  deleteBtn: {
    padding: 4,
  }
})
