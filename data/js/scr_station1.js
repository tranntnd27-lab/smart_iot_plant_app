var database = firebase.database();

// Historical data arrays for charts
var lightChart = [33, 25, 15, 5, 16];
var rainChart = [10, 13, 14, 8, 4]; // Used for Soil Moisture
var temptChart = [28, 29, 30, 35, 32, 28, 30, 33, 31, 29];
var humidChart = [70, 72, 75, 70, 68, 70, 75, 78, 72, 70];

// Warning sound and flag
var audio = new Audio("mp3/warn.mp3");
var hasPushedToHistory = false;
var hasPushedToHistory1 = false;
var hasPushedToHistorySoil = false;
var hasPushedToHistoryLight = false;

// BAR CHART (Soil Moisture & Light)
const barChartOptions = {
  series: [
    {
      name: "Độ ẩm đất",
      data: rainChart,
    },
    {
      name: "Ánh sáng",
      data: lightChart,
    },
  ],
  chart: {
    type: "bar",
    height: 290,
    toolbar: {
      show: false,
    },
  },
  theme: {
    mode: "light",
  },
  colors: ["#10b981", "#fbbf24"], // Emerald green and warm yellow
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "55%",
      borderRadius: 4,
    },
  },
  dataLabels: {
    enabled: false,
  },
  legend: {
    show: true,
    position: "top",
    fontFamily: "Montserrat",
  },
  xaxis: {
    categories: ["Hôm nay", "Hôm qua", "2 ngày trước", "3 ngày trước", "4 ngày trước"],
    labels: {
      style: {
        fontFamily: "Montserrat",
      },
    },
  },
  yaxis: [
    {
      title: {
        text: "Độ ẩm đất (%)",
        style: {
          fontFamily: "Montserrat",
        },
      },
      min: 0,
      max: 100,
    },
    {
      opposite: true,
      title: {
        text: "Ánh sáng (%)",
        style: {
          fontFamily: "Montserrat",
        },
      },
      min: 0,
      max: 100,
    },
  ],
};

var barChart = new ApexCharts(
  document.querySelector("#bar-chart"),
  barChartOptions
);
barChart.render();

// AREA CHART (Temperature & Humidity)
const areaChartOptions = {
  series: [
    {
      name: "Nhiệt độ",
      data: temptChart,
    },
    {
      name: "Độ ẩm khí",
      data: humidChart,
    },
  ],
  chart: {
    height: 290,
    type: "area",
    toolbar: {
      show: false,
    },
  },
  theme: {
    mode: "light",
  },
  colors: ["#ef4444", "#3b82f6"], // Red and blue
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
    width: 3,
  },
  labels: ["Live", "1h", "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h"],
  xaxis: {
    labels: {
      style: {
        fontFamily: "Montserrat",
      },
    },
  },
  markers: {
    size: 4,
  },
  yaxis: [
    {
      title: {
        text: "Nhiệt độ (°C)",
        style: {
          fontFamily: "Montserrat",
        },
      },
      min: 0,
      max: 50,
    },
    {
      opposite: true,
      title: {
        text: "Độ ẩm không khí (%)",
        style: {
          fontFamily: "Montserrat",
        },
      },
      min: 0,
      max: 100,
    },
  ],
  tooltip: {
    shared: true,
    intersect: false,
    style: {
      fontFamily: "Montserrat",
    },
  },
};

const areaChart = new ApexCharts(
  document.querySelector("#area-chart"),
  areaChartOptions
);
areaChart.render();

// ------------------- REAL-TIME SENSOR READING & THRESHOLDS -------------------

// 1. Temperature Listener
database.ref("/vuon/Nhietdo").on("value", function (snapshot) {
  var tempt = snapshot.val();
  if (tempt !== null && tempt !== undefined) {
    document.getElementById("tempt").innerHTML = tempt;
    
    // Check threshold
    database.ref("/Threshold/Tempt").on("value", function (threshSnap) {
      var tempt_th = threshSnap.val();
      if (tempt_th !== null && tempt_th !== undefined) {
        var el = document.getElementById("tempt");
        if (tempt > tempt_th) {
          el.style.color = "red";
          el.style.animation = "blink 1s infinite";
          if (!hasPushedToHistory1) {
            audio.play().catch(function(e){ console.log("Audio play blocked", e); });
            firebase.database().ref("/AlarmMess").set({
              mess: "Nhiệt độ không khí quá cao!",
            });
            hasPushedToHistory1 = true;
          }
        } else {
          el.style.color = "";
          el.style.animation = "none";
          hasPushedToHistory1 = false;
        }
      }
    });
  }
});

