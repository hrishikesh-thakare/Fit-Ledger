import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Navigation from "./src/navigation";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { Text, TextInput } from "react-native";

// Industry Standard: Cap global font scaling to prevent fixed-layout breakage on large accessibility sizes
interface ComponentWithDefaultProps {
  defaultProps?: { maxFontSizeMultiplier?: number };
}
const TextAny = Text as unknown as ComponentWithDefaultProps;
TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.maxFontSizeMultiplier = 1.3;

const TextInputAny = TextInput as unknown as ComponentWithDefaultProps;
TextInputAny.defaultProps = TextInputAny.defaultProps || {};
TextInputAny.defaultProps.maxFontSizeMultiplier = 1.3;

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
