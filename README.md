# Hệ Thống Giám Sát Và Chăm Sóc Cây Trồng Thông Minh (ESP32 Smart Farm IoT)

Chào mừng bạn đến với tài liệu hướng dẫn kỹ thuật của dự án **Hệ thống giám sát và chăm sóc cây trồng thông minh**. Đây là đồ án môn học (Đồ án 1) tích hợp hệ thống nhúng đa nhiệm trên vi điều khiển ESP32, cơ sở dữ liệu thời gian thực Firebase, và giao diện Web Dashboard (cục bộ & đám mây).

---

## 📂 Cấu Trúc Thư Mục Dự Án

Dự án được xây dựng và quản lý dựa trên công cụ **PlatformIO** (VS Code extension). Dưới đây là sơ đồ bố trí thư mục chính:

```text
Final_Project/
├── .pio/                    # Thư mục chứa mã biên dịch tạm thời và thư viện tải về
├── data/                    # Chứa giao diện tĩnh (HTML/CSS/JS) nạp vào bộ nhớ SPIFFS
│   ├── index.html           # Trang chủ Dashboard cục bộ của thiết bị
│   ├── control.html         # Trang điều khiển thiết bị offline qua mạng AP
│   └── css/ & js/           # Các tệp phong cách và logic script xử lý web
├── lib/                     # Các thư viện ngoại vi tự xây dựng (Custom Libraries)
│   ├── DHT22/               # Thư viện đọc cảm biến nhiệt độ & độ ẩm không khí
│   ├── soil_moisture/       # Thư viện đọc độ ẩm đất thông qua kênh ADC
│   ├── light_sensor/        # Thư viện đọc quang trở LDR
│   ├── module_relay/        # Thư viện điều khiển đóng/ngắt Rơ-le (Bơm, Đèn)
│   ├── button/              # Thư viện quét nút nhấn vật lý chống rung phím (Debounce)
│   ├── buzzer/              # Thư viện điều khiển còi chíp phát âm tần
│   └── gmt130_LCD/          # Thư viện vẽ màn hình màu TFT ST7789 SPI
├── src/
│   └── main.cpp             # Tệp chạy chính (Entry Point), chứa luồng FreeRTOS Tasks
└── platformio.ini           # Cấu hình biên dịch, sơ đồ chân và nạp thư viện PlatformIO
```

---

## 🛠️ Hướng Dẫn Cài Đặt Và Biên Dịch

### 1. Chuẩn Bị Phần Mềm
*   Tải và cài đặt **VS Code (Visual Studio Code)**.
*   Cài đặt extension **PlatformIO IDE** từ chợ ứng dụng VS Code.

### 2. Cấu Hình Kết Nối & Thông Số
Mở tệp `src/main.cpp` và điều chỉnh các định nghĩa ở đầu tệp phù hợp với hạ tầng mạng của bạn:
```cpp
// Thông tin tài khoản mạng Router WiFi để ESP32 kết nối Internet (STA Mode)
#define WIFI_SSID "Tên WiFi của bạn"
#define WIFI_PASSWORD "Mật khẩu WiFi"

// Địa chỉ và khóa bảo mật của Firebase Realtime Database
#define FB_API_KEY "API_KEY_FIREBASE_CỦA_BẠN"
#define FB_DB_URL "https://project-url-default-rtdb.firebaseio.com/"
#define FB_SECRET "SECRET_KEY_CỦA_BẠN"
```

### 3. Biên Dịch & Nạp Chương Trình
*   **Biên dịch mã nguồn (Build)**: Click vào biểu tượng ✔ (PlatformIO: Build) ở thanh trạng thái dưới cùng của VS Code.
*   **Nạp mã nguồn vào ESP32 (Upload)**: Kết nối ESP32 qua cổng USB và click vào biểu tượng ➔ (PlatformIO: Upload).
*   **Nạp dữ liệu Web vào bộ nhớ Flash (Upload Filesystem Image)**:
    1.  Mở tab PlatformIO ở thanh biên trái (biểu tượng đầu kiến).
    2.  Tìm mục `PlatformIO -> Project Tasks -> esp32dev -> Platform -> Build Filesystem Image`.
    3.  Sau đó click chọn **Upload Filesystem Image** để nạp toàn bộ thư mục `data` vào phân vùng lưu trữ **SPIFFS** trên ESP32.

