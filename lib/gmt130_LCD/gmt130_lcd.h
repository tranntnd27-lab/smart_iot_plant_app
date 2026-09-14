#ifndef __GMT130_LCD_H
#define __GMT130_LCD_H

#include <TFT_eSPI.h>

// Khởi tạo đối tượng màn hình
void LCD_Init();
void LCD_Clear(uint16_t color);
void LCD_ShowString(int32_t x, int32_t y, const char* str, uint16_t color, uint8_t size);
void LCD_DrawBox(int32_t x, int32_t y, int32_t w, int32_t h, uint16_t color);

#endif