let countdownInterval;
let totalSeconds = 0;
let previousTime = null;
const urlParams = new URLSearchParams(window.location.search);
const basePath = window.APP_BASE_PATH || "";

if (urlParams.get("bg") === "transparent") {
  document.body.classList.add("transparent-bg");
}

if (urlParams.get("hideBtn") === "true") {
  const style = document.createElement("style");
  style.textContent = ".timer-controls { display: none !important; }";
  document.head.appendChild(style);
}

const autoRestart = urlParams.get("autoRestart") === "true";

let isTickSoundEnabled = urlParams.has("tick")
  ? urlParams.get("tick") === "true"
  : localStorage.getItem("countdown_tick_sound") !== "false";
let isAlarmSoundEnabled = urlParams.has("alarm")
  ? urlParams.get("alarm") === "true"
  : localStorage.getItem("countdown_alarm_sound") !== "false";
let tickVolume = parseFloat(
  urlParams.get("tickVol") ||
    localStorage.getItem("countdown_tick_volume") ||
    "0.1"
);
let alarmVolume = parseFloat(
  urlParams.get("alarmVol") ||
    localStorage.getItem("countdown_alarm_volume") ||
    "0.1"
);

let translations = {};
let currentLang =
  urlParams.get("lang") || localStorage.getItem("countdown_lang");

const themes = [
  { id: "default", color: "#0f172a", text: "#ffffff" },
  { id: "sunset", color: "#431407", text: "#ffffff" },
  { id: "forest", color: "#022c22", text: "#ffffff" },
  { id: "berry", color: "#500724", text: "#ffffff" },
  { id: "abyss", color: "#000000", text: "#ffffff" },
  { id: "cloud", color: "#f0f9ff", text: "#0c4a6e" },
  { id: "peach", color: "#fff7ed", text: "#9a3412" },
  { id: "mint", color: "#ecfdf5", text: "#065f46" },
  { id: "lilac", color: "#faf5ff", text: "#6b21a8" },
  { id: "sand", color: "#fffbeb", text: "#92400e" },
  { id: "navy", color: "#0f172a", text: "#ffffff" },
  { id: "crimson", color: "#450a0a", text: "#ffffff" },
  { id: "charcoal", color: "#18181b", text: "#ffffff" },
  { id: "violet", color: "#2e1065", text: "#ffffff" },
  { id: "emerald", color: "#064e3b", text: "#ffffff" },
  { id: "rose", color: "#fff1f2", text: "#9f1239" },
  { id: "sky", color: "#f0f9ff", text: "#075985" },
  { id: "lemon", color: "#fefce8", text: "#854d0e" },
  { id: "ivory", color: "#fafaf9", text: "#57534e" },
  { id: "ice", color: "#ecfeff", text: "#155e75" },
];

const supportedLangs = [
  { id: "it", label: "Italiano", flag: "it" },
  { id: "en", label: "English", flag: "gb" },
  { id: "es", label: "Español", flag: "es" },
  { id: "fr", label: "Français", flag: "fr" },
  { id: "de", label: "Deutsch", flag: "de" },
  { id: "pt", label: "Português", flag: "pt" },
  { id: "ru", label: "Русский", flag: "ru" },
  { id: "zh", label: "中文", flag: "cn" },
  { id: "ja", label: "日本語", flag: "jp" },
  { id: "ko", label: "한국어", flag: "kr" },
  { id: "ar", label: "العربية", flag: "sa" },
  { id: "hi", label: "हिन्दी", flag: "in" },
  { id: "tr", label: "Türkçe", flag: "tr" },
  { id: "nl", label: "Nederlands", flag: "nl" },
  { id: "pl", label: "Polski", flag: "pl" },
  { id: "sv", label: "Svenska", flag: "se" },
  { id: "vi", label: "Tiếng Việt", flag: "vn" },
  { id: "th", label: "ไทย", flag: "th" },
  { id: "el", label: "Ελληνικά", flag: "gr" },
  { id: "uk", label: "Українська", flag: "ua" },
];

if (!currentLang) {
  const browserLang = (navigator.language || "it").split("-")[0];
  currentLang = supportedLangs.some((l) => l.id === browserLang)
    ? browserLang
    : "it";
}

const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const pauseBtn = document.getElementById("pause-btn");
const setupScreen = document.getElementById("setup-screen");
const timerScreen = document.getElementById("timer-screen");
const timerDisplay = document.getElementById("timer-display");

if (hoursInput && urlParams.has("h")) hoursInput.value = urlParams.get("h");
if (minutesInput && urlParams.has("m")) minutesInput.value = urlParams.get("m");
if (urlParams.has("title")) {
  setTimeout(() => {
    const ti = document.getElementById("timer-title-input");
    if (ti) ti.value = urlParams.get("title");
  }, 100);
}

[hoursInput, minutesInput].forEach((input) => {
  if (!input) return;
  input.addEventListener("input", () => {
    const maxLength = input.max.length;
    if (input.value.length > maxLength)
      input.value = input.value.slice(0, maxLength);

    const val = parseInt(input.value);
    const max = parseInt(input.max);
    if (!isNaN(val) && !isNaN(max) && val > max) {
      input.value = max;
    }
  });
});

let alarmSound = document.getElementById("alarm-sound");
if (!alarmSound) {
  alarmSound = document.createElement("audio");
  alarmSound.id = "alarm-sound";
  document.body.appendChild(alarmSound);
}

const tickPool = [];
const POOL_SIZE = 5;

for (let i = 0; i < POOL_SIZE; i++) {
  const a = new Audio(`${basePath}assets/sounds/tick/tick-1.mp3`);
  a.volume = tickVolume;
  a.preload = "auto";
  tickPool.push(a);
}

function createDigitHtml(id, val) {
  return `<div class="digit" id="${id}" data-value="${val}">
        <div class="digit-inner">
            <div class="digit-new">${val}</div>
            <div class="digit-old">${val}</div>
        </div>
    </div>`;
}

