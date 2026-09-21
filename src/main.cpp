#include "RelayModule.h"
#include "SPIFFS.h"
#include "button.h"
#include "buzzer.h"
#include "dht22.h"
#include "gmt130_lcd.h"
#include "light_sensor.h"
#include "soil_moisture.h"
#include <Arduino.h>
#include <WebServer.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Firebase Libraries
#include <Firebase_ESP_Client.h>
#include <addons/RTDBHelper.h>
#include <addons/TokenHelper.h>

#define FB_API_KEY "AIzaSyBwSEkfbFB7gvV7N0T9UQ0FekHco_npE84"
#define FB_DB_URL "https://chamsoccaytrong-cf669-default-rtdb.firebaseio.com/"
#define FB_SECRET "396qygly1ZjjyIhUOJa9Oh3JYgLNP0MgwrsMFqjE"

// MQTT Configuration (Tuần 2)
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic_data = "smartfarm_dung/data";
const char* mqtt_topic_control = "smartfarm_dung/control";

WiFiClient mqttWiFiClient;
PubSubClient mqttClient(mqttWiFiClient);

// ==========================================
// GLOBALS
// ==========================================
DHT22_Data sensorData;
float global_light = 0;
float global_soil = 0;

Relay_t pump;
Relay_t ledRelay;
Button_t modeBtn;
Button_t button_up;
Button_t button_down;
Buzzer_t buzzer;

int displayMode = 0;
float tempThreshold = 35.0;
float humidityThreshold = 99.0;
float lightThreshold = 80.0;
float soilThreshold = 30.0;

RelayState_t pumpState = RELAY_OFF;
RelayState_t ledState = RELAY_OFF;
int lastPumpState = -1;

// Biến cờ hiệu (dùng volatile để các Task cập nhật an toàn)
volatile bool needsImmediateUpdate = false;
volatile bool thresholdsChangedPhysically = false;
volatile unsigned long lastMqttControlTime = 0;

// Firebase & Server Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WebServer server(80);

// ==========================================
// HÀM ĐIỀU KHIỂN CƠ BẢN
// ==========================================
void controlPump(RelayState_t state) {
  if (pumpState != state) {
    Relay_Control(&pump, state);
    pumpState = state;
    lastPumpState = state;
  }
}

void controlLed(RelayState_t state) {
  if (ledState != state) {
    Relay_Control(&ledRelay, state);
    ledState = state;
  }
}

// ==========================================
// TASK 1: ĐỌC NÚT NHẤN (Ưu tiên cao nhất 4)
// ==========================================
void TaskButtons(void *pvParameters) {
  for (;;) {
    if (Button_WasClicked(&modeBtn)) {
      displayMode++;
      if (displayMode > 4)
        displayMode = 0;
      needsImmediateUpdate = true;
      Serial.printf("Mode changed: %d\n", displayMode);
    }

    if (Button_WasClicked(&button_up)) {
      tempThreshold++;
      humidityThreshold++;
      lightThreshold++;
      soilThreshold++;
      needsImmediateUpdate = true;
      thresholdsChangedPhysically = true;
      Serial.printf("Threshold UP: temp=%.1f\n", tempThreshold);
    }

    if (Button_WasClicked(&button_down)) {
      tempThreshold--;
      humidityThreshold--;
      lightThreshold--;
      soilThreshold--;
      needsImmediateUpdate = true;
      thresholdsChangedPhysically = true;
      Serial.printf("Threshold DOWN: temp=%.1f\n", tempThreshold);
    }

    vTaskDelay(pdMS_TO_TICKS(20)); // Quét siêu nhanh mỗi 20ms, không độ trễ
  }
}

