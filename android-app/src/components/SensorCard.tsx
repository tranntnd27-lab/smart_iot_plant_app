import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SensorCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  type: 'temp' | 'hum' | 'soil' | 'light';
}

export const SensorCard: React.FC<SensorCardProps> = ({ label, value, unit, icon, type }) => {
  const getIconColor = () => {
    switch (type) {
      case 'temp':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      case 'hum':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'soil':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'light':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    }
  };

  const styleConfig = getIconColor();

  // Format value to 1 decimal place if floating point number
  let displayValue: string | number = value;
  if (typeof value === 'number') {
    displayValue = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  } else if (typeof value === 'string' && !isNaN(Number(value))) {
    const num = Number(value);
    displayValue = Number.isInteger(num) ? num : Math.round(num * 10) / 10;
  }

  // Force light unit to % strictly
  const displayUnit = type === 'light' ? '%' : unit;

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: styleConfig.bg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {displayValue} <Text style={styles.unit}>{displayUnit}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 20,
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});
