import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Navigation from "./src/navigation";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";

function RootApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <RootApp />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
