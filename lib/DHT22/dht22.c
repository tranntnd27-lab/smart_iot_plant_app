#include "dht22.h"
#include <Arduino.h>

#define DHT22_PIN 32 // Doi sang chan 21 de tranh trung voi TFT_RST (GPIO 4)

#define Set_Pin_Output() pinMode(DHT22_PIN, OUTPUT)
#define Set_Pin_Input()  pinMode(DHT22_PIN, INPUT_PULLUP)
#define Write_Pin_High() digitalWrite(DHT22_PIN, HIGH)
#define Write_Pin_Low()  digitalWrite(DHT22_PIN, LOW)
#define Read_Pin()       digitalRead(DHT22_PIN)
#define Delay_us(x)      delayMicroseconds(x)
#define Delay_ms(x)      delay(x)

void DHT22_Init(void) {
    Set_Pin_Output();
    Write_Pin_High();
    Delay_ms(1000); // Chờ cảm biến ổn định khoảng 1s sau khi cấp nguồn
}

static uint8_t DHT22_ReadByte(void) {
    uint8_t i, byte = 0;
    for (i = 0; i < 8; i++) {
        // Chờ chân lên cao (Bắt đầu 1 bit)
        uint32_t timeout = 0;
        while (!Read_Pin()) {
            if (++timeout > 10000) return 0; 
        }
        
        Delay_us(40); // Chờ 40us để kiểm tra mức logic
        
        if (Read_Pin()) {
            byte |= (1 << (7 - i)); // Nếu vẫn cao là Bit 1
            // Chờ chân xuống thấp lại để sang bit tiếp theo
            timeout = 0;
            while (Read_Pin()) {
                if (++timeout > 10000) break;
            }
        }
        // Nếu thấp là Bit 0 (không cần làm gì vì byte mặc định là 0)
    }
    return byte;
}

DHT22_Status DHT22_Read(DHT22_Data *data) {
    uint8_t buffer[5];
    uint8_t i;

    // 1. Gửi tín hiệu Start
    Set_Pin_Output();
    Write_Pin_Low();
    Delay_ms(18);      // Giữ mức thấp ít nhất 18ms
    
    // Chuyển sang chế độ ngõ vào có trở kéo lên (nhả bus) thay vì xuất mức High
    Set_Pin_Input();

    // Tắt ngắt để timing delayMicroseconds không bị sai lệch do FreeRTOS
    noInterrupts();

    // 2. Chờ cảm biến phản hồi
    uint32_t timeout = 0;
    while (Read_Pin()) { // Chờ DHT22 kéo xuống (80us LOW)
        if (++timeout > 10000) { interrupts(); return DHT22_ERR_NO_RESPONSE; }
    }
    timeout = 0;
    while (!Read_Pin()) { // Chờ DHT22 kéo lên (80us HIGH)
        if (++timeout > 10000) { interrupts(); return DHT22_ERR_NO_RESPONSE; }
    }
    timeout = 0;
    while (Read_Pin()) { // Chờ DHT22 kéo xuống lại để chuẩn bị truyền data
        if (++timeout > 10000) { interrupts(); return DHT22_ERR_NO_RESPONSE; }
    }

    // 3. Đọc 5 byte dữ liệu (40 bit)
    for (i = 0; i < 5; i++) {
        buffer[i] = DHT22_ReadByte();
    }

    interrupts(); // Bật lại ngắt sau khi giao tiếp xong

    // 4. Kiểm tra Checksum
    if ((uint8_t)(buffer[0] + buffer[1] + buffer[2] + buffer[3]) != buffer[4]) {
        return DHT22_ERR_CHECKSUM;
    }

    // 5. Chuyển đổi dữ liệu
    // Cảm biến thực tế là DHT11 (Format khác với DHT22)
    // Byte 0: Nguyên độ ẩm, Byte 1: Thập phân độ ẩm
    // Byte 2: Nguyên nhiệt độ, Byte 3: Thập phân nhiệt độ
    data->humidity = (float)buffer[0] + ((float)buffer[1] / 10.0);
    
    data->temperature = (float)buffer[2] + ((float)buffer[3] / 10.0);

    return DHT22_OK;
}