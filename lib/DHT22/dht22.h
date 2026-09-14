#ifndef __DHT22_H
#define __DHT22_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Định nghĩa trạng thái phản hồi
typedef enum {
    DHT22_OK = 0,
    DHT22_ERR_NO_RESPONSE,
    DHT22_ERR_CHECKSUM
} DHT22_Status;

// Cấu trúc lưu trữ dữ liệu
typedef struct {
    float temperature;
    float humidity;
} DHT22_Data;

// Các hàm nguyên mẫu (Cần triển khai tùy theo MCU)
void DHT22_Init(void);
DHT22_Status DHT22_Read(DHT22_Data *data);

#ifdef __cplusplus
}
#endif

#endif