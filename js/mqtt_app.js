// -------------------------------------------------------------
// SMART PLANT APP - MQTT WEBSOCKET CLIENT (TUẦN 2)
// -------------------------------------------------------------

(function() {
  const MQTT_BROKER = "ws://broker.hivemq.com:8000/mqtt";
  const TOPIC_DATA = "smartfarm_dung/data";
  const TOPIC_CONTROL = "smartfarm_dung/control";

  let client = null;
  let isConnected = false;

  function initMQTT() {
    console.log("[MQTT] Connecting to " + MQTT_BROKER + " ...");

    const clientId = "AndroidApp_" + Math.random().toString(16).substring(2, 10);
    client = mqtt.connect(MQTT_BROKER, {
      clientId: clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 2000
    });

    client.on("connect", function() {
      isConnected = true;
      console.log("[MQTT] Connected successfully as " + clientId);

      updateConnectionStatus(true);

      // Subscribe to plant sensor data
      client.subscribe(TOPIC_DATA, function(err) {
        if (!err) {
          console.log("[MQTT] Subscribed to " + TOPIC_DATA);
        } else {
          console.error("[MQTT] Subscribe error:", err);
        }
      });
    });

    client.on("message", function(topic, message) {
      if (topic === TOPIC_DATA) {
        try {
          const data = JSON.parse(message.toString());
          console.log("[MQTT Data Recv]:", data);
          updateUI(data);
        } catch (e) {
          console.error("[MQTT Data Parse Error]:", e);
        }
      }
    });

    client.on("offline", function() {
      isConnected = false;
      console.warn("[MQTT] Connection offline");
      updateConnectionStatus(false);
    });

    client.on("error", function(err) {
      console.error("[MQTT Error]:", err);
      updateConnectionStatus(false);
    });
  }

  function updateConnectionStatus(connected) {
    const badge = document.getElementById("mqtt-status-badge");
    if (badge) {
      if (connected) {
        badge.innerText = "MQTT: Đã kết nối";
        badge.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
        badge.style.color = "#10b981";
      } else {
        badge.innerText = "MQTT: Mất kết nối";
        badge.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
        badge.style.color = "#ef4444";
      }
    }
  }

  function updateUI(data) {
    // 1. Nhiệt độ
    if (data.temp !== undefined) {
      const tempEl = document.getElementById("app-temp");
      if (tempEl) tempEl.innerText = data.temp + " °C";
    }

    // 2. Độ ẩm không khí
    if (data.hum !== undefined) {
      const humEl = document.getElementById("app-hum");
      if (humEl) humEl.innerText = data.hum + " %";
    }

    // 3. Độ ẩm đất
    if (data.soil !== undefined) {
      const soilEl = document.getElementById("app-soil");
      if (soilEl) soilEl.innerText = data.soil + " %";

      // Đánh giá sức khỏe của cây dựa vào độ ẩm đất
      const healthStatus = document.getElementById("plant-health-status");
      const healthIcon = document.getElementById("plant-health-icon");
      const healthDesc = document.getElementById("plant-health-desc");
      const healthCard = document.getElementById("plant-health-card");

      if (healthStatus && healthCard) {
        if (data.soil >= 40 && data.soil <= 85) {
          healthStatus.innerText = "Cây đang khỏe";
          if (healthDesc) healthDesc.innerText = "Độ ẩm đất lý tưởng, cây phát triển tốt";
          if (healthIcon) healthIcon.innerText = "spa";
          healthCard.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
        } else if (data.soil < 40) {
          healthStatus.innerText = "Cây đang thiếu nước!";
          if (healthDesc) healthDesc.innerText = "Độ ẩm đất thấp (" + data.soil + "%), cần tưới nước ngay";
          if (healthIcon) healthIcon.innerText = "warning";
          healthCard.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
        } else {
          healthStatus.innerText = "Đất đang dư nước!";
          if (healthDesc) healthDesc.innerText = "Độ ẩm đất khá cao (" + data.soil + "%), tạm ngưng tưới";
          if (healthIcon) healthIcon.innerText = "info";
          healthCard.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
        }
      }
    }

    // 4. Ánh sáng
    if (data.light !== undefined) {
      const lightEl = document.getElementById("app-light");
      let lightVal = data.light;
      if (lightVal > 100) {
        lightVal = Math.min(100, Math.round((lightVal / 1000) * 100));
      }
      if (lightEl) lightEl.innerText = lightVal + " %";
    }

    // 5. Trạng thái Bơm
    if (data.pump !== undefined) {
      const pumpBtnOn = document.getElementById("btn-pump-on");
      const pumpBtnOff = document.getElementById("btn-pump-off");
      const pumpStateLabel = document.getElementById("pump-state-label");

      if (pumpStateLabel) {
        pumpStateLabel.innerText = data.pump === 1 ? "ĐANG BẬT" : "ĐANG TẮT";
        pumpStateLabel.style.color = data.pump === 1 ? "#10b981" : "#94a3b8";
      }

      if (pumpBtnOn && pumpBtnOff) {
        if (data.pump === 1) {
          pumpBtnOn.classList.add("active-on");
          pumpBtnOff.classList.remove("active-off");
        } else {
          pumpBtnOn.classList.remove("active-on");
          pumpBtnOff.classList.add("active-off");
        }
      }
    }
  }

  // Hàm gửi tin nhắn MQTT điều khiển Bơm
  window.controlPumpMQTT = function(state) {
    if (!client || !isConnected) {
      alert("Chưa kết nối đến MQTT Broker! Vui lòng kiểm tra lại mạng.");
      return;
    }
    const payload = JSON.stringify({ pump: state });
    client.publish(TOPIC_CONTROL, payload, function(err) {
      if (!err) {
        console.log("[MQTT Publish] Control Pump: " + state);
      } else {
        console.error("[MQTT Publish Error]:", err);
      }
    });
  };

  // Khởi chạy khi DOM sẵn sàng
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMQTT);
  } else {
    initMQTT();
  }
})();