// ==========================================
// TASK 2: XỬ LÝ WEB SERVER (Ưu tiên 2)
// ==========================================
void TaskWebServer(void *pvParameters) {
  for (;;) {
    server.handleClient(); // Xử lý Web mượt mà, không chặn nút nhấn
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// ==========================================
// TASK 3: ĐỌC CẢM BIẾN & LOGIC (Ưu tiên 3)
// ==========================================
void TaskSensorsAndLogic(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(1000); // Đọc mỗi 1s

  for (;;) {
    DHT22_Read(&sensorData);
    global_light = LightSensor_ReadPercent();
    global_soil = Soil_ReadPercent();

    // Nếu vừa có lệnh điều khiển thủ công từ MQTT (App Mobile) thì tạm ngưng logic tự động tắt của cảm biến
    bool isManualMQTT = (millis() - lastMqttControlTime < 15000);

    if (!isManualMQTT) {
      // Logic điều khiển tự động và kích hoạt Còi / Relay cảnh báo tương ứng
      if (displayMode == 0) {
        if (sensorData.temperature > tempThreshold) {
          Buzzer_Tone(&buzzer, 2600);
          controlPump(RELAY_ON);
        } else {
          Buzzer_NoTone(&buzzer);
          controlPump(RELAY_OFF);
        }
      } else if (displayMode == 1) {
        if (sensorData.humidity < humidityThreshold) {
          Buzzer_Tone(&buzzer, 2600);
          controlPump(RELAY_ON);
        } else {
          Buzzer_NoTone(&buzzer);
          controlPump(RELAY_OFF);
        }
      } else if (displayMode == 2) {
        if (global_light < lightThreshold) {
          Buzzer_Tone(&buzzer, 2600);
          controlLed(RELAY_ON);
        } else {
          Buzzer_NoTone(&buzzer);
          controlLed(RELAY_OFF);
        }
      } else if (displayMode == 3) {
        if (global_soil < soilThreshold) {
          Buzzer_Tone(&buzzer, 2600);
          controlPump(RELAY_ON);
        } else {
          Buzzer_NoTone(&buzzer);
          controlPump(RELAY_OFF);
        }
      } else {
        Buzzer_NoTone(&buzzer);
      }
    }

    Serial.printf("T=%.1f H=%.1f L=%.1f%% S=%.1f%% Mode=%d AP_Connected=%d\n",
                  sensorData.temperature, sensorData.humidity, global_light,
                  global_soil, displayMode, WiFi.status() == WL_CONNECTED);

    xTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// ==========================================
// HÀM KIỂM TRA TRẠNG THÁI CẢNH BÁO HIỆN TẠI
// ==========================================
bool isCurrentAlarmActive() {
  if (displayMode == 0)
    return sensorData.temperature > tempThreshold;
  if (displayMode == 1)
    return sensorData.humidity < humidityThreshold;
  if (displayMode == 2)
    return global_light < lightThreshold;
  if (displayMode == 3)
    return global_soil < soilThreshold;
  return false;
}

// ==========================================
// TASK 4: CẬP NHẬT LCD (Ưu tiên 1)
// ==========================================
void TaskLCD(void *pvParameters) {
  int lastDrawnMode = -1;
  bool lastDrawnAlarmState = false;

  for (;;) {
    // Kiểm tra định kỳ 200ms để màn hình nhạy với nút bấm vật lý
    vTaskDelay(pdMS_TO_TICKS(200));

    bool currentAlarm = isCurrentAlarmActive();
    float currentVal = 0;
    float currentLimit = 0;

    if (displayMode == 0) {
      currentVal = sensorData.temperature;
      currentLimit = tempThreshold;
    } else if (displayMode == 1) {
      currentVal = sensorData.humidity;
      currentLimit = humidityThreshold;
    } else if (displayMode == 2) {
      currentVal = global_light;
      currentLimit = lightThreshold;
    } else if (displayMode == 3) {
      currentVal = global_soil;
      currentLimit = soilThreshold;
    }

    // Chỉ vẽ lại khung đen khi đổi chế độ, đổi trạng thái cảnh báo hoặc có yêu
    // cầu ép buộc
    bool needsFullRedraw = (displayMode != lastDrawnMode) ||
                           (currentAlarm != lastDrawnAlarmState) ||
                           needsImmediateUpdate;

    if (needsFullRedraw) {
      needsImmediateUpdate = false;
      lastDrawnMode = displayMode;
      lastDrawnAlarmState = currentAlarm;
      LCD_DrawBox(10, 45, 220, 140, TFT_BLACK);
    }

    char buf[32];
    char phu[32];

    switch (displayMode) {
    case 0:
      if (needsFullRedraw) {
        LCD_ShowString(10, 50, "--- TEMPERATURE ---", TFT_YELLOW, 2);
        if (currentAlarm) {
          LCD_ShowString(30, 100, "HIGH TEMP!", TFT_RED, 3);
        }
      }
      if (currentAlarm) {
        sprintf(buf, "%5.1f C", currentVal);
        LCD_ShowString(30, 150, buf, TFT_RED, 4);
      } else {
        sprintf(buf, "%5.1f C", currentVal);
        sprintf(phu, "limit:%5.1f C", currentLimit);
        LCD_ShowString(30, 100, buf, TFT_GREEN, 4);
        LCD_ShowString(10, 160, phu, TFT_GREEN, 3);
      }
      break;

    case 1:
      if (needsFullRedraw) {
        LCD_ShowString(10, 50, "--- HUMIDITY ---", TFT_YELLOW, 2);
        if (currentAlarm) {
          LCD_ShowString(30, 100, "LOW HUMI!", TFT_RED, 3);
        }
      }
      if (currentAlarm) {
        sprintf(buf, "%5.1f %%", currentVal);
        LCD_ShowString(30, 150, buf, TFT_RED, 4);
      } else {
        sprintf(buf, "%5.1f %%", currentVal);
        sprintf(phu, "limit:%5.1f %%", humidityThreshold);
        LCD_ShowString(30, 100, buf, TFT_CYAN, 4);
        LCD_ShowString(10, 160, phu, TFT_CYAN, 3);
      }
      break;

    case 2:
      if (needsFullRedraw) {
        LCD_ShowString(10, 50, "----- LIGHT ------", TFT_YELLOW, 2);
        if (currentAlarm) {
          LCD_ShowString(30, 100, "LOW LIGHT!", TFT_RED, 3);
        }
      }
      if (currentAlarm) {
        sprintf(buf, "%5.1f %%", currentVal);
        LCD_ShowString(30, 150, buf, TFT_RED, 4);
      } else {
        sprintf(buf, "%5.1f %%", currentVal);
        sprintf(phu, "limit:%5.1f %%", lightThreshold);
        LCD_ShowString(30, 100, buf, TFT_ORANGE, 4);
        LCD_ShowString(10, 160, phu, TFT_ORANGE, 3);
      }
      break;

    case 3:
      if (needsFullRedraw) {
        LCD_ShowString(10, 50, "----- SOIL -----", TFT_YELLOW, 2);
        if (currentAlarm) {
          LCD_ShowString(30, 100, "LOW SOIL!", TFT_RED, 3);
        }
      }
      if (currentAlarm) {
        sprintf(buf, "%5.1f %%", currentVal);
        LCD_ShowString(30, 150, buf, TFT_RED, 4);
      } else {
        sprintf(buf, "%5.1f %%", currentVal);
        sprintf(phu, "limit:%5.1f %%", soilThreshold);
        LCD_ShowString(30, 100, buf, TFT_BLUE, 4);
        LCD_ShowString(10, 160, phu, TFT_BLUE, 3);
      }
      break;

    case 4:
      static int case4Counter = 0;
      case4Counter++;
      if (needsFullRedraw || case4Counter >= 5) {
        case4Counter = 0;
        LCD_ShowString(10, 45, "AP: SmartFarm_Dung  ", TFT_CYAN, 2);
        char apIpBuf[30];
        sprintf(apIpBuf, "AP IP: %s      ", WiFi.softAPIP().toString().c_str());
        LCD_ShowString(10, 75, apIpBuf, TFT_CYAN, 2);

        if (WiFi.status() == WL_CONNECTED) {
          LCD_ShowString(10, 110, "ROUTER: CONNECTED   ", TFT_GREEN, 2);
          char routeIp[30];
          sprintf(routeIp, "IP: %s          ",
                  WiFi.localIP().toString().c_str());
          LCD_ShowString(10, 140, routeIp, TFT_GREEN, 2);

          if (Firebase.ready()) {
            LCD_ShowString(10, 170, "FIREBASE: READY      ", TFT_GREEN, 2);
          } else {
            char fbErr[30];
            sprintf(fbErr, "FB: %-16.16s", fbdo.errorReason().c_str());
            LCD_ShowString(10, 170, fbErr, TFT_RED, 2);
          }
        } else {
          LCD_ShowString(10, 110, "ROUTER: DISCONNECTED", TFT_RED, 2);
          LCD_ShowString(10, 140, "IP: (None)          ", TFT_RED, 2);
          LCD_ShowString(10, 170, "FIREBASE: NO INTERNET", TFT_RED, 2);
        }
      }
      break;
    }

    if (needsFullRedraw) {
      LCD_ShowString(0, 220, "Have a nice day!", 0xF81F, 2.8);
    }
  }
}

// ==========================================
// TASK 5: FIREBASE (Đẩy sang Lõi 0)
// ==========================================
// ==========================================
// TASK 5: FIREBASE (Đẩy sang Lõi 0)
// ==========================================
void TaskFirebase(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(2000); // Vòng lặp chạy mỗi 2 giây

  int sensorUploadCounter = 0;
  int thresholdSyncCounter = 0;

  for (;;) {
    if (Firebase.ready() && WiFi.status() == WL_CONNECTED) {
      bool netOk = true;

      // 1. Đồng bộ trạng thái đèn LED
      if (netOk) {
        if (millis() - lastMqttControlTime < 10000) {
          // Vừa điều khiển từ MQTT (App Android): Ưu tiên đẩy trạng thái MQTT lên Firebase
          Firebase.RTDB.setInt(&fbdo, "/thietbi/DenLED", ledState == RELAY_ON ? 1 : 0);
        } else if (displayMode !=
            2) { // LED ở chế độ thủ công (được điều khiển từ Firebase)
          if (Firebase.RTDB.getInt(&fbdo, "/thietbi/DenLED")) {
            if (fbdo.dataType() != "null") {
              int val = fbdo.intData();
              RelayState_t targetLedState = (val == 1) ? RELAY_ON : RELAY_OFF;
              if (ledState != targetLedState) {
                controlLed(targetLedState);
                Serial.printf("Firebase: LED thay doi sang %s (Thu cong)\n",
                              val == 1 ? "ON" : "OFF");
              }
            }
          } else {
            Serial.printf("Firebase Read LED Error: %s\n",
                          fbdo.errorReason().c_str());
            netOk = false; // Ngừng thực hiện các lệnh gọi mạng tiếp theo trong
                           // chu kỳ này
          }
        } else { // LED ở chế độ tự động (displayMode == 2)
          // Đẩy trạng thái tự động của LED lên Firebase để web cập nhật UI
          static RelayState_t lastUploadedLedState = RELAY_OFF;
          static bool firstRunLed = true;
          if (firstRunLed || ledState != lastUploadedLedState) {
            if (Firebase.RTDB.setInt(&fbdo, "/thietbi/DenLED",
                                     ledState == RELAY_ON ? 1 : 0)) {
              lastUploadedLedState = ledState;
              firstRunLed = false;
              Serial.printf("Firebase: Da day trang thai LED tu dong (%d)\n",
                            ledState == RELAY_ON ? 1 : 0);
            } else {
              Serial.printf("Firebase Write LED Error: %s\n",
                            fbdo.errorReason().c_str());
              netOk = false;
            }
          }
        }
      }

      // 2. Đồng bộ trạng thái bơm
      if (netOk) {
        if (millis() - lastMqttControlTime < 10000) {
          // Vừa điều khiển từ MQTT (App Android): Ưu tiên đẩy trạng thái MQTT lên Firebase
          Firebase.RTDB.setInt(&fbdo, "/thietbi/MayBom", pumpState == RELAY_ON ? 1 : 0);
        } else if (displayMode == 4 ||
            displayMode ==
                2) { // Bơm ở chế độ thủ công (được điều khiển từ Firebase)
          if (Firebase.RTDB.getInt(&fbdo, "/thietbi/MayBom")) {
            if (fbdo.dataType() != "null") {
              int val = fbdo.intData();
              RelayState_t targetPumpState = (val == 1) ? RELAY_ON : RELAY_OFF;
              if (pumpState != targetPumpState) {
                controlPump(targetPumpState);
                Serial.printf("Firebase: Bơm thay doi sang %s (Thu cong)\n",
                              val == 1 ? "ON" : "OFF");
              }
            }
          } else {
            Serial.printf("Firebase Read Pump Error: %s\n",
                          fbdo.errorReason().c_str());
            netOk = false;
          }
        } else { // Bơm ở chế độ tự động (displayMode 0, 1, 3)
          // Đẩy trạng thái tự động của bơm lên Firebase để web cập nhật UI
          static RelayState_t lastUploadedPumpState = RELAY_OFF;
          static bool firstRun = true;
          if (firstRun || pumpState != lastUploadedPumpState) {
            if (Firebase.RTDB.setInt(&fbdo, "/thietbi/MayBom",
                                     pumpState == RELAY_ON ? 1 : 0)) {
              lastUploadedPumpState = pumpState;
              firstRun = false;
              Serial.printf("Firebase: Da day trang thai bom tu dong (%d)\n",
                            pumpState == RELAY_ON ? 1 : 0);
            } else {
              Serial.printf("Firebase Write Pump Error: %s\n",
                            fbdo.errorReason().c_str());
              netOk = false;
            }
          }
        }
      }

      // 3. Đồng bộ các ngưỡng cài đặt (Thresholds)
      if (netOk) {
        if (thresholdsChangedPhysically) {
          // Đẩy các thay đổi từ nút bấm vật lý lên Firebase
          bool success = true;
          success &=
              Firebase.RTDB.setFloat(&fbdo, "/Threshold/Tempt", tempThreshold);
          success &= Firebase.RTDB.setFloat(&fbdo, "/Threshold/Humi",
                                            humidityThreshold);
          success &= Firebase.RTDB.setFloat(&fbdo, "/thietbi/MayBom_power",
                                            soilThreshold);
          success &= Firebase.RTDB.setFloat(&fbdo, "/thietbi/DenLED_brightness",
                                            lightThreshold);
          if (success) {
            thresholdsChangedPhysically = false;
            Serial.println(
                "Firebase: Da cap nhat cac nguong tu nut bam vat ly.");
          } else {
            Serial.printf("Firebase Write Thresholds Error: %s\n",
                          fbdo.errorReason().c_str());
            netOk = false;
          }
        } else {
          // Định kỳ lấy các ngưỡng từ Firebase về (mỗi 10 giây)
          thresholdSyncCounter++;
          if (thresholdSyncCounter >= 5) { // 5 * 2s = 10s
            thresholdSyncCounter = 0;

            if (Firebase.RTDB.getFloat(&fbdo, "/Threshold/Tempt") &&
                fbdo.dataType() != "null") {
              float val = fbdo.floatData();
              if (val != tempThreshold) {
                tempThreshold = val;
                needsImmediateUpdate = true;
                Serial.printf("Firebase: tempThreshold cap nhat = %.1f\n",
                              tempThreshold);
              }
            } else if (fbdo.errorReason().length() > 0 &&
                       fbdo.dataType() == "null") {
              // Không làm gì, chỉ là đường dẫn không tồn tại trên Firebase
            } else if (fbdo.errorReason().length() > 0) {
              Serial.printf("Firebase Read TempThreshold Error: %s\n",
                            fbdo.errorReason().c_str());
              netOk = false;
            }

            if (netOk && Firebase.RTDB.getFloat(&fbdo, "/Threshold/Humi") &&
                fbdo.dataType() != "null") {
              float val = fbdo.floatData();
              if (val != humidityThreshold) {
                humidityThreshold = val;
                needsImmediateUpdate = true;
                Serial.printf("Firebase: humidityThreshold cap nhat = %.1f\n",
                              humidityThreshold);
              }
            } else if (netOk && fbdo.errorReason().length() > 0 &&
                       fbdo.dataType() == "null") {
              // Tương tự
            } else if (netOk && fbdo.errorReason().length() > 0) {
              Serial.printf("Firebase Read HumiThreshold Error: %s\n",
                            fbdo.errorReason().c_str());
              netOk = false;
            }

            if (netOk &&
                Firebase.RTDB.getFloat(&fbdo, "/thietbi/MayBom_power") &&
                fbdo.dataType() != "null") {
              float val = fbdo.floatData();
              if (val != soilThreshold) {
                soilThreshold = val;
                needsImmediateUpdate = true;
                Serial.printf("Firebase: soilThreshold cap nhat = %.1f\n",
                              soilThreshold);
              }
            } else if (netOk && fbdo.errorReason().length() > 0 &&
                       fbdo.dataType() == "null") {
              // Tương tự
            } else if (netOk && fbdo.errorReason().length() > 0) {
              Serial.printf("Firebase Read SoilThreshold Error: %s\n",
                            fbdo.errorReason().c_str());
              netOk = false;
            }

            if (netOk &&
                Firebase.RTDB.getFloat(&fbdo, "/thietbi/DenLED_brightness") &&
                fbdo.dataType() != "null") {
              float val = fbdo.floatData();
              if (val != lightThreshold) {
                lightThreshold = val;
                needsImmediateUpdate = true;
                Serial.printf("Firebase: lightThreshold cap nhat = %.1f\n",
                              lightThreshold);
              }
            } else if (netOk && fbdo.errorReason().length() > 0 &&
                       fbdo.dataType() == "null") {
              // Tương tự
            } else if (netOk && fbdo.errorReason().length() > 0) {
              Serial.printf("Firebase Read LightThreshold Error: %s\n",
                            fbdo.errorReason().c_str());
              netOk = false;
            }

          }
        }
      }

      // 4. Đẩy dữ liệu cảm biến định kỳ lên Firebase (mỗi 30 giây)
      if (netOk) {
        sensorUploadCounter++;
        if (sensorUploadCounter >= 15) { // 15 * 2s = 30s
          sensorUploadCounter = 0;

          float roundedTemp = roundf(sensorData.temperature * 10.0f) / 10.0f;
          float roundedHumi = roundf(sensorData.humidity * 10.0f) / 10.0f;
          float roundedSoil = roundf(global_soil * 10.0f) / 10.0f;
          float roundedLight = roundf(global_light * 10.0f) / 10.0f;

          bool uploadSuccess = true;
          uploadSuccess &=
              Firebase.RTDB.setFloat(&fbdo, "/vuon/Nhietdo", roundedTemp);
          uploadSuccess &=
              Firebase.RTDB.setFloat(&fbdo, "/vuon/Doam", roundedHumi);
          uploadSuccess &=
              Firebase.RTDB.setFloat(&fbdo, "/vuon/Doamdat", roundedSoil);
          uploadSuccess &=
              Firebase.RTDB.setFloat(&fbdo, "/vuon/Doamanhsang", roundedLight);

          if (uploadSuccess) {
            Serial.println("Firebase: Da day du lieu cam bien.");
          } else {
            Serial.printf("Firebase Upload Sensors Error: %s\n",
                          fbdo.errorReason().c_str());
            netOk = false;
          }
        }
      }
    } else {
      // Hiển thị lỗi chẩn đoán nếu WiFi đã kết nối nhưng Firebase chưa sẵn sàng
      if (WiFi.status() == WL_CONNECTED && !Firebase.ready()) {
        static unsigned long lastErrorPrint = 0;
        if (millis() - lastErrorPrint > 5000) {
          lastErrorPrint = millis();
          Serial.printf("Firebase Chua San Sang. Ly do: %s\n",
                        fbdo.errorReason().c_str());
        }
      }
    }

    xTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// ==========================================
// TASK 6: MQTT (PUBLISH & SUBSCRIBE TUẦN 2)
// ==========================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.printf("MQTT Recv [%s]: %s\n", topic, message.c_str());

  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (!error) {
    if (doc.containsKey("pump")) {
      int pVal = doc["pump"];
      controlPump(pVal == 1 ? RELAY_ON : RELAY_OFF);
      lastMqttControlTime = millis();
      Serial.printf("MQTT -> Pump %s\n", pVal == 1 ? "ON" : "OFF");
    }
    if (doc.containsKey("led")) {
      int lVal = doc["led"];
      controlLed(lVal == 1 ? RELAY_ON : RELAY_OFF);
      lastMqttControlTime = millis();
      Serial.printf("MQTT -> LED %s\n", lVal == 1 ? "ON" : "OFF");
    }
  } else {
    if (message.indexOf("PUMP_ON") >= 0 || message.indexOf("ON") >= 0) {
      controlPump(RELAY_ON);
    } else if (message.indexOf("PUMP_OFF") >= 0 || message.indexOf("OFF") >= 0) {
      controlPump(RELAY_OFF);
    }
  }
}

void TaskMQTT(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(2000); // 2 giây gửi 1 lần

  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);

  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      // Thử tự động kết nối lại Wi-Fi Router ngầm mỗi 5 giây
      static unsigned long lastWifiRetry = 0;
      if (millis() - lastWifiRetry > 5000) {
        lastWifiRetry = millis();
        Serial.println("[Wi-Fi] Auto-reconnecting to Router...");
        WiFi.reconnect();
      }
    } else {
      if (!mqttClient.connected()) {
        Serial.print("[MQTT] Connecting to MQTT Broker (HiveMQ)...");
        String clientId = "ESP32Plant-";
        clientId += String(random(0xffff), HEX);
        if (mqttClient.connect(clientId.c_str())) {
          Serial.println(" -> Connected!");
          mqttClient.subscribe(mqtt_topic_control);
        } else {
          Serial.printf(" -> Connect failed, rc=%d\n", mqttClient.state());
        }
      } else {
        mqttClient.loop();

        // Đóng gói JSON gửi dữ liệu cảm biến thực tế
        StaticJsonDocument<200> doc;
        doc["temp"] = roundf(sensorData.temperature * 10.0f) / 10.0f;
        doc["hum"] = roundf(sensorData.humidity * 10.0f) / 10.0f;
        doc["soil"] = roundf(global_soil * 10.0f) / 10.0f;
        doc["light"] = roundf(global_light * 10.0f) / 10.0f;
        doc["pump"] = (pumpState == RELAY_ON) ? 1 : 0;
        doc["led"] = (ledState == RELAY_ON) ? 1 : 0;

        char payload[200];
        serializeJson(doc, payload);
        mqttClient.publish(mqtt_topic_data, payload);
        Serial.printf("[MQTT Published]: %s\n", payload);
      }
    }
    xTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// ==========================================
// SETUP CHÍNH
// ==========================================
void setup() {
  Serial.begin(115200);
  Serial.println("System starting with FreeRTOS...");

  // 1. SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS Mount Failed");
  } else {
    Serial.println("SPIFFS mounted successfully.");
  }

  // 2. WIFI
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("SmartFarm_Dung", "12345678");
  Serial.print("AP IP Address: ");
  Serial.println(WiFi.softAPIP());

  WiFi.begin("ThHang","30044003");
  Serial.print("Connecting to WiFi Router...");
  int wifiRetry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetry < 20) {
    delay(500);
    Serial.print(".");
    wifiRetry++;
  }

  // Luôn khởi tạo cấu hình Firebase để tự động kết nối lại khi có mạng
  config.api_key = FB_API_KEY;
  config.database_url = FB_DB_URL;
  config.signer.tokens.legacy_token = FB_SECRET;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
  } else {
    Serial.println("\nWiFi connection pending (will connect in background).");
  }

  // 3. WEB SERVER
  server.on("/", []() {
    File file = SPIFFS.open("/index.html", "r");
    if (file) {
      server.streamFile(file, "text/html");
      file.close();
    } else {
      server.send(404, "text/plain", "index.html not found");
    }
  });
  server.on("/control.html", []() {
    File file = SPIFFS.open("/control.html", "r");
    if (file) {
      server.streamFile(file, "text/html");
      file.close();
    } else {
      server.send(404, "text/plain", "control.html not found");
    }
  });
  server.on("/app_android.html", []() {
    File file = SPIFFS.open("/app_android.html", "r");
    if (file) {
      server.streamFile(file, "text/html");
      file.close();
    } else {
      server.send(404, "text/plain", "app_android.html not found");
    }
  });
  server.onNotFound([]() {
    String path = server.uri();
    String contentType = "text/plain";
    if (path.endsWith(".html"))
      contentType = "text/html";
    else if (path.endsWith(".css"))
      contentType = "text/css";
    else if (path.endsWith(".js"))
      contentType = "application/javascript";
    else if (path.endsWith(".png"))
      contentType = "image/png";
    else if (path.endsWith(".jpg") || path.endsWith(".jpeg"))
      contentType = "image/jpeg";
    else if (path.endsWith(".ico"))
      contentType = "image/x-icon";
    else if (path.endsWith(".mp3"))
      contentType = "audio/mpeg";

    if (SPIFFS.exists(path)) {
      File file = SPIFFS.open(path, "r");
      server.streamFile(file, contentType);
      file.close();
    } else {
      server.send(404, "text/plain", "File not found: " + path);
    }
  });
  server.begin();

  // 4. KHỞI TẠO HARDWARE
  Button_Init(&modeBtn, 26);
  Button_Init(&button_up, 27);
  Button_Init(&button_down, 4);
  Buzzer_Init(&buzzer, 12, 0);
  Relay_Init(&pump, 25, RELAY_LOW_LEVEL);
  Relay_Init(&ledRelay, 17, RELAY_LOW_LEVEL);
  LCD_Init();
  DHT22_Init();
  LightSensor_Init();
  Soil_Init();

  LCD_Clear(TFT_BLACK);
  LCD_ShowString(10, 5, "SMART AGRI MONITOR", TFT_YELLOW, 2);
  LCD_DrawBox(10, 28, 220, 2, TFT_WHITE);

  // 5. KHỞI TẠO FREERTOS TASKS
  // Lõi 1 (Core 1)
  xTaskCreatePinnedToCore(TaskButtons, "Buttons", 3072, NULL, 4, NULL, 1);
  xTaskCreatePinnedToCore(TaskSensorsAndLogic, "Sensors", 6144, NULL, 3, NULL, 1);
  xTaskCreatePinnedToCore(TaskWebServer, "Web", 6144, NULL, 2, NULL, 1);
  xTaskCreatePinnedToCore(TaskLCD, "LCD", 6144, NULL, 1, NULL, 1);

  // Lõi 0 (Core 0) xử lý mạng - Tạm dừng Firebase để ưu tiên 100% tài nguyên cho MQTT App Android
  // xTaskCreatePinnedToCore(TaskFirebase, "Firebase", 12288, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(TaskMQTT, "MQTT", 8192, NULL, 1, NULL, 0);
}

void loop() {
  // Để trống hoàn toàn, xóa task loop gốc để trả lại tài nguyên cho RTOS
  vTaskDelete(NULL);
}