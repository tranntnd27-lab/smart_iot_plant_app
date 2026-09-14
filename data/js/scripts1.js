// -------------------------------------------------------------
// SMART CROP CONTROL - EVENT LISTENERS & FIREBASE INTEGRATION
// -------------------------------------------------------------

const lampBtnOn = document.getElementById("lamp_btn_on");
const lampBtnOff = document.getElementById("lamp_btn_off");
const pumpBtnOn = document.getElementById("pump_btn_on");
const pumpBtnOff = document.getElementById("pump_btn_off");

// Warning/vacuum audio configuration
var audio = new Audio("mp3/val.mp3");

// 1. Grow Light UI & Firebase synchronization
if (lampBtnOn && lampBtnOff) {
  lampBtnOn.addEventListener("click", function () {
    firebase.database().ref("/thietbi/DenLED").set(1);
    updateLampUI(1);
  });
  lampBtnOff.addEventListener("click", function () {
    firebase.database().ref("/thietbi/DenLED").set(0);
    updateLampUI(0);
  });
}

function updateLampUI(level) {
  var cardEl = document.getElementById("card-lamp");
  var statusEl = document.getElementById("lamp-status");
  var btnOn = document.getElementById("lamp_btn_on");
  var btnOff = document.getElementById("lamp_btn_off");
  
  if (btnOn && btnOff) {
    if (level == 1) {
      btnOn.classList.add("active");
      btnOff.classList.remove("active");
    } else {
      btnOn.classList.remove("active");
      btnOff.classList.add("active");
    }
  }

  if (cardEl && statusEl) {
    if (level == 1) {
      cardEl.classList.add("active");
      statusEl.innerText = "Đang Bật";
    } else {
      cardEl.classList.remove("active");
      statusEl.innerText = "Đang Tắt";
    }
  }
}

// 2. Water Pump UI & Firebase synchronization
if (pumpBtnOn && pumpBtnOff) {
  pumpBtnOn.addEventListener("click", function () {
    firebase.database().ref("/thietbi/MayBom").set(1);
    updatePumpUI(1);
  });
  pumpBtnOff.addEventListener("click", function () {
    firebase.database().ref("/thietbi/MayBom").set(0);
    updatePumpUI(0);
  });
}

function updatePumpUI(state) {
  var cardEl = document.getElementById("card-pump");
  var statusEl = document.getElementById("pump-status");
  var btnOn = document.getElementById("pump_btn_on");
  var btnOff = document.getElementById("pump_btn_off");
  
  if (btnOn && btnOff) {
    if (state == 1) {
      btnOn.classList.add("active");
      btnOff.classList.remove("active");
    } else {
      btnOn.classList.remove("active");
      btnOff.classList.add("active");
    }
  }

  if (cardEl && statusEl) {
    if (state == 1) {
      cardEl.classList.add("active");
      statusEl.innerText = "Đang Bật";
      audio.currentTime = 0;
      audio.play().catch(function(e) { console.log("Sound play blocked", e); });
    } else {
      cardEl.classList.remove("active");
      statusEl.innerText = "Đang Tắt";
      audio.currentTime = 0;
      audio.pause();
    }
  }
}

// ----------------- FEATURE BUTTONS (QUICK ACTIONS) -----------------

var btnDef = document.getElementById("def_but");
var btnAllOn = document.getElementById("all_on");
var btnAllOff = document.getElementById("all_off"); // Opens modal

if (btnDef) {
  btnDef.onclick = function () {
    firebase.database().ref("/thietbi/DenLED").set(0);
    firebase.database().ref("/thietbi/MayBom").set(0);

    updateLampUI(0);
    updatePumpUI(0);
  };
}

if (btnAllOn) {
  btnAllOn.onclick = function () {
    firebase.database().ref("/thietbi/DenLED").set(1);
    firebase.database().ref("/thietbi/MayBom").set(1);

    updateLampUI(1);
    updatePumpUI(1);
  };
}

// ------------------- LOAD INITIAL DEVICE STATES -------------------
var hasExecuted = false;
if (!hasExecuted) {
  // Lamp State
  firebase.database().ref("/thietbi/DenLED").on("value", function (snapshot) {
    var val = snapshot.val();
    if (val !== null && val !== undefined) {
      updateLampUI(val);
    }
  });

  // Water Pump State
  firebase.database().ref("/thietbi/MayBom").on("value", function (snapshot) {
    var val = snapshot.val();
    if (val !== null && val !== undefined) {
      updatePumpUI(val);
    }
  });

  hasExecuted = true;
}

// ----------------- THRESHOLD INPUT CONTROLS & LISTENERS -----------------
const rangeInputx = document.querySelector(".scrollable-range"); // Temp
const rangeInput1 = document.querySelector(".scrollable-range1"); // Humi
const rangeInput2 = document.querySelector(".scrollable-range2"); // Soil
const rangeInput3 = document.querySelector(".scrollable-range3"); // Light

