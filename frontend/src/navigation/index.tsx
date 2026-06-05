import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Dashboard from '../screens/Dashboard'
import Routines from '../screens/Routines'
import History from '../screens/History'
import Weight from '../screens/Weight'
import Profile from '../screens/Profile'
import Login from '../screens/Login'
import { getToken } from '../auth'
import { theme } from '../theme'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom ? insets.bottom : 8
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'help'
          if (route.name === 'Dashboard') iconName = 'view-dashboard'
          else if (route.name === 'Routines') iconName = 'dumbbell'
          else if (route.name === 'History') iconName = 'history'
          else if (route.name === 'Weight') iconName = 'scale-bathroom'
          else if (route.name === 'Profile') iconName = 'account'

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />
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

import SignUp from '../screens/SignUp'
import { CustomAlertRenderer } from '../components/CustomAlert'

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
        <MainTabs />
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
  )
}

export default function Navigation() {
  return (
    <AuthProvider>
      <NavigationContent />
    </AuthProvider>
  )
}
