#ifndef RELAY_MODULE_H
#define RELAY_MODULE_H

#include <stdint.h>

// Định nghĩa kiểu kích hoạt (Jumper)
typedef enum {
    RELAY_LOW_LEVEL = 0,
    RELAY_HIGH_LEVEL = 1
} RelayTrigger_t;

// Định nghĩa trạng thái Relay
typedef enum {
    RELAY_OFF = 0,
    RELAY_ON = 1
} RelayState_t;

// Cấu trúc quản lý một Relay
typedef struct {
    uint16_t pin;           // Chân GPIO nối vào IN
    RelayTrigger_t trigger; // Chế độ Jumper (Low hoặc High)
} Relay_t;

#ifdef __cplusplus
extern "C" {
#endif

// Các hàm điều khiển
void Relay_Init(Relay_t* relay, uint16_t pin, RelayTrigger_t trigger);
void Relay_Control(Relay_t* relay, RelayState_t state);
void Relay_Toggle(Relay_t* relay);

#ifdef __cplusplus
}
#endif

#endif