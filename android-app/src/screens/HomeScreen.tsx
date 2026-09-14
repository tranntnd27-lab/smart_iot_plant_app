import React from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SensorData, PlantHealthInfo, PlantProfile } from '../types/plant';
import { PLANT_PROFILES } from '../utils/plantProfiles';
import { SensorCard } from '../components/SensorCard';
import { PlantHealthCard } from '../components/PlantHealthCard';
import { PumpControl } from '../components/PumpControl';

interface HomeScreenProps {
  sensorData: SensorData;
  hasReceivedRealData: boolean;
  healthInfo: PlantHealthInfo;
  selectedProfile: PlantProfile;
  onSelectProfile: (profile: PlantProfile) => void;
  onPumpToggle: (targetState: 0 | 1) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  sensorData,
  hasReceivedRealData,
  healthInfo,
  selectedProfile,
  onSelectProfile,
  onPumpToggle,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Plant Selector Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🌱 Chọn Loại Cây Trồng</Text>
        <Text style={styles.sectionSubtitle}>Hệ thống AI sẽ tự động phân tích ngưỡng lý tưởng</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileCarousel}>
        {PLANT_PROFILES.map((prof) => {
          const isSelected = selectedProfile.id === prof.id;
          return (
            <TouchableOpacity
              key={prof.id}
              style={[styles.profileCard, isSelected && styles.profileCardSelected]}
              onPress={() => onSelectProfile(prof)}
              activeOpacity={0.8}
            >
              <Text style={styles.profileIcon}>{prof.icon}</Text>
              <Text style={[styles.profileName, isSelected && styles.profileNameSelected]}>{prof.name}</Text>
              <Text style={styles.profileCategory}>{prof.category}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Health AI Banner */}
      <PlantHealthCard healthInfo={healthInfo} />

      {/* 4 Sensor Cards Grid */}
      <View style={styles.gridRow}>
        <SensorCard
          label="Nhiệt độ"
          value={hasReceivedRealData ? sensorData.temp : '--'}
          unit="°C"
          icon="🌡️"
          type="temp"
        />
        <SensorCard
          label="Độ ẩm không khí"
          value={hasReceivedRealData ? sensorData.hum : '--'}
          unit="%"
          icon="💧"
          type="hum"
        />
      </View>

      <View style={styles.gridRow}>
        <SensorCard
          label="Độ ẩm đất"
          value={hasReceivedRealData ? sensorData.soil : '--'}
          unit="%"
          icon="🪴"
          type="soil"
        />
        <SensorCard
          label="Ánh sáng"
          value={
            hasReceivedRealData
              ? sensorData.light > 100
                ? Math.min(100, Math.round((sensorData.light / 1000) * 100))
                : sensorData.light
              : '--'
          }
          unit="%"
          icon="☀️"
          type="light"
        />
      </View>

      {/* Smart Water Analytics Widget */}
      <View style={styles.analyticsWidget}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>📊 Thống Kê Nước & Điện Năng (Hôm Nay)</Text>
        </View>

        <View style={styles.analyticsRow}>
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsValue}>1.8 Lít</Text>
            <Text style={styles.analyticsLabel}>Lượng nước ước tính</Text>
          </View>
          <View style={styles.analyticsDivider} />
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsValue}>4 Lần</Text>
            <Text style={styles.analyticsLabel}>Số chu kỳ tưới</Text>
          </View>
          <View style={styles.analyticsDivider} />
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsValue}>0.05 kWh</Text>
            <Text style={styles.analyticsLabel}>Điện năng tiêu thụ</Text>
          </View>
        </View>
      </View>

      {/* Quick Pump Control */}
      <PumpControl pumpState={sensorData.pump} onPumpToggle={onPumpToggle} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  profileCarousel: {
    gap: 10,
    paddingRight: 10,
  },
  profileCard: {
    width: 125,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileCardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  profileIcon: {
    fontSize: 28,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  profileNameSelected: {
    color: '#10b981',
  },
  profileCategory: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsWidget: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  analyticsHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  analyticsBox: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38bdf8',
  },
  analyticsLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});
