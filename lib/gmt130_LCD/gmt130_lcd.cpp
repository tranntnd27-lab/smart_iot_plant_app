#include "gmt130_lcd.h"

TFT_eSPI tft = TFT_eSPI(); 

void LCD_Init() {
    tft.init();
    tft.setRotation(0); // Có thể chỉnh 0, 1, 2, 3 tùy hướng màn hình
    tft.fillScreen(TFT_BLACK);
}

void LCD_Clear(uint16_t color) {
    tft.fillScreen(color);
}

void LCD_ShowString(int32_t x, int32_t y, const char* str, uint16_t color, uint8_t size) {
    tft.setTextColor(color, TFT_BLACK);
    tft.setTextSize(size);
    tft.drawString(str, x, y);
}

void LCD_DrawBox(int32_t x, int32_t y, int32_t w, int32_t h, uint16_t color) {
    tft.fillRect(x, y, w, h, color);
}