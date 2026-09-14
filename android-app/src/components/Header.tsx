import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MQTTConnectionStatus } from '../types/plant';

interface HeaderProps {
  title: string;
  status: MQTTConnectionStatus;
}

export const Header: React.FC<HeaderProps> = ({ title, status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'CONNECTED':
        return { text: 'MQTT: Đã kết nối', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'CONNECTING':
        return { text: 'MQTT: Đang kết nối...', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      case 'DISCONNECTED':
      case 'ERROR':
      default:
        return { text: 'MQTT: Mất kết nối', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.logoIcon}>🪴</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