function updateDigit(id, newVal) {
  const el = document.getElementById(id);
  if (!el) return;

  const currentVal = el.dataset.value;
  if (currentVal === newVal) return;

  const inner = el.querySelector(".digit-inner");
  const newEl = el.querySelector(".digit-new");
  const oldEl = el.querySelector(".digit-old");

  if (!inner || !newEl || !oldEl) return;

  oldEl.textContent = currentVal;
  newEl.textContent = newVal;

  inner.classList.remove("animating");

  inner.style.transform = "translateY(-50%)";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      inner.classList.add("animating");
      inner.style.transform = "";
    });
  });

  el.dataset.value = newVal;
}

function updateDisplay() {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  timerDisplay.classList.toggle("has-hours", h > 0);

  const hStr = h < 10 ? "0" + h : String(h);
  const mStr = m < 10 ? "0" + m : String(m);
  const sStr = s < 10 ? "0" + s : String(s);

  const parts = [];
  if (h > 0) {
    hStr
      .split("")
      .forEach((c, i) => parts.push({ type: "digit", val: c, id: `h-${i}` }));
    parts.push({ type: "sep", val: ":", id: "sep-h" });
  }
  mStr
    .split("")
    .forEach((c, i) => parts.push({ type: "digit", val: c, id: `m-${i}` }));
  parts.push({ type: "sep", val: ":", id: "sep-m" });
  sStr
    .split("")
    .forEach((c, i) => parts.push({ type: "digit", val: c, id: `s-${i}` }));

  Array.from(timerDisplay.children).forEach((el) => {
    if (el.classList.contains("pop-out")) return;

    const part = parts.find((p) => p.id === el.id);
    if (!part) {
      el.classList.add("pop-out");
      el.addEventListener("animationend", () => el.remove());
    }
  });

  let previousEl = null;

  parts.forEach((part) => {
    let el = document.getElementById(part.id);

    if (!el) {
      const temp = document.createElement("div");
      if (part.type === "sep") {
        temp.innerHTML = `<span class="separator" id="${part.id}">:</span>`;
      } else {
        temp.innerHTML = createDigitHtml(part.id, part.val);
      }
      el = temp.firstElementChild;

      if (previousEl) {
        previousEl.insertAdjacentElement("afterend", el);
      } else {
        timerDisplay.prepend(el);
      }
    } else if (part.type === "digit") {
      updateDigit(part.id, part.val);
    }
    previousEl = el;
  });

  previousTime = { hStr, mStr, sStr };

  if (!timerScreen.classList.contains("hidden")) {
    const timeStr = h > 0 ? `${hStr}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
    document.title = `${timeStr} - Work Countdown`;
  }
}

function showNotification(message) {
  resetIdleTimer();
  const existing = document.querySelector(".custom-notification");
  if (existing) existing.remove();

  const notif = document.createElement("div");
  notif.className = "custom-notification";
  notif.textContent = message;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = "slide-out-left 0.5s forwards";
    notif.addEventListener("animationend", () => {
      if (notif.parentNode) notif.remove();
    });
  }, 3000);
}

let endTime;
let remainingTime = 0;
let isPaused = false;
let lastTickSecond = 0;

function saveTimerState() {
  if (urlParams.has("widget")) return;

  localStorage.setItem("countdown_active", "true");
  localStorage.setItem("countdown_is_paused", String(isPaused));

  const titleInput = document.getElementById("timer-title-input");
  if (titleInput) {
    localStorage.setItem("countdown_title", titleInput.value);
  }

  if (isPaused) {
    localStorage.setItem("countdown_remaining_time", String(remainingTime));
    localStorage.removeItem("countdown_end_time");
  } else {
    localStorage.setItem("countdown_end_time", String(endTime));
    localStorage.removeItem("countdown_remaining_time");
  }
}

function clearTimerState() {
  if (urlParams.has("widget")) return;

  localStorage.removeItem("countdown_active");
  localStorage.removeItem("countdown_is_paused");
  localStorage.removeItem("countdown_remaining_time");
  localStorage.removeItem("countdown_end_time");
  localStorage.removeItem("countdown_title");
}

function restoreTimerState() {
  if (urlParams.has("widget")) return;

  const isActive = localStorage.getItem("countdown_active") === "true";
  if (!isActive) return;

  const savedPaused = localStorage.getItem("countdown_is_paused") === "true";
  const savedTitle = localStorage.getItem("countdown_title") || "";

  const titleInput = document.getElementById("timer-title-input");
  const titleDisplay = document.getElementById("timer-title-display");
  if (titleInput) titleInput.value = savedTitle;
  if (titleDisplay) {
    titleDisplay.textContent = savedTitle;
    titleDisplay.classList.add("visible");
  }

  setupScreen.classList.add("hidden");
  timerScreen.classList.remove("hidden");
  timerDisplay.classList.remove("hurry-up", "finished");
  previousTime = null;

  Array.from(timerDisplay.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.remove();
    }
  });

  if (!alarmSound.src || alarmSound.src === "")
    alarmSound.src = `${basePath}assets/sounds/alarm/alarm-1.mp3`;

  if (savedPaused) {
    remainingTime = parseInt(
      localStorage.getItem("countdown_remaining_time") || "0"
    );
    totalSeconds = Math.ceil(remainingTime / 1000);
    isPaused = true;

    if (pauseBtn) {
      pauseBtn.querySelector("i").className = "fa-solid fa-play";
      const span = pauseBtn.querySelector("span");
      if (span) {
        span.setAttribute("data-i18n", "start_btn");
        span.textContent = t("start_btn");
      }
    }
    updateDisplay();
  } else {
    const savedEndTime = parseInt(
      localStorage.getItem("countdown_end_time") || "0"
    );
    const now = Date.now();

    if (savedEndTime > now) {
      endTime = savedEndTime;
      remainingTime = endTime - now;
      totalSeconds = Math.ceil(remainingTime / 1000);
      isPaused = false;

      if (pauseBtn) {
        pauseBtn.querySelector("i").className = "fa-solid fa-pause";
        const span = pauseBtn.querySelector("span");
        if (span) {
          span.setAttribute("data-i18n", "stop_btn");
          span.textContent = t("stop_btn");
        }
      }

      lastTickSecond = totalSeconds;
      runTick();
    } else {
      totalSeconds = 0;
      updateDisplay();
      timerDisplay.classList.add("finished");
      launchConfetti();
      showNotification(t("notif_finished"));
      clearTimerState();
    }
  }
}

function startTimer() {
  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 0;

  totalSeconds = hours * 3600 + minutes * 60;

  if (totalSeconds <= 0) {
    showNotification(t("notif_min_time"));
    return;
  }

  setupScreen.classList.add("hidden");
  timerScreen.classList.remove("hidden");

  const titleInput = document.getElementById("timer-title-input");
  const titleDisplay = document.getElementById("timer-title-display");
  if (titleInput && titleDisplay) {
    titleDisplay.textContent = titleInput.value;
    titleDisplay.classList.add("visible");
  }

  Array.from(timerDisplay.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.remove();
    }
  });

  timerDisplay.classList.remove("hurry-up", "finished");

  previousTime = null;
  updateDisplay();

  showNotification(t("notif_started"));

  isPaused = false;
  if (pauseBtn) {
    pauseBtn.querySelector("i").className = "fa-solid fa-pause";
    const span = pauseBtn.querySelector("span");
    if (span) {
      span.setAttribute("data-i18n", "stop_btn");
      span.textContent = t("stop_btn");
    }
  }

  if (!alarmSound.src || alarmSound.src === "")
    alarmSound.src = `${basePath}assets/sounds/alarm/alarm-1.mp3`;

  if (isAlarmSoundEnabled) {
    alarmSound.volume = alarmVolume;
    alarmSound
      .play()
      .then(() => {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      })
      .catch((e) => console.warn("Alarm unlock failed:", e));
  }

  if (isTickSoundEnabled) {
    tickPool.forEach((audio) => {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch((e) => console.warn("Tick pool unlock failed:", e));
    });
  }

  remainingTime = totalSeconds * 1000;
  endTime = Date.now() + remainingTime;
  lastTickSecond = totalSeconds;

  saveTimerState();
  runTick();
}

function runTick() {
  if (isPaused) return;

  const now = Date.now();
  const msRemaining = endTime - now;

  const secondsLeft = Math.ceil(msRemaining / 1000);

  if (secondsLeft < lastTickSecond) {
    if (isTickSoundEnabled && secondsLeft > 0) {
      const sound = tickPool[secondsLeft % POOL_SIZE];
      sound.currentTime = 0;

      sound.playbackRate = secondsLeft % 2 === 0 ? 1.0 : 1.1;
      sound.play().catch((e) => console.warn("Tick play failed:", e));
    }
    lastTickSecond = secondsLeft;
  }

  totalSeconds = secondsLeft < 0 ? 0 : secondsLeft;
  updateDisplay();

  if (totalSeconds <= 10 && totalSeconds > 0) {
    timerDisplay.classList.add("hurry-up");
  }

  if (totalSeconds <= 0) {
    timerDisplay.classList.remove("hurry-up");
    timerDisplay.classList.add("finished");

    if (isAlarmSoundEnabled) {
      if (!alarmSound.src.includes("assets/sounds/alarm/alarm-1.mp3"))
        alarmSound.src = `${basePath}assets/sounds/alarm/alarm-1.mp3`;
      alarmSound.volume = alarmVolume;
      alarmSound.loop = true;
      alarmSound.play().catch((e) => console.log("Audio play failed:", e));
    }

    launchConfetti();
    showNotification(t("notif_finished"));

    if (autoRestart) {
      setTimeout(() => {
        alarmSound.pause();
        alarmSound.currentTime = 0;
        startTimer();
      }, 2000);
      return;
    }

    clearTimerState();
  } else {
    const nextDelay = (msRemaining % 1000) + 20;
    countdownInterval = setTimeout(runTick, nextDelay);
  }
}

function togglePause() {
  if (totalSeconds <= 0) return;

  if (isPaused) {
    isPaused = false;
    endTime = Date.now() + remainingTime;

    pauseBtn.querySelector("i").className = "fa-solid fa-pause";
    const span = pauseBtn.querySelector("span");
    if (span) {
      span.setAttribute("data-i18n", "stop_btn");
      span.textContent = t("stop_btn");
    }

    saveTimerState();
    runTick();
  } else {
    isPaused = true;
    clearTimeout(countdownInterval);
    remainingTime = endTime - Date.now();

    pauseBtn.querySelector("i").className = "fa-solid fa-play";
    const span = pauseBtn.querySelector("span");
    if (span) {
      span.setAttribute("data-i18n", "start_btn");
      span.textContent = t("start_btn");
    }
    saveTimerState();
  }
}

function resetTimer() {
  clearTimeout(countdownInterval);
  isPaused = false;
  document.body.classList.remove("idle-mode");
  document.title = "Work Countdown";

  clearTimerState();
  alarmSound.pause();
  alarmSound.currentTime = 0;
  alarmSound.loop = false;

  timerDisplay.classList.remove("hurry-up", "finished");

  const titleDisplay = document.getElementById("timer-title-display");
  if (titleDisplay) titleDisplay.classList.remove("visible");

  document.querySelectorAll(".confetti").forEach((el) => el.remove());

  if (urlParams.has("widget")) {
    startTimer();
    return;
  }

  setupScreen.classList.remove("hidden");
  timerScreen.classList.add("hidden");

  if (document.fullscreenElement) {
    document
      .exitFullscreen()
      .catch((e) => console.log("Exit fullscreen failed", e));
  }

  showNotification(t("notif_stopped"));
}

function setupThemeControls() {
  let currentThemeIndex = 0;

  const savedTheme =
    urlParams.get("theme") || localStorage.getItem("countdown_theme");
  if (savedTheme) {
    const idx = themes.findIndex((t) => t.id === savedTheme);
    if (idx !== -1) currentThemeIndex = idx;
  }

  const modal = document.getElementById("theme-modal");
  const openBtn = document.getElementById("theme-open-btn");
  const closeBtn = modal.querySelector(".close-modal");
  const grid = document.getElementById("theme-grid");

  const searchInput = document.getElementById("theme-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const options = grid.querySelectorAll(".theme-option");
      options.forEach((opt) => {
        const label = opt.querySelector("span").textContent.toLowerCase();
        opt.style.display = label.includes(term) ? "flex" : "none";
      });
    });
  }

  themes.forEach((theme, index) => {
    const el = document.createElement("div");
    el.className = "theme-option";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", t("theme_" + theme.id));

    if (index === currentThemeIndex) el.classList.add("selected");

    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.style.background = theme.color;

    const label = document.createElement("span");
    label.setAttribute("data-i18n", "theme_" + theme.id);
    label.textContent = t("theme_" + theme.id);

    el.appendChild(preview);
    el.appendChild(label);

    const selectTheme = () => {
      currentThemeIndex = index;
      applyTheme();
      closeModal();
    };

    el.addEventListener("click", selectTheme);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectTheme();
      }
    });

    grid.appendChild(el);
  });

  function openModal() {
    modal.classList.add("open");
    const searchInput = document.getElementById("theme-search");
    if (searchInput) setTimeout(() => searchInput.focus(), 50);
  }
  function closeModal() {
    modal.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", openModal);

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeModal();
      }
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  const prevBtn = document.createElement("div");
  prevBtn.className = "theme-nav-btn theme-nav-prev";
  prevBtn.tabIndex = 0;
  prevBtn.setAttribute("role", "button");
  prevBtn.innerHTML = "&#10094;";
  prevBtn.onclick = () => changeTheme(-1);
  prevBtn.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      changeTheme(-1);
    }
  };

  const nextBtn = document.createElement("div");
  nextBtn.className = "theme-nav-btn theme-nav-next";
  nextBtn.tabIndex = 0;
  nextBtn.setAttribute("role", "button");
  nextBtn.innerHTML = "&#10095;";
  nextBtn.onclick = () => changeTheme(1);
  nextBtn.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      changeTheme(1);
    }
  };

  document.body.appendChild(prevBtn);
  document.body.appendChild(nextBtn);

  function applyTheme(skipAnimation = false) {
    const themeId = themes[currentThemeIndex].id;

    if (!urlParams.has("widget")) {
      localStorage.setItem("countdown_theme", themeId);
    }

    if (themeId === "default") {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", themeId);
    }

    Array.from(grid.children).forEach((child, idx) => {
      if (idx === currentThemeIndex) child.classList.add("selected");
      else child.classList.remove("selected");
    });

    if (!skipAnimation) {
      document.body.classList.remove("theme-changing");
      void document.body.offsetWidth;
      document.body.classList.add("theme-changing");

      setTimeout(() => document.body.classList.remove("theme-changing"), 600);
    }
  }

  function changeTheme(direction) {
    currentThemeIndex =
      (currentThemeIndex + direction + themes.length) % themes.length;
    applyTheme();
  }

  if (savedTheme) {
    applyTheme(true);
  }
}

setupThemeControls();

function setupTitleFeature() {
  const container = document.querySelector(".container");
  const inputGroup = container.querySelector(".input-group");

  const input = document.createElement("input");
  input.type = "text";
  input.id = "timer-title-input";
  input.className = "timer-title-input";
  input.placeholder = t("timer_title_placeholder");
  input.autocomplete = "off";

  if (inputGroup) {
    container.insertBefore(input, inputGroup);
  }

  const display = document.createElement("div");
  display.id = "timer-title-display";
  timerScreen.prepend(display);
}

function launchConfetti() {
  const colors = [
    "var(--primary-color)",
    "var(--secondary-color)",
    "#ffffff",
    "#fbbf24",
  ];

  for (let i = 0; i < 60; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDuration = Math.random() * 3 + 2 + "s";
    c.style.animationDelay = Math.random() * 5 + "s";
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.setProperty("--drift", Math.random() * 300 - 150 + "px");
    c.addEventListener("animationend", () => c.remove());
    document.body.appendChild(c);
  }
}

setupTitleFeature();

let idleTimeout;

function resetIdleTimer() {
  if (timerScreen.classList.contains("hidden")) {
    document.body.classList.remove("idle-mode");
    clearTimeout(idleTimeout);
    return;
  }

  document.body.classList.remove("idle-mode");
  clearTimeout(idleTimeout);

  idleTimeout = setTimeout(() => {
    if (!timerScreen.classList.contains("hidden")) {
      document.body.classList.add("idle-mode");
    }
  }, 5000);
}

let lastTouchStart = 0;
let wasIdleAtTouchStart = false;

document.addEventListener(
  "touchstart",
  () => {
    lastTouchStart = Date.now();
    wasIdleAtTouchStart = document.body.classList.contains("idle-mode");
  },
  { passive: true }
);

["mousemove", "keypress", "keydown", "scroll", "touchmove"].forEach((evt) =>
  document.addEventListener(evt, resetIdleTimer, { passive: true })
);

document.addEventListener("click", (e) => {
  if (timerScreen.classList.contains("hidden")) {
    resetIdleTimer();
    return;
  }

  const isInteractive = e.target.closest(
    "button, input, a, .header-controls, .theme-nav-btn, .modal, .switch, label"
  );

  if (isInteractive) {
    resetIdleTimer();
  } else {
    if (Date.now() - lastTouchStart < 500 && wasIdleAtTouchStart) {
      resetIdleTimer();
      return;
    }

    if (document.body.classList.contains("idle-mode")) {
      resetIdleTimer();
    } else {
      document.body.classList.add("idle-mode");
      clearTimeout(idleTimeout);
    }
  }
});

function setupAnimationSwitcher() {
  const toggle = document.getElementById("animation-toggle");
  let isEnabled = localStorage.getItem("countdown_animation") !== "false";

  if (urlParams.has("anim")) {
    isEnabled = urlParams.get("anim") === "true";
  }

  applyAnimationState(isEnabled);

  if (toggle) {
    toggle.checked = isEnabled;

    toggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      localStorage.setItem("countdown_animation", enabled);
      applyAnimationState(enabled);
      if (enabled) {
        showNotification(t("notif_anim_warning"));
      }
    });
  }

  const settingsToggle = document.getElementById("settings-animation-toggle");
  if (settingsToggle) {
    settingsToggle.checked = isEnabled;
    settingsToggle.addEventListener("change", (e) => {
      if (toggle) {
        toggle.checked = e.target.checked;
        toggle.dispatchEvent(new Event("change"));
      }
    });

    if (toggle) {
      toggle.addEventListener("change", (e) => {
        settingsToggle.checked = e.target.checked;
      });
    }
  }
}

function applyAnimationState(enabled) {
  document.body.classList.toggle("no-animations", !enabled);
}

setupAnimationSwitcher();

function setupSoundControls() {
  const modal = document.getElementById("sound-modal");
  const openBtn = document.getElementById("sound-toggle-btn");
  const closeBtn = modal ? modal.querySelector(".close-modal") : null;
  const tickToggle = document.getElementById("tick-sound-toggle");
  const alarmToggle = document.getElementById("alarm-sound-toggle");
  const tickVolumeSlider = document.getElementById("tick-volume");
  const alarmVolumeSlider = document.getElementById("alarm-volume");
  const tickVolumeContainer = document.getElementById("tick-volume-container");
  const alarmVolumeContainer = document.getElementById(
    "alarm-volume-container"
  );

  function updateVisibility() {
    if (tickVolumeContainer)
      tickVolumeContainer.style.display = isTickSoundEnabled ? "block" : "none";
    if (alarmVolumeContainer)
      alarmVolumeContainer.style.display = isAlarmSoundEnabled
        ? "block"
        : "none";
  }

  if (tickToggle) {
    tickToggle.checked = isTickSoundEnabled;
    tickToggle.addEventListener("change", (e) => {
      isTickSoundEnabled = e.target.checked;
      localStorage.setItem("countdown_tick_sound", isTickSoundEnabled);
      updateVisibility();
    });
  }

  if (alarmToggle) {
    alarmToggle.checked = isAlarmSoundEnabled;
    alarmToggle.addEventListener("change", (e) => {
      isAlarmSoundEnabled = e.target.checked;
      localStorage.setItem("countdown_alarm_sound", isAlarmSoundEnabled);
      updateVisibility();
    });
  }

  if (tickVolumeSlider) {
    tickVolumeSlider.value = tickVolume;
    tickVolumeSlider.addEventListener("input", (e) => {
      tickVolume = parseFloat(e.target.value);
      localStorage.setItem("countdown_tick_volume", tickVolume);
      tickPool.forEach((a) => (a.volume = tickVolume));
    });
  }

  if (alarmVolumeSlider) {
    alarmVolumeSlider.value = alarmVolume;
    alarmVolumeSlider.addEventListener("input", (e) => {
      alarmVolume = parseFloat(e.target.value);
      localStorage.setItem("countdown_alarm_volume", alarmVolume);
      if (alarmSound) alarmSound.volume = alarmVolume;
    });
  }

  updateVisibility();

  function openModal() {
    if (modal) modal.classList.add("open");
  }
  function closeModal() {
    if (modal) modal.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

setupSoundControls();

function setupSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const openBtn = document.getElementById("mobile-settings-btn");
  const closeBtn = modal ? modal.querySelector(".close-modal") : null;

  if (!modal || !openBtn) return;

  openBtn.addEventListener("click", () => modal.classList.add("open"));
  if (closeBtn)
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  const map = {
    "settings-theme-btn": "theme-modal",
    "settings-lang-btn": "lang-modal",
    "settings-sound-btn": "sound-modal",
  };

  Object.keys(map).forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", () => {
        modal.classList.remove("open");
        const targetModal = document.getElementById(map[btnId]);
        if (targetModal) {
          targetModal.classList.add("from-settings");
          targetModal.classList.add("open");
          const search = targetModal.querySelector(".search-input");
          if (search) setTimeout(() => search.focus(), 50);
        }
      });
    }
  });

  document.querySelectorAll(".back-modal").forEach((backBtn) => {
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentModal = backBtn.closest(".modal");
      if (currentModal) {
        currentModal.classList.remove("open");
        currentModal.classList.remove("from-settings");
      }
      modal.classList.add("open");
    });
  });

  const headerBtns = ["theme-open-btn", "lang-open-btn", "sound-toggle-btn"];
  headerBtns.forEach((id) => {
    const btn = document.getElementById(id);
    const modalId = id
      .replace("-open-btn", "-modal")
      .replace("-toggle-btn", "-modal");
    if (btn)
      btn.addEventListener("click", () => {
        const m = document.getElementById(modalId);
        if (m) m.classList.remove("from-settings");
      });
  });
}

setupSettingsModal();

function setupLanguageControls() {
  if (urlParams.has("widget") && urlParams.has("lang")) return;
  const modal = document.getElementById("lang-modal");
  const openBtn = document.getElementById("lang-open-btn");
  const closeBtn = modal ? modal.querySelector(".close-modal") : null;
  const list = document.getElementById("lang-list");
  const searchInput = document.getElementById("lang-search");

  if (!modal || !list) return;

  supportedLangs.forEach((lang) => {
    const el = document.createElement("div");
    el.className = "theme-option";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", lang.label);
    el.dataset.langId = lang.id;

    if (lang.id === currentLang) el.classList.add("selected");

    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.style.background = `url('https://flagcdn.com/w80/${
      lang.flag || lang.id
    }.png') center/cover no-repeat`;
    preview.style.backgroundColor = "#f0f0f0";

    const label = document.createElement("span");
    label.textContent = lang.label;

    el.appendChild(preview);
    el.appendChild(label);

    const selectLang = async () => {
      await applyLanguage(lang.id);
      closeModal();

      Array.from(list.children).forEach((child) => {
        if (child.dataset.langId === lang.id) child.classList.add("selected");
        else child.classList.remove("selected");
      });
    };

    el.addEventListener("click", selectLang);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectLang();
      }
    });

    list.appendChild(el);
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      Array.from(list.children).forEach((el) => {
        const text = el.querySelector("span").textContent.toLowerCase();
        el.style.display = text.includes(term) ? "flex" : "none";
      });
    });
  }

  function openModal() {
    modal.classList.add("open");
    if (searchInput) setTimeout(() => searchInput.focus(), 50);

    Array.from(list.children).forEach((child) => {
      if (child.dataset.langId === currentLang) child.classList.add("selected");
      else child.classList.remove("selected");
    });
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  if (openBtn) openBtn.addEventListener("click", openModal);

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeModal();
      }
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

