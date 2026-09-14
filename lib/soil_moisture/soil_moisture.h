#ifndef __SOIL_MOISTURE_H
#define __SOIL_MOISTURE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Chọn chân ADC (Ví dụ GPIO 32 - Chân này hỗ trợ ADC1 rất tốt)
#define SOIL_PIN 33

// Giá trị thô khi ở trong không khí (khô nhất) và trong nước (ướt nhất)
// Bạn cần calibrate (hiệu chỉnh) lại 2 con số này sau khi chạy thử
#define SOIL_AIR_VALUE 4095
#define SOIL_WATER_VALUE 1500

void Soil_Init(void);
uint16_t Soil_ReadRaw(void);
float Soil_ReadPercent(void);

#ifdef __cplusplus
}
#endif

#endif