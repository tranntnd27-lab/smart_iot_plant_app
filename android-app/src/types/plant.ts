/**
 * TypeScript Types & Interfaces cho Ứng dụng Android Chăm Sóc Cây Trồng
 */

export interface SensorData {
  temp: number;   // Nhiệt độ (°C)
  hum: number;    // Độ ẩm không khí (%)
  soil: number;   // Độ ẩm đất (%)
  light: number;  // Cường độ ánh sáng (lux)
  pump: number;   // Trạng thái bơm (0: Tắt, 1: Bật)
  led?: number;   // Trạng thái đèn LED (0: Tắt, 1: Bật)
}

export interface PlantProfile {
  id: string;
  name: string;
  category: string;
  icon: string;
  idealTemp: { min: number; max: number };
  idealHum: { min: number; max: number };
  idealSoil: { min: number; max: number };
  idealLight: { min: number; max: number };
  advice: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  title: string;
  desc: string;
  type: 'ALARM' | 'PUMP' | 'LED' | 'SYSTEM';
  severity: 'info' | 'warning' | 'danger' | 'success';
}

export interface WateringSchedule {
  id: string;
  time: string;
  days: string[];
  durationSeconds: number;
  enabled: boolean;
}

export type PlantHealthState = 'HEALTHY' | 'DRY' | 'WET' | 'WARN';

export interface PlantHealthInfo {
  state: PlantHealthState;
  score: number;
  title: string;
  description: string;
  color: string;
  iconName: string;
}

export interface PumpControlPayload {
  pump: 0 | 1;
}

export type MQTTConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
