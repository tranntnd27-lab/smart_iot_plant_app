#include "button.h"
#include <Arduino.h>

void Button_Init(Button_t *btn, uint8_t pin) {
    btn->pin = pin;
    btn->last_reading = HIGH; // Trạng thái cũ là chưa bấm
    btn->last_debounce_time = 0;
    pinMode(btn->pin, INPUT_PULLUP);
}

bool Button_WasClicked(Button_t *btn) {
    bool current_reading = digitalRead(btn->pin);
    bool result = false;

    // Kiểm tra xem trạng thái có thay đổi so với lần đọc trước không
    if (current_reading != btn->last_reading) {
        // Nếu thay đổi, kiểm tra xem có phải là từ 1 (thả) xuống 0 (nhấn) không
        if (current_reading == LOW) {
            // Debounce giảm từ 200ms xuống 50ms để response nhanh hơn
            if ((millis() - btn->last_debounce_time) > 50) { 
                result = true; // Xác nhận một cú Click
                btn->last_debounce_time = millis();
            }
        }
    }
    
    btn->last_reading = current_reading; // Cập nhật trạng thái cũ
    return result;
}