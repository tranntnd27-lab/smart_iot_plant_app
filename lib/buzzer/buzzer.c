#include "buzzer.h"

void Buzzer_Init(Buzzer_t *bz, uint8_t pin, uint8_t channel) {
    bz->pin = pin;
    bz->channel = channel;
    bz->frequency = 2000; // Mặc định 2kHz

    // Cấu hình LEDC cho ESP32
    ledcSetup(bz->channel, bz->frequency, 8); // 8-bit resolution
    ledcAttachPin(bz->pin, bz->channel);
    
    // Đảm bảo ban đầu còi không kêu
    ledcWrite(bz->channel, 0);
}

void Buzzer_Tone(Buzzer_t *bz, uint32_t freq) {
    ledcWriteTone(bz->channel, freq);
}

void Buzzer_NoTone(Buzzer_t *bz) {
    ledcWrite(bz->channel, 0);
}

void Buzzer_Beep(Buzzer_t *bz, uint32_t freq, uint32_t duration) {
    Buzzer_Tone(bz, freq);
    delay(duration);
    Buzzer_NoTone(bz);
}

void Buzzer_Notify(Buzzer_t *bz) {
    // Tiếng bíp ngắn 2.5kHz trong 50ms (rất phù hợp cho phản hồi nút bấm)
    Buzzer_Beep(bz, 2500, 50);
}