setupLanguageControls();

async function loadTranslations() {
  await applyLanguage(currentLang);
}

function t(key) {
  if (!translations[currentLang]) return key;
  return translations[currentLang][key] || key;
}

async function applyLanguage(lang) {
  if (!translations[lang]) {
    try {
      const response = await fetch(`${basePath}assets/languages/${lang}.json`);
      if (response.ok) {
        translations[lang] = await response.json();
      } else {
        console.error(`Failed to load ${lang}.json`);
      }
    } catch (e) {
      console.error("Translation load error:", e);
    }
  }

  if (translations[lang] && !translations[lang].reset_btn) {
    translations[lang].reset_btn = lang === "it" ? "Resetta" : "Reset";
  }

  if (translations[lang]) {
    if (!translations[lang].modal_sound_title)
      translations[lang].modal_sound_title =
        lang === "it" ? "Impostazioni Suono" : "Sound Settings";
    if (!translations[lang].tick_sound_label)
      translations[lang].tick_sound_label =
        lang === "it" ? "Suono Ticchettio" : "Tick Sound";
    if (!translations[lang].alarm_sound_label)
      translations[lang].alarm_sound_label =
        lang === "it" ? "Suono Allarme" : "Alarm Sound";
  }

  if (!translations[lang]) {
    lang = "it";
    if (!translations[lang]) {
      try {
        const response = await fetch(
          `${basePath}assets/languages/${lang}.json`
        );
        if (response.ok) translations[lang] = await response.json();
      } catch (e) {
        console.error("Fallback translation load error:", e);
      }
    }
  }

  currentLang = lang;
  if (!urlParams.has("widget")) {
    localStorage.setItem("countdown_lang", lang);
  }
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("data-lang", lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  const titleInput = document.getElementById("timer-title-input");
  if (titleInput) titleInput.placeholder = t("timer_title_placeholder");

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
}

if (startBtn) startBtn.addEventListener("click", startTimer);
if (resetBtn) resetBtn.addEventListener("click", resetTimer);
if (pauseBtn) pauseBtn.addEventListener("click", togglePause);

function startBlobAnimation() {
  const blobs = document.querySelectorAll(".blob");

  function updatePositions(isFirstRun = false) {
    if (document.body.classList.contains("no-animations")) return;

    blobs.forEach((blob) => {
      const x = Math.random() * (window.innerWidth - blob.clientWidth);
      const y = Math.random() * (window.innerHeight - blob.clientHeight);

      if (isFirstRun) {
        blob.style.transition = "none";
        blob.style.transform = `translate(${x}px, ${y}px)`;
        void blob.offsetWidth;
        blob.style.transition = "";
      } else {
        blob.style.transform = `translate(${x}px, ${y}px)`;
      }
    });

    setTimeout(updatePositions, 20000);
  }

  updatePositions(true);

  const toggle = document.getElementById("animation-toggle");
  if (toggle) {
    toggle.addEventListener("change", (e) => {
      if (e.target.checked) updatePositions();
    });
  }
}

document.addEventListener("keydown", (e) => {
  const openModal = document.querySelector(".modal.open");

  if (e.key === "Tab") {
    const container = openModal || document.body;
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const focusable = Array.from(container.querySelectorAll(selector)).filter(
      (el) =>
        el.offsetParent !== null && (openModal ? true : !el.closest(".modal"))
    );

    if (focusable.length > 0) {
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    return;
  }

  if (openModal) {
    if (e.key === "Escape") {
      openModal.classList.remove("open");
    }
    return;
  }

  if (!timerScreen.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      resetTimer();
    } else if (e.key === " ") {
      if (document.activeElement.tagName === "BUTTON") return;
      e.preventDefault();
      togglePause();
    } else if (e.key.toLowerCase() === "m") {
      const soundBtn = document.getElementById("sound-toggle-btn");
      if (soundBtn) soundBtn.click();
    } else if (e.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
    return;
  }

  if (!setupScreen.classList.contains("hidden")) {
    if (e.key === "Enter") {
      if (document.activeElement.tagName === "BUTTON") return;
      startTimer();
    }
  }
});

function setupOnboarding() {
  if (urlParams.has("widget")) return;
  if (localStorage.getItem("countdown_onboarding_complete") === "true") return;

  const steps = [
    {
      icon: '<i class="fa-solid fa-hand-sparkles"></i>',
      titleKey: "onboarding_1_title",
      descKey: "onboarding_1_desc",
    },
    {
      id: "language",
      icon: '<i class="fa-solid fa-globe"></i>',
      titleKey: "modal_lang_title",
      descKey: null,
      customContent: (container) => {
        const select = createCustomSelect(
          supportedLangs,
          currentLang,
          (val) => {
            applyLanguage(val);
          },
          (opt) => {
            const flag = document.createElement("div");
            flag.className = "onboarding-option-icon";
            flag.style.backgroundImage = `url("https://flagcdn.com/w40/${
              opt.flag || opt.id
            }.png")`;
            const span = document.createElement("span");
            span.textContent = opt.label;
            const wrapper = document.createDocumentFragment();
            wrapper.appendChild(flag);
            wrapper.appendChild(span);
            return wrapper;
          }
        );
        container.appendChild(select);
      },
    },
    {
      id: "theme",
      icon: '<i class="fa-solid fa-palette"></i>',
      titleKey: "modal_theme_title",
      descKey: null,
      customContent: (container) => {
        const currentTheme =
          localStorage.getItem("countdown_theme") || "default";
        const select = createCustomSelect(
          themes,
          currentTheme,
          (val) => {
            const idx = themes.findIndex((t) => t.id === val);
            if (idx !== -1) {
              const themeId = themes[idx].id;
              localStorage.setItem("countdown_theme", themeId);
              if (themeId === "default")
                document.body.removeAttribute("data-theme");
              else document.body.setAttribute("data-theme", themeId);

              const grid = document.getElementById("theme-grid");
              if (grid) {
                Array.from(grid.children).forEach((child, i) => {
                  if (i === idx) child.classList.add("selected");
                  else child.classList.remove("selected");
                });
              }
            }
          },
          (opt) => {
            const color = document.createElement("div");
            color.className = "theme-preview-icon";
            color.style.background = opt.color;
            const span = document.createElement("span");
            span.textContent = t("theme_" + opt.id);
            const wrapper = document.createDocumentFragment();
            wrapper.appendChild(color);
            wrapper.appendChild(span);
            return wrapper;
          }
        );
        container.appendChild(select);
      },
    },
    {
      id: "animations",
      icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
      titleKey: "onboarding_anim_title",
      descKey: "onboarding_anim_desc",
      customContent: (container) => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.marginTop = "1rem";

        const label = document.createElement("label");
        label.className = "switch";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = localStorage.getItem("countdown_animation") !== "false";

        const slider = document.createElement("span");
        slider.className = "slider";

        label.appendChild(input);
        label.appendChild(slider);
        wrapper.appendChild(label);
        container.appendChild(wrapper);

        input.addEventListener("change", (e) => {
          const enabled = e.target.checked;
          localStorage.setItem("countdown_animation", enabled);
          applyAnimationState(enabled);

          const mainToggle = document.getElementById("animation-toggle");
          if (mainToggle) mainToggle.checked = enabled;
        });
      },
    },
    {
      icon: '<i class="fa-solid fa-rocket"></i>',
      titleKey: "onboarding_3_title",
      descKey: "onboarding_3_desc",
    },
  ];

  let currentStep = 0;

  const overlay = document.createElement("div");
  overlay.className = "onboarding-overlay";
  overlay.innerHTML = `
        <div class="onboarding-card">
            <div class="onboarding-icon"></div>
            <h2 class="onboarding-title"></h2>
            <p class="onboarding-desc"></p>
            <div class="onboarding-custom-content"></div>
            <div class="onboarding-dots"></div>
            <div class="onboarding-actions">
                <button class="btn-secondary"><span id="ob-skip"></span></button>
                <button class="btn-primary"><span id="ob-next"></span></button>
            </div>
        </div>
    `;
  document.body.appendChild(overlay);

  const iconEl = overlay.querySelector(".onboarding-icon");
  const titleEl = overlay.querySelector(".onboarding-title");
  const descEl = overlay.querySelector(".onboarding-desc");
  const customContentEl = overlay.querySelector(".onboarding-custom-content");
  const dotsContainer = overlay.querySelector(".onboarding-dots");
  const skipBtn = document.getElementById("ob-skip");
  const nextBtn = document.getElementById("ob-next");

  function renderStep() {
    const step = steps[currentStep];
    iconEl.innerHTML = step.icon;

    titleEl.setAttribute("data-i18n", step.titleKey);
    titleEl.textContent = t(step.titleKey);

    if (step.descKey) {
      descEl.style.display = "block";
      descEl.setAttribute("data-i18n", step.descKey);
      descEl.textContent = t(step.descKey);
    } else {
      descEl.style.display = "none";
    }

    customContentEl.innerHTML = "";
    if (step.customContent) {
      step.customContent(customContentEl);
    }

    dotsContainer.innerHTML = steps
      .map(
        (_, i) => `<div class="dot ${i === currentStep ? "active" : ""}"></div>`
      )
      .join("");

    skipBtn.textContent = t("onboarding_skip");
    nextBtn.textContent =
      currentStep === steps.length - 1
        ? t("onboarding_start")
        : t("onboarding_next");
  }

  function closeOnboarding() {
    overlay.classList.remove("visible");
    setTimeout(() => overlay.remove(), 500);
    localStorage.setItem("countdown_onboarding_complete", "true");
    if (currentStep === steps.length - 1) launchConfetti();
  }

  nextBtn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep();
    } else {
      closeOnboarding();
    }
  });

  skipBtn.addEventListener("click", closeOnboarding);

  renderStep();

  setTimeout(() => overlay.classList.add("visible"), 500);
}

