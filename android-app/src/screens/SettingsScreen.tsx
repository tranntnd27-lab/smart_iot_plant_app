import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';

export const SettingsScreen: React.FC = () => {
  const [tempLimit, setTempLimit] = useState<string>('35.0');
  const [humLimit, setHumLimit] = useState<string>('70.0');
  const [soilLimit, setSoilLimit] = useState<string>('40.0');
  const [lightLimit, setLightLimit] = useState<string>('30.0');

  const [brokerHost, setBrokerHost] = useState<string>('broker.hivemq.com');
  const [brokerPort, setBrokerPort] = useState<string>('8000');
  const [dataTopic, setDataTopic] = useState<string>('smartfarm_dung/data');
  const [controlTopic, setControlTopic] = useState<string>('smartfarm_dung/control');

  const handleSaveSettings = () => {
    Alert.alert('Thành Công', 'Đã lưu cấu hình cài đặt ngưỡng và MQTT!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Cài Đặt Hệ Thống</Text>
        <Text style={styles.subtitle}>Cấu hình ngưỡng cảnh báo tự động & Thông số MQTT</Text>
      </View>

      {/* Section 1: Threshold Controls */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Cấu Hình Ngưỡng Cảnh Báo (FreeRTOS)</Text>
        <Text style={styles.cardDesc}>
          ESP32 sẽ tự động kích hoạt Còi buzzer / Bơm tưới / Đèn sưởi khi vượt qua các ngưỡng dưới đây:
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngưỡng Nhiệt Độ Tối Đa (°C)</Text>
          <TextInput
            style={styles.input}
            value={tempLimit}
            onChangeText={setTempLimit}
            keyboardType="decimal-pad"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngưỡng Độ Ẩm Khí Tối Thiểu (%)</Text>
          <TextInput
            style={styles.input}
            value={humLimit}
            onChangeText={setHumLimit}
            keyboardType="decimal-pad"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngưỡng Độ Ẩm Đất Tối Thiểu (%)</Text>
          <TextInput
            style={styles.input}
            value={soilLimit}
            onChangeText={setSoilLimit}
            keyboardType="decimal-pad"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngưỡng Ánh Sáng Tối Thiểu (%)</Text>
          <TextInput
            style={styles.input}
            value={lightLimit}
            onChangeText={setLightLimit}
            keyboardType="decimal-pad"
            placeholderTextColor="#64748b"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>💾 Lưu Cấu Hình Ngưỡng</Text>
        </TouchableOpacity>
      </View>

      {/* Section 2: MQTT Broker Connection Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌐 Thông Số Kết Nối MQTT Broker</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>MQTT Server Host</Text>
          <TextInput
            style={styles.input}
            value={brokerHost}
            onChangeText={setBrokerHost}
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>WebSocket Port</Text>
          <TextInput
            style={styles.input}
            value={brokerPort}
            onChangeText={setBrokerPort}
            keyboardType="number-pad"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Topic Gửi Dữ Liệu Cảm Biến</Text>
          <TextInput
            style={styles.input}
            value={dataTopic}
            onChangeText={setDataTopic}
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Topic Điều Khiển Lệnh</Text>
          <TextInput
            style={styles.input}
            value={controlTopic}
            onChangeText={setControlTopic}
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      {/* Section 3: Hardware & App Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📱 Thông Tin Ứng Dụng & Thiết Bị</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Phiên bản App:</Text>
          <Text style={styles.infoVal}>v2.0 (Android Native / Expo SDK 57)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Vi điều khiển:</Text>
          <Text style={styles.infoVal}>ESP32 Dual-Core (FreeRTOS Core 0 & 1)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Mạng Wi-Fi Router:</Text>
          <Text style={styles.infoVal}>QDNDVN (2.4GHz)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Wi-Fi Access Point:</Text>
          <Text style={styles.infoVal}>SmartFarm_Dung (Pass: 12345678)</Text>
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
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  input: {
    height: 46,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtn: {
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoKey: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});
