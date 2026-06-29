import React, { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Dashboard from '../screens/dashboard/page'
import Routines from '../screens/routines/page'
import History from '../screens/history/page'
import Weight from '../screens/bodyweight/page'
import Profile from '../screens/profile/page'
import Login from '../screens/login/page'
import { getToken } from '../auth'
import { theme } from '../theme'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SignUp from '../screens/signup/page'
import WorkoutDetails from '../screens/history/[id]/page'
import { CustomAlertRenderer } from '../components/CustomAlert'
import { CustomToastRenderer } from '../components/CustomToast'

const Tab = createBottomTabNavigator()

function MainTabs() {
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: theme.colors.background, 
          borderTopColor: theme.colors.border, 
          borderTopWidth: 1,
          height: theme.layout.tabBarHeight + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom ? insets.bottom + 4 : 10
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ color }: { color: string }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'help'
          if (route.name === 'Dashboard') iconName = 'chart-bar'
          else if (route.name === 'Routines') iconName = 'dumbbell'
          else if (route.name === 'History') iconName = 'history'
          else if (route.name === 'Weight') iconName = 'scale-bathroom'
          else if (route.name === 'Profile') iconName = 'account'

          return <MaterialCommunityIcons name={iconName} size={28} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Routines" component={Routines} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Weight" component={Weight} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  )
}



const Stack = createNativeStackNavigator()

import RoutineDetails from '../screens/routines/[id]/page'
import EditRoutine from '../screens/routines/[id]/edit/page'
import CreateRoutine from '../screens/routines/new/page'
import Workout from '../screens/workout/page'
import WorkoutSummary from '../screens/workout/summary/page'
import ExerciseHistory from '../screens/exercises/history/page'
import DashboardStatistics from '../screens/dashboard/statistics/page'
import DashboardCalendar from '../screens/dashboard/calendar/page'

function RootStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="WorkoutDetails" component={WorkoutDetails} />
      <Stack.Screen name="RoutineDetails" component={RoutineDetails} />
      <Stack.Screen name="EditRoutine" component={EditRoutine} />
      <Stack.Screen name="CreateRoutine" component={CreateRoutine} />
      <Stack.Screen name="Workout" component={Workout} />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummary} options={{ gestureEnabled: false }} />
      <Stack.Screen name="ExerciseHistory" component={ExerciseHistory} />
      <Stack.Screen name="DashboardStatistics" component={DashboardStatistics} />
      <Stack.Screen name="DashboardCalendar" component={DashboardCalendar} />
    </Stack.Navigator>
  )
}

import { WorkoutProvider } from '../contexts/WorkoutContext'
import ActiveWorkoutBar from '../components/ActiveWorkoutBar'
import { useNavigationContainerRef } from '@react-navigation/core'

function NavigationContent() {
  const { signedIn } = useAuth()
  const navigationRef = useNavigationContainerRef()
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined)

  if (signedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer 
        ref={navigationRef}
        onStateChange={() => {
          setCurrentRoute(navigationRef.getCurrentRoute()?.name)
        }}
        theme={{
          dark: true,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.background,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          }
      }}>
        {signedIn ? (
          <RootStack />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
          </Stack.Navigator>
        )}
        
        {/* Render the active workout bar globally, but hide it if we are actually ON the Workout or WorkoutSummary screen */}
        {signedIn && currentRoute !== 'Workout' && currentRoute !== 'WorkoutSummary' && <ActiveWorkoutBar />}
        
        <CustomAlertRenderer />
        <CustomToastRenderer />
      </NavigationContainer>
    </View>
  )
}

export default function Navigation() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <NavigationContent />
      </WorkoutProvider>
    </AuthProvider>
  )
}