function createCustomSelect(options, selectedValue, onSelect, renderLabel) {
  const wrapper = document.createElement("div");
  wrapper.className = "onboarding-custom-select";

  const trigger = document.createElement("div");
  trigger.className = "onboarding-select-trigger";

  const selectedOption =
    options.find((o) => o.id === selectedValue) || options[0];

  const updateTrigger = (opt) => {
    trigger.innerHTML = "";
    if (renderLabel) {
      trigger.appendChild(renderLabel(opt));
    } else {
      trigger.textContent = opt.label || opt.id;
    }
    const arrow = document.createElement("i");
    arrow.className = "fa-solid fa-chevron-down";
    arrow.style.fontSize = "0.8rem";
    arrow.style.opacity = "0.7";
    trigger.appendChild(arrow);
  };

  updateTrigger(selectedOption);

  const optionsList = document.createElement("div");
  optionsList.className = "onboarding-options";

  options.forEach((opt) => {
    const el = document.createElement("div");
    el.className = "onboarding-option";
    if (opt.id === selectedValue) el.classList.add("selected");

    if (renderLabel) {
      el.appendChild(renderLabel(opt));
    } else {
      el.textContent = opt.label || opt.id;
    }

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onSelect(opt.id);
      updateTrigger(opt);
      optionsList.classList.remove("open");
      optionsList
        .querySelectorAll(".onboarding-option")
        .forEach((o) => o.classList.remove("selected"));
      el.classList.add("selected");
    });
    optionsList.appendChild(el);
  });

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".onboarding-options.open").forEach((el) => {
      if (el !== optionsList) el.classList.remove("open");
    });
    optionsList.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      optionsList.classList.remove("open");
    }
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(optionsList);
  return wrapper;
}