// 2. Humidity Listener
database.ref("/vuon/Doam").on("value", function (snapshot) {
  var humi = snapshot.val();
  if (humi !== null && humi !== undefined) {
    document.getElementById("humi").innerHTML = humi;
    
    // Check threshold
    database.ref("/Threshold/Humi").on("value", function (threshSnap) {
      var humi_th = threshSnap.val();
      if (humi_th !== null && humi_th !== undefined) {
        var el = document.getElementById("humi");
        if (humi < humi_th) {
          el.style.color = "red";
          el.style.animation = "blink 1s infinite";
          if (!hasPushedToHistory) {
            audio.play().catch(function(e){ console.log("Audio play blocked", e); });
            firebase.database().ref("/AlarmMess").set({
              mess: "Độ ẩm không khí quá thấp!",
            });
            hasPushedToHistory = true;
          }
        } else {
          el.style.color = "";
          el.style.animation = "none";
          hasPushedToHistory = false;
        }
      }
    });
  }
});

// 3. Soil Moisture Listener
function setupSoilListener() {
  database.ref("/vuon/Doamdat").on("value", function (snapshot) {
    updateSoilMoistureValue(snapshot.val());
  });
}

function updateSoilMoistureValue(value) {
  if (value === null || value === undefined) return;
  document.getElementById("soil").innerHTML = value;

  // Check threshold
  database.ref("/thietbi/MayBom_power").on("value", function (threshSnap) {
    checkSoilMoistureThreshold(value, threshSnap.val());
  });
}

function checkSoilMoistureThreshold(value, threshold) {
  if (threshold === null || threshold === undefined) threshold = 50;
  var el = document.getElementById("soil");
  if (value < threshold) {
    el.style.color = "red";
    el.style.animation = "blink 1s infinite";
    if (!hasPushedToHistorySoil) {
      audio.play().catch(function(e){ console.log("Audio play blocked", e); });
      firebase.database().ref("/AlarmMess").set({
        mess: "Độ ẩm đất quá thấp! Cần tưới nước!",
      });
      hasPushedToHistorySoil = true;
    }
  } else {
    el.style.color = "";
    el.style.animation = "none";
    hasPushedToHistorySoil = false;
  }
}
setupSoilListener();

// 4. Light Percentage Listener
function setupLightListener() {
  database.ref("/vuon/Doamanhsang").on("value", function (snapshot) {
    updateLightValue(snapshot.val());
  });
}

function updateLightValue(value) {
  if (value === null || value === undefined) return;
  document.getElementById("light").innerHTML = value;

  // Check threshold
  database.ref("/thietbi/DenLED_brightness").on("value", function (threshSnap) {
    checkLightThreshold(value, threshSnap.val());
  });
}

function checkLightThreshold(value, threshold) {
  if (threshold === null || threshold === undefined) threshold = 30;
  var el = document.getElementById("light");
  if (value < threshold) {
    el.style.color = "red";
    el.style.animation = "blink 1s infinite";
    if (!hasPushedToHistoryLight) {
      audio.play().catch(function(e){ console.log("Audio play blocked", e); });
      firebase.database().ref("/AlarmMess").set({
        mess: "Thiếu ánh sáng cho cây trồng!",
      });
      hasPushedToHistoryLight = true;
    }
  } else {
    el.style.color = "";
    el.style.animation = "none";
    hasPushedToHistoryLight = false;
  }
}
setupLightListener();

// ------------------- CHART HISTORICAL DATA UPDATE -------------------

function updateRainChart() {
  database.ref("/vuon/Doamdat").once("value").then(function (snapshot) {
    return snapshot.val();
  }).then(function (soilMoisture) {
    if (soilMoisture === null || soilMoisture === undefined) soilMoisture = 50;
    rainChart.unshift(soilMoisture);
    if (rainChart.length > 5) rainChart.splice(5);

    // Fetch Light level
    return database.ref("/vuon/Doamanhsang").once("value").then(function (lightSnap) {
      return lightSnap.val();
    });
  }).then(function (lightLevel) {
    if (lightLevel === null || lightLevel === undefined) lightLevel = 60;
    lightChart.unshift(lightLevel);
    if (lightChart.length > 5) lightChart.splice(5);

    // Update ApexChart
    barChart.updateSeries([
      { name: "Độ ẩm đất", data: rainChart },
      { name: "Ánh sáng", data: lightChart }
    ]);
  });
}

function updateTemptHumiChart() {
  // Fetch Air Temp
  database.ref("/vuon/Nhietdo").once("value").then(function (snapshot) {
    var tempt = snapshot.val();
    if (tempt === null || tempt === undefined) tempt = 28;
    temptChart.unshift(tempt);
    if (temptChart.length > 10) temptChart.splice(10);

    // Fetch Air Humidity
    return database.ref("/vuon/Doam").once("value");
  }).then(function (humiSnap) {
    var humi = humiSnap.val();
    if (humi === null || humi === undefined) humi = 70;
    humidChart.unshift(humi);
    if (humidChart.length > 10) humidChart.splice(10);

    // Update Area Chart
    areaChart.updateSeries([
      { name: "Nhiệt độ", data: temptChart },
      { name: "Độ ẩm khí", data: humidChart }
    ]);
  });
}

// Update charts every hour (as configured originally)
setInterval(function () {
  updateRainChart();
}, 60 * 60 * 1000);

setInterval(function () {
  updateTemptHumiChart();
}, 60 * 60 * 1000);

// Load charts initially
updateRainChart();
updateTemptHumiChart();
