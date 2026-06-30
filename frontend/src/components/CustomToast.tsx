import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastConfig = {
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
};

let setToastConfigGlobal: ((config: ToastConfig | null) => void) | null = null;

export const CustomToastRenderer = () => {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const insetsRef = useRef(insets.top);
  useEffect(() => {
    insetsRef.current = insets.top;
  }, [insets.top]);

  useEffect(() => {
    setToastConfigGlobal = (newConfig) => {
      setConfig(newConfig);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (newConfig) {
        // Reset translateY to the final position instantly so it doesn't slide
        translateY.setValue(insetsRef.current + 10);
        
        // Show animation (fade in and slight scale)
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();

        // Auto hide
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, newConfig.duration || 3000);
      }
    };

    return () => {
      setToastConfigGlobal = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hideToast = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setConfig(null);
      translateY.setValue(-100);
    });
  };

  if (!config) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]} pointerEvents="box-none">
      <View style={styles.toastBox}>
        <Feather name="info" size={20} color={theme.colors.background} style={styles.icon} />
        <Text style={styles.message}>{config.message}</Text>
        <Pressable onPress={hideToast} hitSlop={10} style={styles.closeBtn}>
          <Feather name="x" size={20} color={theme.colors.background} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

export const Toast = {
  show: (message: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
    if (setToastConfigGlobal) {
      setToastConfigGlobal({ message, type, duration });
    } else {
      console.log('Toast:', message);
    }
  }
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 400,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    marginLeft: 12,
  }
});