const translationsLoaded = loadTranslations().then(() => {
  setupOnboarding();
  restoreTimerState();
});

if (urlParams.has("widget")) {
  const footerAd = document.querySelector(".ad-slot-footer");
  if (footerAd) footerAd.style.display = "none";

  const headerControls = document.querySelector(".header-controls");
  if (headerControls) headerControls.style.display = "none";

  if (setupScreen) setupScreen.classList.add("hidden");
  if (timerScreen) timerScreen.classList.remove("hidden");

  const h = hoursInput ? parseInt(hoursInput.value) || 0 : 0;
  const m = minutesInput ? parseInt(minutesInput.value) || 0 : 0;
  totalSeconds = h * 3600 + m * 60;
  updateDisplay();

  const enforceBranding = () => {
    let branding = document.getElementById("widget-branding");
    const expectedText = "Made with Timer.sildev.dev";
    const expectedLink = "https://timer.sildev.dev";

    if (!branding) {
      branding = document.createElement("a");
      branding.id = "widget-branding";
      branding.className = "widget-branding";
      branding.target = "_blank";
      document.body.appendChild(branding);
    }

    if (branding.getAttribute("href") !== expectedLink)
      branding.href = expectedLink;
    if (branding.textContent.trim() !== expectedText)
      branding.textContent = expectedText;

    const style = window.getComputedStyle(branding);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      branding.style.cssText = "";
      branding.className = "widget-branding";
    }
  };
  setInterval(enforceBranding, 2000);
  enforceBranding();
}

