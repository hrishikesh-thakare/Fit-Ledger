import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type AlertButton = {
  text?: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
};

type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

let setAlertConfigGlobal: ((config: AlertConfig | null) => void) | null = null;

export const CustomAlertRenderer = () => {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    setAlertConfigGlobal = setConfig;
    return () => {
      setAlertConfigGlobal = null;
    };
  }, []);

  if (!config) return null;

  const buttons = config.buttons && config.buttons.length > 0 
    ? config.buttons 
    : [{ text: 'OK' }];

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{config.title}</Text>
          {!!config.message && <Text style={styles.modalText}>{config.message}</Text>}
          
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                  ]}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    setConfig(null);
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {btn.text || 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (setAlertConfigGlobal) {
      setAlertConfigGlobal({ title, message, buttons });
    } else {
      // Fallback to native alert if the custom renderer is not mounted yet
      import('react-native').then(({ Alert }) => {
        Alert.alert(title, message, buttons);
      });
    }
  }
};

const getStyles = (theme: any) => StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: 16, padding: 24, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  modalTitle: { ...theme.typography.cardTitle, color: theme.colors.text, marginBottom: 8 },
  modalText: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, minWidth: 80, alignItems: 'center', backgroundColor: theme.colors.primaryLight },
  buttonCancel: { backgroundColor: 'transparent' },
  buttonDestructive: { backgroundColor: theme.colors.error },
  buttonText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  buttonTextCancel: { color: theme.colors.textMuted },
  buttonTextDestructive: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
