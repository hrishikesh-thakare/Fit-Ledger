import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
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
          height: 68 + insets.bottom,
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
          if (route.name === 'Dashboard') iconName = 'view-dashboard'
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
    </Stack.Navigator>
  )
}

function NavigationContent() {
  const { signedIn } = useAuth()

  if (signedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer theme={{
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
          <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }, tabBarActiveTintColor: theme.colors.primary }}>
            <Tab.Screen name="Login" options={{ tabBarStyle: { display: 'none' } }}>
              {() => <Login />}
            </Tab.Screen>
            <Tab.Screen name="SignUp" options={{ tabBarStyle: { display: 'none' } }}>
              {() => <SignUp />}
            </Tab.Screen>
          </Tab.Navigator>
        )}
        <CustomAlertRenderer />
      </NavigationContainer>
    </View>
  )
}

export default function Navigation() {
  return (
    <AuthProvider>
      <NavigationContent />
    </AuthProvider>
  )
}