if (urlParams.has("widget") && (urlParams.has("h") || urlParams.has("m"))) {
  setTimeout(() => {
    startTimer();
  }, 500);
}

startBlobAnimation();

const loaderScreen = document.getElementById("loading-screen");
const loaderBar = document.querySelector(".loader-bar");
const loaderPercentage = document.querySelector(".loader-percentage");
const loaderText = document.querySelector(".loader-text");

if (urlParams.has("widget") && loaderScreen) {
  loaderScreen.remove();
}

if (loaderScreen && loaderBar && !urlParams.has("widget")) {
  let progress = 0;

  const loaderMsgs = {
    it: [
      "Caricamento risorse...",
      "Preparazione font...",
      "Configurazione temi...",
      "Avvio sistema...",
      "Pronto!",
    ],
    en: [
      "Loading resources...",
      "Preparing fonts...",
      "Configuring themes...",
      "Starting system...",
      "Ready!",
    ],
    es: [
      "Cargando recursos...",
      "Preparando fuentes...",
      "Configurando temas...",
      "Iniciando sistema...",
      "¡Listo!",
    ],
    fr: [
      "Chargement des ressources...",
      "Préparation des polices...",
      "Configuration des thèmes...",
      "Démarrage du système...",
      "Prêt !",
    ],
    de: [
      "Ressourcen laden...",
      "Schriftarten vorbereiten...",
      "Themen konfigurieren...",
      "System starten...",
      "Bereit!",
    ],
    pt: [
      "Carregando recursos...",
      "Preparando fontes...",
      "Configurando temas...",
      "Iniciando sistema...",
      "Pronto!",
    ],
    ru: [
      "Загрузка ресурсов...",
      "Подготовка шрифтов...",
      "Настройка тем...",
      "Запуск системы...",
      "Готово!",
    ],
    zh: [
      "加载资源...",
      "准备字体...",
      "配置主题...",
      "启动系统...",
      "准备就绪！",
    ],
    ja: [
      "リソースを読み込んでいます...",
      "フォントを準備中...",
      "テーマを設定中...",
      "システムを起動中...",
      "準備完了！",
    ],
    ko: [
      "리소스를 로드 중...",
      "글꼴 준비 중...",
      "테마 구성 중...",
      "시스템 시작 중...",
      "준비 완료!",
    ],
    ar: [
      "جارٍ تحميل الموارد...",
      "جارٍ إعداد الخطوط...",
      "جارٍ تكوين السمات...",
      "جارٍ بدء النظام...",
      "جاهز!",
    ],
    hi: [
      "संसाधन लोड हो रहे हैं...",
      "फ़ॉन्ट तैयार किए जा रहे हैं...",
      "थीम कॉन्फ़िगर की जा रही हैं...",
      "सिस्टम शुरू हो रहा है...",
      "तैयार!",
    ],
    tr: [
      "Kaynaklar yükleniyor...",
      "Yazı tipleri hazırlanıyor...",
      "Temalar yapılandırılıyor...",
      "Sistem başlatılıyor...",
      "Hazır!",
    ],
    nl: [
      "Bronnen laden...",
      "Lettertypen voorbereiden...",
      "Thema's configureren...",
      "Systeem starten...",
      "Klaar!",
    ],
    pl: [
      "Ładowanie zasobów...",
      "Przygotowywanie czcionek...",
      "Konfigurowanie motywów...",
      "Uruchamianie systemu...",
      "Gotowe!",
    ],
    sv: [
      "Laddar resurser...",
      "Förbereder typsnitt...",
      "Konfigurerar teman...",
      "Startar systemet...",
      "Redo!",
    ],
    vi: [
      "Đang tải tài nguyên...",
      "Đang chuẩn bị phông chữ...",
      "Đang cấu hình chủ đề...",
      "Đang khởi động hệ thống...",
      "Sẵn sàng!",
    ],
    th: [
      "กำลังโหลดทรัพยากร...",
      "กำลังเตรียมแบบอักษร...",
      "กำลังกำหนดค่าธีม...",
      "กำลังเริ่มระบบ...",
      "พร้อม!",
    ],
    el: [
      "Φόρτωση πόρων...",
      "Προετοιμασία γραμματοσειρών...",
      "Διαμόρφωση θεμάτων...",
      "Εκκίνηση συστήματος...",
      "Έτοιμο!",
    ],
    uk: [
      "Завантаження ресурсів...",
      "Підготовка шрифтів...",
      "Налаштування тем...",
      "Запуск системи...",
      "Готово!",
    ],
  };

  const currentLoaderMsgs = loaderMsgs[currentLang] || loaderMsgs["en"];

  const interval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 90) progress = 90;
    loaderBar.style.setProperty("--progress", `${progress}%`);
    if (loaderPercentage)
      loaderPercentage.textContent = `${Math.round(progress)}%`;

    if (loaderText) {
      const stateIndex = Math.floor(
        (progress / 100) * (currentLoaderMsgs.length - 1)
      );
      loaderText.textContent =
        currentLoaderMsgs[stateIndex] || currentLoaderMsgs[0];
    }
  }, 100);

  Promise.all([
    document.fonts.ready,
    translationsLoaded,
    new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve);
    }),
  ])
    .catch((e) => console.error("Loading error:", e))
    .finally(() => {
      clearInterval(interval);
      loaderBar.style.setProperty("--progress", "100%");
      if (loaderPercentage) loaderPercentage.textContent = "100%";
      if (loaderText)
        loaderText.textContent =
          currentLoaderMsgs[currentLoaderMsgs.length - 1];

      setTimeout(() => {
        loaderScreen.classList.add("hidden");
        setTimeout(() => loaderScreen.remove(), 500);
      }, 500);
    });
}
