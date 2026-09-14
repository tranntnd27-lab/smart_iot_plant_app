# Smart Plant - Ứng Dụng Android (React Native + TypeScript)

Ứng dụng di động Android cho Hệ thống Chăm sóc Cây trồng Thông minh (Lộ trình Tuần 2) được phát triển bằng **React Native**, **TypeScript**, và **JavaScript**, kết nối thời gian thực qua **MQTT Broker**.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu môi trường
- [Node.js](https://nodejs.org/) (Phiên bản 18 trở lên)
- Ứng dụng **Expo Go** trên điện thoại Android (Tải miễn phí từ Google Play Store) hoặc Android Emulator (Android Studio).

### 2. Cài đặt các gói thư viện (Dependencies)
Mở Terminal trong thư mục `android-app` và chạy lệnh:
```bash
cd android-app
npm install
```

### 3. Khởi chạy ứng dụng
Chạy lệnh khởi động Expo:
```bash
npm start
# Hoặc chạy trực tiếp cho Android
npx expo start --android
```

- **Trên Điện thoại Android thật**: Mở ứng dụng **Expo Go**, quét mã **QR Code** hiển thị trên màn hình Terminal.
- **Trên Android Emulator**: Nhấn phím `a` trên Terminal để tự động mở ứng dụng trên máy giả lập.

---

## 🏗️ Cấu Trúc Mã Nguồn (TypeScript + JavaScript)

```
android-app/
├── App.tsx                     # Màn hình chính kết nối MQTT & quản lý State (TypeScript)
├── tsconfig.json               # Cấu hình TypeScript Strict Mode
├── package.json                # Dependencies & Scripts
└── src/
    ├── types/
    │   └── plant.ts            # Khai báo Interfaces & Data Types (TypeScript)
    ├── services/
    │   └── mqttService.ts      # Service xử lý kết nối WebSocket MQTT (TypeScript/JS)
    └── components/
        ├── Header.tsx          # Component Thanh tiêu đề "Smart Plant" (TypeScript)
        ├── SensorCard.tsx      # Component Thẻ hiển thị Nhiệt độ, Độ ẩm, Đất, Ánh sáng
        ├── PlantHealthCard.tsx # Component Đánh giá sức khỏe "Cây đang khỏe"
        ├── PumpControl.tsx     # Component Nút bấm Bật tưới / Tắt tưới
        └── BottomNav.tsx       # Component Thanh Bottom Navigation
```

---

## 📡 Chủ Đề (Topics) MQTT Sử Dụng

- **`plant/data`**: Subscribe nhận dữ liệu cảm biến thời gian thực dạng JSON:
  ```json
  {
    "temp": 28.5,
    "hum": 72.0,
    "soil": 45.0,
    "light": 820,
    "pump": 0
  }
  ```
- **`plant/control`**: Publish tin nhắn điều khiển khi bấm nút Bật/Tắt tưới:
  ```json
  {
    "pump": 1
  }
  ```
