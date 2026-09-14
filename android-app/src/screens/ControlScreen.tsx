import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { SensorData, ActivityLog } from '../types/plant';

interface ControlScreenProps {
  sensorData: SensorData;
  onPumpToggle: (state: 0 | 1) => void;
  onLedToggle: (state: 0 | 1) => void;
}

export const ControlScreen: React.FC<ControlScreenProps> = ({
  sensorData,
  onPumpToggle,
  onLedToggle,
}) => {
  const isPumpOn = sensorData.pump === 1;
  const isLedOn = sensorData.led === 1;

  // Water Pump Countdown Timer State
  const [pumpTimerSecondsLeft, setPumpTimerSecondsLeft] = useState<number>(0);

  // Grow Light LED Countdown Timer State
  const [ledTimerSecondsLeft, setLedTimerSecondsLeft] = useState<number>(0);

  // Time Scheduler State for Grow Light LED (Giờ Bật / Giờ Tắt)
  const [ledTurnOnTime, setLedTurnOnTime] = useState<string>('18:00');
  const [ledTurnOffTime, setLedTurnOffTime] = useState<string>('22:00');
  const [isLedScheduleActive, setIsLedScheduleActive] = useState<boolean>(false);
  const [lastTriggeredTime, setLastTriggeredTime] = useState<string>('');

  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      time: '18:00',
      title: 'Lập lịch Đèn LED',
      desc: 'Đã bật đèn theo lịch cài đặt (18:00 - 22:00)',
      type: 'LED',
      severity: 'success',
    },
    {
      id: '2',
      time: '17:50',
      title: 'Đồng bộ MQTT Broker',
      desc: 'Đã kết nối thành công tới HiveMQ (ws://broker.hivemq.com:8000/mqtt)',
      type: 'SYSTEM',
      severity: 'success',
    },
    {
      id: '3',
      time: '17:30',
      title: 'Cảnh báo độ ẩm đất',
      desc: 'Độ ẩm đất ở mức 42% (Gần ngưỡng tưới 40%)',
      type: 'ALARM',
      severity: 'warning',
    },
  ]);

  // Background Time Schedule Monitor for LED (Check every 10 seconds)
  useEffect(() => {
    if (!isLedScheduleActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentHHmm !== lastTriggeredTime) {
        if (currentHHmm === ledTurnOnTime.trim()) {
          onLedToggle(1);
          setLastTriggeredTime(currentHHmm);
          setLogs((prev) => [
            {
              id: Date.now().toString(),
              time: currentHHmm,
              title: 'Lập Lịch Tự Động: BẬT ĐÈN',
              desc: `Đèn LED đã tự động BẬT theo lịch (${ledTurnOnTime})`,
              type: 'LED',
              severity: 'success',
            },
            ...prev,
          ]);
        } else if (currentHHmm === ledTurnOffTime.trim()) {
          onLedToggle(0);
          setLastTriggeredTime(currentHHmm);
          setLogs((prev) => [
            {
              id: Date.now().toString(),
              time: currentHHmm,
              title: 'Lập Lịch Tự Động: TẮT ĐÈN',
              desc: `Đèn LED đã tự động TẮT theo lịch (${ledTurnOffTime})`,
              type: 'LED',
              severity: 'info',
            },
            ...prev,
          ]);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLedScheduleActive, ledTurnOnTime, ledTurnOffTime, lastTriggeredTime, onLedToggle]);

  // Handle Water Pump countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pumpTimerSecondsLeft > 0) {
      interval = setInterval(() => {
        setPumpTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            onPumpToggle(0);
            Alert.alert('Hẹn Giờ Bơm Hoàn Tất', 'Đã kết thúc thời gian tưới đếm ngược. Máy bơm đã tự động TẮT.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pumpTimerSecondsLeft, onPumpToggle]);

  // Handle Grow Light LED countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (ledTimerSecondsLeft > 0) {
      interval = setInterval(() => {
        setLedTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            onLedToggle(0);
            Alert.alert('Hẹn Giờ Đèn Hoàn Tất', 'Đã hết thời gian chiếu sáng. Đèn quang hợp LED đã tự động TẮT.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ledTimerSecondsLeft, onLedToggle]);

  const handleSaveSchedule = () => {
    Alert.alert(
      'Đã Lưu Lịch Bật/Tắt Đèn',
      `Đèn LED sẽ tự động BẬT lúc ${ledTurnOnTime} và TẮT lúc ${ledTurnOffTime} mỗi ngày.`
    );
  };

  const handleStartPumpTimer = (seconds: number) => {
    onPumpToggle(1);
    setPumpTimerSecondsLeft(seconds);
  };

  const handleCancelPumpTimer = () => {
    onPumpToggle(0);
    setPumpTimerSecondsLeft(0);
  };

  const handleStartLedTimer = (seconds: number) => {
    onLedToggle(1);
    setLedTimerSecondsLeft(seconds);
  };

  const handleCancelLedTimer = () => {
    onLedToggle(0);
    setLedTimerSecondsLeft(0);
  };

  const formatTimerStr = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trung Tâm Điều Khiển</Text>
        <Text style={styles.subtitle}>Điều khiển Bơm nước, Đèn LED & Lập lịch hẹn giờ tự động</Text>
      </View>

      {/* Control Card 1: Water Pump */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIcon}>💧</Text>
            <Text style={styles.cardTitle}>Máy Bơm Tưới Nước</Text>
          </View>
          <View style={[styles.statusBadge, isPumpOn ? styles.statusOn : styles.statusOff]}>
            <Text style={[styles.statusText, isPumpOn ? styles.textOn : styles.textOff]}>
              {isPumpOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          Rơ-le bơm nước kết nối chân GPIO25 ESP32. Nhấn nút để bật/tắt thủ công qua MQTT.
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOn, isPumpOn && styles.btnActiveOn]}
            onPress={() => onPumpToggle(1)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>💧</Text>
            <Text style={styles.btnTextOn}>Bật Tưới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOff, !isPumpOn && styles.btnActiveOff]}
            onPress={() => onPumpToggle(0)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>⚡</Text>
            <Text style={styles.btnTextOff}>Tắt Tưới</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Water Pump Countdown Timer Widget */}
      <View style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <Text style={styles.timerTitle}>⏱️ Hẹn Giờ Tắt Bơm Nhanh</Text>
          {pumpTimerSecondsLeft > 0 && (
            <TouchableOpacity onPress={handleCancelPumpTimer} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Hủy hẹn giờ</Text>
            </TouchableOpacity>
          )}
        </View>

        {pumpTimerSecondsLeft > 0 ? (
          <View style={styles.activeTimerBox}>
            <Text style={styles.timerCountdown}>{formatTimerStr(pumpTimerSecondsLeft)}</Text>
            <Text style={styles.timerSubText}>Đang tưới đếm ngược... Bơm sẽ tự động tắt khi hết giờ</Text>
          </View>
        ) : (
          <View style={styles.timerPresetsRow}>
            {[
              { label: '30 Giây', sec: 30 },
              { label: '1 Phút', sec: 60 },
              { label: '3 Phút', sec: 180 },
              { label: '5 Phút', sec: 300 },
            ].map((p) => (
              <TouchableOpacity
                key={p.sec}
                style={styles.presetBtn}
                onPress={() => handleStartPumpTimer(p.sec)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Control Card 2: Grow Light LED */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIcon}>💡</Text>
            <Text style={styles.cardTitle}>Đèn Quang Hợp / Đèn LED</Text>
          </View>
          <View style={[styles.statusBadge, isLedOn ? styles.statusOn : styles.statusOff]}>
            <Text style={[styles.statusText, isLedOn ? styles.textOn : styles.textOff]}>
              {isLedOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          Rơ-le đèn LED kết nối chân GPIO17 ESP32. Bổ sung ánh sáng cho cây trồng khi trời tối.
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOn, isLedOn && styles.btnActiveOn]}
            onPress={() => onLedToggle(1)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>💡</Text>
            <Text style={styles.btnTextOn}>Bật Đèn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOff, !isLedOn && styles.btnActiveOff]}
            onPress={() => onLedToggle(0)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>🌙</Text>
            <Text style={styles.btnTextOff}>Tắt Đèn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dedicated LED Time Scheduler (Giờ Bật & Giờ Tắt) */}
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>⏰ Lập Lịch Giờ Bật / Giờ Tắt Đèn LED</Text>
          <Switch
            value={isLedScheduleActive}
            onValueChange={setIsLedScheduleActive}
            trackColor={{ false: '#334155', true: '#10b981' }}
            thumbColor={isLedScheduleActive ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <Text style={styles.scheduleDesc}>
          Cài đặt khung giờ cố định trong ngày để ứng dụng tự động BẬT và TẮT đèn sưởi/quang hợp qua MQTT:
        </Text>

        <View style={styles.timeInputsRow}>
          <View style={styles.timeInputBox}>
            <Text style={styles.timeLabel}>☀️ Giờ Bật Đèn</Text>
            <TextInput
              style={styles.timeInput}
              value={ledTurnOnTime}
              onChangeText={setLedTurnOnTime}
              placeholder="18:00"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.timeInputBox}>
            <Text style={styles.timeLabel}>🌙 Giờ Tắt Đèn</Text>
            <TextInput
              style={styles.timeInput}
              value={ledTurnOffTime}
              onChangeText={setLedTurnOffTime}
              placeholder="22:00"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveScheduleBtn} onPress={handleSaveSchedule} activeOpacity={0.8}>
          <Text style={styles.saveScheduleText}>💾 Lưu Khung Giờ Bật / Tắt</Text>
        </TouchableOpacity>

        {isLedScheduleActive && (
          <View style={styles.scheduleStatusBanner}>
            <Text style={styles.scheduleStatusText}>
              ✅ Đang bật lập lịch: Đèn sẽ tự động BẬT lúc <Text style={styles.boldTime}>{ledTurnOnTime}</Text> và TẮT lúc <Text style={styles.boldTime}>{ledTurnOffTime}</Text> hàng ngày.
            </Text>
          </View>
        )}
      </View>

      {/* Grow Light LED Countdown Timer Widget */}
      <View style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <Text style={styles.timerTitle}>⏳ Hẹn Giờ Chiếu Sáng Đếm Ngược Nhanh</Text>
          {ledTimerSecondsLeft > 0 && (
            <TouchableOpacity onPress={handleCancelLedTimer} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Hủy hẹn giờ</Text>
            </TouchableOpacity>
          )}
        </View>

        {ledTimerSecondsLeft > 0 ? (
          <View style={[styles.activeTimerBox, { borderColor: '#f59e0b' }]}>
            <Text style={[styles.timerCountdown, { color: '#f59e0b' }]}>{formatTimerStr(ledTimerSecondsLeft)}</Text>
            <Text style={styles.timerSubText}>Đang bật đèn chiếu sáng đếm ngược... Đèn sẽ tự động tắt khi hết giờ</Text>
          </View>
        ) : (
          <View style={styles.timerPresetsRow}>
            {[
              { label: '30 Giây', sec: 30 },
              { label: '5 Phút', sec: 300 },
              { label: '15 Phút', sec: 900 },
              { label: '30 Phút', sec: 1800 },
            ].map((p) => (
              <TouchableOpacity
                key={p.sec}
                style={[styles.presetBtn, { borderColor: 'rgba(245, 158, 11, 0.2)' }]}
                onPress={() => handleStartLedTimer(p.sec)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetText, { color: '#f59e0b' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Activity Logs Timeline */}
      <View style={styles.logCard}>
        <Text style={styles.logCardTitle}>📋 Nhật Ký Hoạt Động & Cảnh Báo</Text>
        <View style={styles.logList}>
          {logs.map((item) => (
            <View key={item.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={styles.logTime}>{item.time}</Text>
                <Text style={styles.logTitle}>{item.title}</Text>
              </View>
              <Text style={styles.logDesc}>{item.desc}</Text>
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
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusOff: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textOn: {
    color: '#10b981',
  },
  textOff: {
    color: '#94a3b8',
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
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
  btnActiveOn: {
    backgroundColor: '#10b981',
  },
  btnOff: {
    backgroundColor: '#451a1a',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnActiveOff: {
    backgroundColor: '#ef4444',
  },
  btnIcon: {
    fontSize: 18,
  },
  btnTextOn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnTextOff: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  scheduleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gap: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  scheduleDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputBox: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  timeInput: {
    height: 46,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    textAlign: 'center',
  },
  saveScheduleBtn: {
    height: 44,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  saveScheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  scheduleStatusBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  scheduleStatusText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  boldTime: {
    fontWeight: '800',
    color: '#10b981',
  },
  timerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  timerPresetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  activeTimerBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  timerCountdown: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 2,
  },
  timerSubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  logCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  logList: {
    gap: 10,
  },
  logItem: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  logHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  logTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  logDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
