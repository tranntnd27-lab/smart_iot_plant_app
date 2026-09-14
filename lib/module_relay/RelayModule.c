#include "RelayModule.h"
 #include <Arduino.h>

// Lưu ý: Thay thế các hàm GPIO_Write bằng hàm tương ứng của Platform bạn dùng
// Ví dụ: digitalWrite(pin, val) cho Arduino hoặc HAL_GPIO_WritePin(...) cho STM32

void Relay_Init(Relay_t* relay, uint16_t pin, RelayTrigger_t trigger) {
    relay->pin = pin;
    relay->trigger = trigger;
    
    // Khởi tạo chân GPIO là OUTPUT ở đây
    pinMode(relay->pin, OUTPUT); 
    
    // Mặc định ban đầu cho Relay tắt
    Relay_Control(relay, RELAY_OFF);
}

void Relay_Control(Relay_t* relay, RelayState_t state) {
    uint8_t logic_level;
    
    if (relay->trigger == RELAY_LOW_LEVEL) {
        // Nếu kích mức thấp: ON = 0V, OFF = 5V
        logic_level = (state == RELAY_ON) ? 0 : 1;
    } else {
        // Nếu kích mức cao: ON = 5V, OFF = 0V
        logic_level = (state == RELAY_ON) ? 1 : 0;
    }
    
    // Ghi giá trị ra chân GPIO
    digitalWrite(relay->pin, logic_level);
}

void Relay_Toggle(Relay_t* relay) {
    // Đọc trạng thái hiện tại và đảo ngược lại
    uint8_t logic_level = !digitalRead(relay->pin);
    digitalWrite(relay->pin, logic_level);
}