// 1. Temp threshold
if (rangeInputx) {
  rangeInputx.addEventListener("input", function () {
    var val = parseInt(this.value, 10);
    firebase.database().ref("/Threshold/Tempt").set(val);
    document.getElementById("scroll-value").innerHTML = val;
  });
}

// 2. Humi threshold
if (rangeInput1) {
  rangeInput1.addEventListener("input", function () {
    var val = parseInt(this.value, 10);
    firebase.database().ref("/Threshold/Humi").set(val);
    document.getElementById("scroll-value1").innerHTML = val;
  });
}

// 3. Soil Moisture threshold
if (rangeInput2) {
  rangeInput2.addEventListener("input", function () {
    var val = parseInt(this.value, 10);
    firebase.database().ref("/thietbi/MayBom_power").set(val);
    document.getElementById("scroll-value2").innerHTML = val;
  });
}

// 4. Light threshold
if (rangeInput3) {
  rangeInput3.addEventListener("input", function () {
    var val = parseInt(this.value, 10);
    firebase.database().ref("/thietbi/DenLED_brightness").set(val);
    document.getElementById("scroll-value3").innerHTML = val;
  });
}

// Load Threshold Values
var hasExecutedx = false;
if (!hasExecutedx) {
  firebase.database().ref("/Threshold/Tempt").on("value", function (snapshot) {
    var val = snapshot.val();
    if (val !== null && val !== undefined) {
      document.getElementById("scroll-value").innerHTML = val;
      if (rangeInputx) rangeInputx.value = val;
    }
  });

  firebase.database().ref("/Threshold/Humi").on("value", function (snapshot) {
    var val = snapshot.val();
    if (val !== null && val !== undefined) {
      document.getElementById("scroll-value1").innerHTML = val;
      if (rangeInput1) rangeInput1.value = val;
    }
  });

  firebase.database().ref("/thietbi/MayBom_power").on("value", function (snapshot) {
    var val = snapshot.val();
    if (val !== null && val !== undefined) {
      document.getElementById("scroll-value2").innerHTML = val;
      if (rangeInput2) rangeInput2.value = val;
    }
  });

  firebase.database().ref("/thietbi/DenLED_brightness").on("value", function (snapshot) {
    var val = snapshot.val();
    if (val !== null && val !== undefined) {
      document.getElementById("scroll-value3").innerHTML = val;
      if (rangeInput3) rangeInput3.value = val;
    }
  });

  hasExecutedx = true;
}

// ------------------------- TIMER MODAL CONTROLLER -------------------------
var modal = document.getElementById("myModal");
var confirmBtn = document.getElementById("confirmTimer");
var audioBell = new Audio("mp3/bell.mp3");

// Open Modal when HẸN GIỜ is clicked
if (btnAllOff) {
  btnAllOff.onclick = function () {
    modal.classList.add("active");
    document.getElementById("stt_img").src = "./img/auto.png";
    document.getElementById("mode").innerHTML = "HẸN GIỜ";
  };
}

// Confirm Timer Options
if (confirmBtn) {
  confirmBtn.onclick = function () {
    modal.classList.remove("active");
    document.getElementById("stt_img").src = "./img/manual.png";
    document.getElementById("mode").innerHTML = "THỦ CÔNG";

    // 1. Lamp Timer
    var lampTurnOnTime = document.getElementById("lampTurnOnTime").value;
    var lampTurnOffTime = document.getElementById("lampTurnOffTime").value;
    scheduleDeviceTimer(lampTurnOnTime, lampTurnOffTime, function(state) {
      var level = state ? 1 : 0;
      firebase.database().ref("/thietbi/DenLED").set(level);
      updateLampUI(level);
    });

    // 2. Water Pump Timer
    var vacuumTurnOnTime = document.getElementById("vacuumTurnOnTime").value;
    var vacuumTurnOffTime = document.getElementById("vacuumTurnOffTime").value;
    scheduleDeviceTimer(vacuumTurnOnTime, vacuumTurnOffTime, function(state) {
      var st = state ? 1 : 0;
      firebase.database().ref("/thietbi/MayBom").set(st);
      updatePumpUI(st);
    });
  };
}

// Timer Scheduler Helper Function
function scheduleDeviceTimer(timeOn, timeOff, updateCallback) {
  if (!timeOn || !timeOff) return;

  var currentDate = new Date();

  var startTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    timeOn.split(":")[0],
    timeOn.split(":")[1],
    0
  );
  var endTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    timeOff.split(":")[0],
    timeOff.split(":")[1],
    0
  );

  var delayStart = startTime - currentDate;
  var delayEnd = endTime - currentDate;

  if (delayStart > 0) {
    setTimeout(function () {
      updateCallback(true); // Turn ON
      audioBell.play().catch(function(e){ console.log("Bell blocked", e); });
    }, delayStart);
  }
  
  if (delayEnd > 0) {
    setTimeout(function () {
      updateCallback(false); // Turn OFF
      audioBell.play().catch(function(e){ console.log("Bell blocked", e); });
    }, delayEnd);
  }
}
