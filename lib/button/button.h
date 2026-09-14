#ifndef __BUTTON_H
#define __BUTTON_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t pin;
    bool last_reading;
    uint32_t last_debounce_time;
    bool is_pressed; // Cờ báo hiệu có một lần nhấn vừa xảy ra
} Button_t;

void Button_Init(Button_t *btn, uint8_t pin);
bool Button_WasClicked(Button_t *btn); // Hàm này trả về true 1 lần duy nhất khi bấm

#ifdef __cplusplus
}
#endif

#endif