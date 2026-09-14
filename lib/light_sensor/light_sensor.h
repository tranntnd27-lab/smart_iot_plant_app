#ifndef __LIGHT_SENSOR_H
#define __LIGHT_SENSOR_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Chọn chân ADC (Ví dụ GPIO 34 - Chân này chỉ Input, rất tốt cho ADC)
#define LIGHT_SENSOR_PIN 34

// Khởi tạo cảm biến
void LightSensor_Init(void);

// Đọc giá trị Analog thô (0 - 4095 cho ESP32)
uint16_t LightSensor_ReadRaw(void);

// Đọc giá trị phần trăm (0% - 100%)
float LightSensor_ReadPercent(void);

#ifdef __cplusplus
}
#endif

#endif