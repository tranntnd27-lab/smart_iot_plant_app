#ifndef __BUZZER_H
#define __BUZZER_H

#include <stdint.h>
#include <Arduino.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t pin;
    uint8_t channel;    // Kênh PWM (dành cho ESP32 ledc)
    uint32_t frequency; // Tần số âm thanh (Hz)
} Buzzer_t;

// Khởi tạo còi (Chân pin và kênh PWM từ 0-15)
void Buzzer_Init(Buzzer_t *bz, uint8_t pin, uint8_t channel);

// Bật còi với tần số cụ thể (Dành cho còi thụ động/Passive)
void Buzzer_Tone(Buzzer_t *bz, uint32_t freq);

// Tắt còi
void Buzzer_NoTone(Buzzer_t *bz);

// Kêu một tiếng bíp ngắn (Non-blocking sử dụng delay đơn giản)
void Buzzer_Beep(Buzzer_t *bz, uint32_t freq, uint32_t duration);

// Phát một tiếng "tít" thông báo nhẹ (Dùng cho nút nhấn)
void Buzzer_Notify(Buzzer_t *bz);

#ifdef __cplusplus
}
#endif

#endif