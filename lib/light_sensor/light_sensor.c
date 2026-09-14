#include "light_sensor.h"
#include <Arduino.h>

void LightSensor_Init(void) {
    // ESP32 ADC mặc định là 12-bit (0-4095)
    pinMode(LIGHT_SENSOR_PIN, INPUT);
}

uint16_t LightSensor_ReadRaw(void) {
    return analogRead(LIGHT_SENSOR_PIN);
}

float LightSensor_ReadPercent(void) {
    uint16_t raw = analogRead(LIGHT_SENSOR_PIN);
    // Chuyển đổi: 0 là tối nhất, 4095 là sáng nhất 
    // (Tùy cách mắc điện trở phân áp mà giá trị này có thể ngược lại)
    float percent = (float)raw / 4095.0 * 100.0;
    return percent;
}