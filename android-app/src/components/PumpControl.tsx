import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PumpControlProps {
  pumpState: number; // 0: Off, 1: On
  onPumpToggle: (targetState: 0 | 1) => void;
}

export const PumpControl: React.FC<PumpControlProps> = ({ pumpState, onPumpToggle }) => {
  const isPumpOn = pumpState === 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Điều Khiển Bơm Tưới</Text>
        <Text style={[styles.statusLabel, { color: isPumpOn ? '#10b981' : '#94a3b8' }]}>
          {isPumpOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        {/* Nút Bật tưới */}
        <TouchableOpacity
          style={[styles.button, styles.btnOn, isPumpOn && styles.btnOnActive]}
          onPress={() => onPumpToggle(1)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>💧</Text>
          <Text style={styles.buttonText}>Bật tưới</Text>
        </TouchableOpacity>

        {/* Nút Tắt tưới */}
        <TouchableOpacity
          style={[styles.button, styles.btnOff, !isPumpOn && styles.btnOffActive]}
          onPress={() => onPumpToggle(0)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>⚡</Text>
          <Text style={styles.buttonText}>Tắt tưới</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnOn: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  btnOnActive: {
    backgroundColor: '#10b981',
  },
  btnOff: {
    backgroundColor: '#451a1a',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnOffActive: {
    backgroundColor: '#ef4444',
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
