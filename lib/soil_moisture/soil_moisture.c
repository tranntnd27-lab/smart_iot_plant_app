#include "soil_moisture.h"
#include <Arduino.h>

void Soil_Init(void) {
    pinMode(SOIL_PIN, INPUT);
}

uint16_t Soil_ReadRaw(void) {
    // Đọc giá trị ADC từ 0 - 4095
    return analogRead(SOIL_PIN);
}

float Soil_ReadPercent(void) {
    uint16_t raw = analogRead(SOIL_PIN);
    
    // Chuyển đổi giá trị thô sang phần trăm
    // Dùng công thức thủ công thay cho map() để giữ lại giá trị phần thập phân (float)
    float percent = (float)(raw - SOIL_AIR_VALUE) * 100.0 / (float)(SOIL_WATER_VALUE - SOIL_AIR_VALUE);
    
    // Giới hạn trong khoảng 0-100% để tránh số âm hoặc > 100
    if (percent > 100.0) percent = 100.0;
    if (percent < 0.0) percent = 0.0;
    
    return percent;
}