---

## 🧠 Kiến Trúc Đa Nhiệm FreeRTOS (Dual-Core)

Hệ thống tận dụng tối đa năng lực xử lý lõi kép của chip **ESP32-WROOM-32** bằng cách chia công việc thành 5 tác vụ độc lập chạy song song, phân bổ như sau:

| Tên Task | Lõi xử lý (Core) | Độ ưu tiên | Chu kỳ quét | Vai trò và chức năng |
| :--- | :---: | :---: | :---: | :--- |
| **`TaskButtons`** | **Core 1** | **4** (Cao nhất) | 20 ms | Quét nút nhấn vật lý, xử lý chuyển chế độ hiển thị và tăng/giảm ngưỡng kịp thời không độ trễ. |
| **`TaskSensorsAndLogic`** | **Core 1** | **3** | 1000 ms (1s) | Đọc cảm biến DHT22, Độ ẩm đất, Quang trở LDR và chạy thuật toán tự động đóng ngắt còi báo động, rơ-le. |
| **`TaskWebServer`** | **Core 1** | **2** | 10 ms | Quản lý kết nối và phản hồi yêu cầu cho giao diện Web điều khiển cục bộ khi người dùng truy cập IP. |
| **`TaskLCD`** | **Core 1** | **1** | 200 ms | Làm mới màn hình màu LCD TFT, hiển thị các thông số động, tránh hiện tượng giật lag khung hình. |
| **`TaskFirebase`** | **Core 0** | **1** | **2000 ms (2s)** | Đồng bộ trạng thái thiết bị 2 chiều lên Cloud Firebase. (Bản cập nhật được cách ly riêng trên Core 0 để không gây nghẽn phần cứng khi mạng yếu). |

---

## 🔌 Sơ Đồ Khối Phần Cứng (Hardware Block Diagram)

Dưới đây là sơ đồ đấu nối điện học và phân khu chức năng phần cứng kết nối với vi điều khiển ESP32:

```mermaid
graph TD
    classDef esp fill:#FF8C00,stroke:#333,stroke-width:2px,color:#fff;
    classDef input fill:#1E90FF,stroke:#333,stroke-width:1px,color:#fff;
    classDef output fill:#3CB371,stroke:#333,stroke-width:1px,color:#fff;
    classDef power fill:#FF6347,stroke:#333,stroke-width:1px,color:#fff;
    classDef comm fill:#BA55D3,stroke:#333,stroke-width:1px,color:#fff;

    subgraph Power ["KHỐI NGUỒN CẤP"]
        Adapter["Adapter nguồn ngoài (5V DC)"]:::power
        AMS["Mạch hạ áp ổn áp AMS1117-3.3V"]:::power
        Adapter --> AMS
    end

    MCU["VI ĐIỀU KHIỂN TRUNG TÂM <br> ESP32-WROOM-32"]:::esp
    AMS -->|Cấp nguồn chính 3.3V| MCU

    subgraph Inputs ["KHỐI CẢM BIẾN & NHẬP LIỆU"]
        DHT["Cảm biến DHT22 <br> (Nhiệt độ & Độ ẩm khí)"]:::input
        Soil["Cảm biến Độ ẩm đất <br> (Soil Moisture)"]:::input
        LDR["Cảm biến ánh sáng <br> (Quang trở LDR)"]:::input
        Btns["Cụm 3 nút nhấn vật lý <br> (Chuyển chế độ / Tăng / Giảm)"]:::input
    end

    subgraph Outputs ["KHỐI CHẤP HÀNH & HIỂN THỊ"]
        Pump["Rơ-le đóng/ngắt máy bơm"]:::output
        LED["Rơ-le đóng/ngắt đèn chiếu sáng"]:::output
        Buzzer["Còi báo động (Active Buzzer)"]:::output
        LCD["Màn hình LCD màu TFT ST7789"]:::output
    end

    subgraph Connectivity ["KHỐI TRUYỀN THÔNG"]
        WiFi["Wi-Fi AP (Phát sóng) / STA (Trạm thu)"]:::comm
        Firebase[("Đám mây Firebase RTDB")]:::comm
        WiFi <--> Firebase
    end

    DHT -->|Đọc dữ liệu nhiệt ẩm| MCU
    Soil -->|Đọc điện áp Analog (ADC)| MCU
    LDR -->|Đọc điện áp Analog (ADC)| MCU
    Btns -->|Chân GPIO 26, 27, 4| MCU

    MCU -->|Kích mức Thấp (GPIO 25)| Pump
    MCU -->|Kích mức Thấp (GPIO 17)| LED
    MCU -->|Điều khiển tần số (GPIO 12)| Buzzer
    MCU -->|Giao tiếp bus SPI (GPIO 18, 23, 5, 21, 22)| LCD

    MCU <-->|Giao tiếp mạng không dây| WiFi
    AMS -.->|Cấp nguồn nuôi 3.3V| Inputs
    AMS -.->|Cấp nguồn nuôi 3.3V| Outputs
```

