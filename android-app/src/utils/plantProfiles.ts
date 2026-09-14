import { PlantProfile, PlantHealthInfo, SensorData } from '../types/plant';

export const PLANT_PROFILES: PlantProfile[] = [
  {
    id: 'succulent',
    name: 'Sen Đá / Xương Rồng',
    category: 'Cây mọng nước',
    icon: '🌵',
    idealTemp: { min: 18, max: 34 },
    idealHum: { min: 30, max: 70 },
    idealSoil: { min: 20, max: 45 },
    idealLight: { min: 50, max: 95 },
    advice: 'Cây ưa nắng, chịu khô hạn tốt. Đất ẩm > 50% có thể gây úng rễ.',
  },
  {
    id: 'strawberry',
    name: 'Dâu Tây',
    category: 'Cây ăn trái',
    icon: '🍓',
    idealTemp: { min: 18, max: 28 },
    idealHum: { min: 60, max: 80 },
    idealSoil: { min: 60, max: 80 },
    idealLight: { min: 45, max: 80 },
    advice: 'Cần duy trì độ ẩm đất ổn định (60-80%) và ánh sáng chan hòa.',
  },
  {
    id: 'tomato',
    name: 'Cà Chua',
    category: 'Cây rau củ',
    icon: '🍅',
    idealTemp: { min: 20, max: 32 },
    idealHum: { min: 50, max: 75 },
    idealSoil: { min: 55, max: 75 },
    idealLight: { min: 60, max: 90 },
    advice: 'Cây phát triển nhanh, cần tưới thường xuyên và ánh sáng tốt.',
  },
  {
    id: 'microgreens',
    name: 'Rau Mầm / Rau Sạch',
    category: 'Rau ăn lá',
    icon: '🥬',
    idealTemp: { min: 20, max: 28 },
    idealHum: { min: 65, max: 85 },
    idealSoil: { min: 65, max: 85 },
    idealLight: { min: 30, max: 65 },
    advice: 'Giữ đất luôn ẩm mịn, tránh nắng gắt trực tiếp làm héo mầm.',
  },
  {
    id: 'orchid',
    name: 'Hoa Lan',
    category: 'Cây cảnh cao cấp',
    icon: '🌸',
    idealTemp: { min: 22, max: 30 },
    idealHum: { min: 60, max: 85 },
    idealSoil: { min: 40, max: 60 },
    idealLight: { min: 35, max: 65 },
    advice: 'Ưa độ ẩm không khí cao, thoáng gió, ánh sáng tán xạ nhẹ nhàng.',
  },
];

export function calculatePlantHealth(
  sensorData: SensorData,
  profile: PlantProfile,
  hasRealData: boolean
): PlantHealthInfo {
  if (!hasRealData) {
    return {
      state: 'WARN',
      score: 0,
      title: 'Đang chờ ESP32...',
      description: 'Vui lòng kiểm tra Wi-Fi / MQTT connection cho ESP32',
      color: '#64748b',
      iconName: '⏳',
    };
  }

  const { temp, hum, soil, light } = sensorData;
  const lightPct = light > 100 ? Math.min(100, Math.round((light / 1000) * 100)) : light;

  let score = 100;
  const issues: string[] = [];

  // 1. Soil Moisture check
  if (soil < profile.idealSoil.min) {
    score -= 30;
    issues.push(`Độ ẩm đất thấp (${soil}% < ${profile.idealSoil.min}%)`);
  } else if (soil > profile.idealSoil.max) {
    score -= 20;
    issues.push(`Độ ẩm đất cao (${soil}% > ${profile.idealSoil.max}%)`);
  }

  // 2. Temp check
  if (temp < profile.idealTemp.min || temp > profile.idealTemp.max) {
    score -= 20;
    issues.push(`Nhiệt độ ngoài ngưỡng (${temp}°C)`);
  }

  // 3. Humidity check
  if (hum < profile.idealHum.min || hum > profile.idealHum.max) {
    score -= 15;
    issues.push(`Độ ẩm không khí (${hum}%) chưa tối ưu`);
  }

  // 4. Light check
  if (lightPct < profile.idealLight.min) {
    score -= 15;
    issues.push(`Ánh sáng yếu (${lightPct}%)`);
  }

  score = Math.max(10, Math.min(100, score));

  if (score >= 85) {
    return {
      state: 'HEALTHY',
      score,
      title: `Cây ${profile.name} Phát Triển Rất Tốt!`,
      description: `Mọi thông số môi trường hoàn hảo cho giống ${profile.category}.`,
      color: '#10b981',
      iconName: '🌿',
    };
  } else if (soil < profile.idealSoil.min) {
    return {
      state: 'DRY',
      score,
      title: `Cây ${profile.name} Cần Được Tưới Nước!`,
      description: issues.join('. ') + '. Hãy bật máy bơm tưới ngay.',
      color: '#f59e0b',
      iconName: '⚠️',
    };
  } else if (soil > profile.idealSoil.max) {
    return {
      state: 'WET',
      score,
      title: `Đất Đang Dư Nước Đối Với ${profile.name}!`,
      description: issues.join('. ') + '. Nên ngưng tưới để tránh thối rễ.',
      color: '#3b82f6',
      iconName: '💧',
    };
  } else {
    return {
      state: 'WARN',
      score,
      title: `Cần Điều Chỉnh Môi Trường Trồng`,
      description: issues.join('. '),
      color: '#8b5cf6',
      iconName: 'ℹ️',
    };
  }
}
