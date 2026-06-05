import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../../theme'

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.centerBox}>
        <Text style={styles.comingSoon}>Coming Soon!</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: theme.colors.background },
  title: { fontSize: 28, fontWeight: '400', lineHeight: 36, color: theme.colors.text },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  comingSoon: { fontSize: 20, color: theme.colors.textMuted, fontWeight: '500' },
})