---

## 🔄 Sơ Đồ Luồng Hoạt Động (Data Flow Flowchart)

Dữ liệu cảm biến, ngưỡng cài đặt và trạng thái điều khiển được trao đổi liên tục thông qua sơ đồ luồng dưới đây:

```mermaid
flowchart TD
    %% Subgraph 1: Ngoại vi đầu vào
    subgraph Inputs ["Tầng Thu Thập & Nhập Liệu"]
        Sensors[Cảm biến DHT22, Đất, LDR]
        Buttons[Phím cứng Tăng/Giảm/Mode]
    end

    %% Subgraph 2: Các Task điều khiển
    subgraph Controller ["ESP32 Nhúng Đa Nhiệm (FreeRTOS Tasks)"]
        tSensors["TaskSensorsAndLogic (Đọc & So sánh tự động)"]
        tButtons["TaskButtons (Thay đổi chế độ/ngưỡng tại chỗ)"]
        tLCD["TaskLCD (Vẽ giao diện hiển thị)"]
        tWeb["TaskWebServer (Phục vụ Web cục bộ)"]
        tFB["TaskFirebase (Quản lý mạng & Cloud)"]
    end

    %% Subgraph 3: Cơ sở dữ liệu đám mây
    subgraph Cloud ["Tầng Đồng Bộ Đám Mây"]
        Firebase[(Firebase Realtime Database)]
        CloudWeb[Web Dashboard Cloud]
    end

    %% Giao tiếp luồng dữ liệu
    Sensors -->|Đọc số liệu thực tế mỗi 1s| tSensors
    Buttons -->|Quét nút nhấn mỗi 20ms| tButtons
    
    tButtons -->|Cập nhật trực tiếp| tLCD
    tSensors -->|Đưa dữ liệu đo đạc| tLCD
    tSensors -->|Kích hoạt còi & Đóng ngắt| Actuators[Cơ cấu chấp hành: Bơm, LED, Còi]

    tWeb <-->|Kết nối HTTP offline| LocalBrowser[Trình duyệt Web nội bộ 192.168.4.1]
    
    tSensors -->|Chia sẻ dữ liệu cảm biến| tFB
    tFB <-->|Đồng bộ 2 chiều (Lệnh rơ-le / Ngưỡng / Dữ liệu môi trường)| Firebase
    Firebase <-->|Kết nối WebSockets| CloudWeb
```

---

## 📡 Các Chế Độ Kết Nối & Điều Khiển

Dự án hỗ trợ song song hai giao thức quản lý:

### Chế độ cục bộ ngoại tuyến (Offline Web AP Mode)
*   ESP32 tự phát mạng Wi-Fi riêng có tên: **`SmartFarm_Dung`** (mật khẩu: `12345678`).
*   Người dùng kết nối và truy cập vào địa chỉ IP của thiết bị: **`http://192.168.4.1`**.
*   Giao diện hiển thị trực quan thông số, cho phép bật/tắt thiết bị tại chỗ ngay cả khi không có mạng Internet.

### Chế độ trực tuyến (Online Cloud Mode)
*   Thiết bị kết nối Wi-Fi Router nội bộ để thông ra Internet.
*   Dữ liệu liên tục được đồng bộ lên **Firebase Realtime Database**.
*   Giao diện Web Cloud đồng bộ tức thời trạng thái nhờ cơ chế WebSockets thời gian thực từ xa.
