import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SensorData } from '../types/plant';

interface ChartScreenProps {
  sensorData: SensorData;
}

export const ChartScreen: React.FC<ChartScreenProps> = ({ sensorData }) => {
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h');

  // Mock historical data points based on current live sensor readings
  const currentTemp = typeof sensorData.temp === 'number' && sensorData.temp > 0 ? sensorData.temp : 28.5;
  const currentHum = typeof sensorData.hum === 'number' && sensorData.hum > 0 ? sensorData.hum : 72;
  const currentSoil = typeof sensorData.soil === 'number' && sensorData.soil > 0 ? sensorData.soil : 65;
  const currentLight = typeof sensorData.light === 'number' && sensorData.light > 0 ? sensorData.light : 60;

  const tempPoints = [
    { time: '00:00', temp: Math.max(22, currentTemp - 4.2), hum: Math.min(90, currentHum + 8) },
    { time: '04:00', temp: Math.max(20, currentTemp - 5.5), hum: Math.min(95, currentHum + 12) },
    { time: '08:00', temp: Math.max(25, currentTemp - 1.8), hum: Math.min(85, currentHum + 2) },
    { time: '12:00', temp: Math.min(40, currentTemp + 3.4), hum: Math.max(45, currentHum - 14) },
    { time: '16:00', temp: Math.min(38, currentTemp + 2.1), hum: Math.max(50, currentHum - 8) },
    { time: '20:00', temp: currentTemp, hum: currentHum },
  ];

  const soilLightPoints = [
    { label: '4 ngày trước', soil: Math.min(100, currentSoil - 10), light: Math.min(100, currentLight + 15) },
    { label: '3 ngày trước', soil: Math.min(100, currentSoil - 5), light: Math.min(100, currentLight + 5) },
    { label: '2 ngày trước', soil: Math.min(100, currentSoil + 8), light: Math.max(10, currentLight - 20) },
    { label: 'Hôm qua', soil: Math.min(100, currentSoil + 3), light: Math.min(100, currentLight - 5) },
    { label: 'Hôm nay (Hiện tại)', soil: Math.min(100, currentSoil), light: Math.min(100, currentLight) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Biểu Đồ Theo Dõi</Text>
        <Text style={styles.subtitle}>Xu hướng thay đổi thông số theo thời gian</Text>
      </View>

      {/* Time Filter Buttons */}
      <View style={styles.filterRow}>
        {(['24h', '7d', '30d'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterBtn, timeFilter === filter && styles.filterBtnActive]}
            onPress={() => setTimeFilter(filter)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
              {filter === '24h' ? '24 Giờ' : filter === '7d' ? '7 Ngày' : '30 Ngày'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart 1: Temperature & Air Humidity */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🌡️ Nhiệt Độ & 💧 Độ Ẩm Không Khí</Text>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Nhiệt độ hiện tại</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{Math.round(currentTemp * 10) / 10} °C</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Độ ẩm khí hiện tại</Text>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{Math.round(currentHum * 10) / 10} %</Text>
          </View>
        </View>

        {/* Visual Bar Plot for Temp Points */}
        <View style={styles.barPlotArea}>
          {tempPoints.map((item, index) => {
            const tempHeight = Math.min(100, Math.max(15, (item.temp / 45) * 100));
            const humHeight = Math.min(100, Math.max(15, (item.hum / 100) * 100));
            return (
              <View key={index} style={styles.barCol}>
                <View style={styles.dualBarContainer}>
                  {/* Temp Bar */}
                  <View style={[styles.barItem, { height: `${tempHeight}%`, backgroundColor: '#ef4444' }]} />
                  {/* Hum Bar */}
                  <View style={[styles.barItem, { height: `${humHeight}%`, backgroundColor: '#3b82f6' }]} />
                </View>
                <Text style={styles.barXLabel}>{item.time}</Text>
              </View>
            );
          })}
        </View>

        {/* Chart Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Nhiệt độ (°C)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Độ ẩm khí (%)</Text>
          </View>
        </View>
      </View>

      {/* Chart 2: Soil Moisture & Light Level */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🪴 Độ Ẩm Đất & ☀️ Cường Độ Ánh Sáng</Text>
        </View>

        {/* Progress List */}
        <View style={styles.progressList}>
          {soilLightPoints.map((pt, idx) => (
            <View key={idx} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{pt.label}</Text>

              {/* Soil bar */}
              <View style={styles.progressGroup}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pt.soil}%`, backgroundColor: '#10b981' }]} />
                </View>
                <Text style={styles.progressValue}>{Math.round(pt.soil)}% Đất</Text>
              </View>

              {/* Light bar */}
              <View style={styles.progressGroup}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pt.light}%`, backgroundColor: '#f59e0b' }]} />
                </View>
                <Text style={styles.progressValue}>{Math.round(pt.light)}% Sáng</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#10b981',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  chartCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  barPlotArea: {
    height: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  dualBarContainer: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barItem: {
    width: 10,
    borderRadius: 4,
  },
  barXLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  progressList: {
    gap: 12,
  },
  progressRow: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  progressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    width: 75,
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'right',
  },
});
