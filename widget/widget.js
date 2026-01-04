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

let translations = {};
let currentLang = localStorage.getItem("countdown_lang");

if (!currentLang) {
  const browserLang = (navigator.language || "it").split("-")[0];
  currentLang = supportedLangs.some((l) => l.id === browserLang)
    ? browserLang
    : "it";
}

let isTickSoundEnabled =
  localStorage.getItem("countdown_tick_sound") !== "false";
let isAlarmSoundEnabled =
  localStorage.getItem("countdown_alarm_sound") !== "false";
let tickVolume = parseFloat(
  localStorage.getItem("countdown_tick_volume") || "0.1"
);
let alarmVolume = parseFloat(
  localStorage.getItem("countdown_alarm_volume") || "0.1"
);

function t(key) {
  if (!translations[currentLang]) return key;
  return translations[currentLang][key] || key;
}

async function loadTranslations() {
  await applyLanguage(currentLang);
}

async function applyLanguage(lang) {
  if (!translations[lang]) {
    try {
      const response = await fetch(`../assets/languages/${lang}.json`);
      if (response.ok) {
        translations[lang] = await response.json();
      }
    } catch (e) {
      console.error("Translation load error:", e);
    }
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

    if (!translations[lang].widget_generator_title)
      translations[lang].widget_generator_title = "Widget Generator";
    if (!translations[lang].generate_widget_btn)
      translations[lang].generate_widget_btn =
        lang === "it" ? "Genera Widget" : "Generate Widget";
    if (!translations[lang].copy_code_btn)
      translations[lang].copy_code_btn =
        lang === "it" ? "Copia Codice" : "Copy Code";
    if (!translations[lang].copied_msg)
      translations[lang].copied_msg = lang === "it" ? "Copiato!" : "Copied!";
    if (!translations[lang].timer_title_placeholder)
      translations[lang].timer_title_placeholder =
        lang === "it"
          ? "Titolo del Timer (opzionale)"
          : "Timer Title (optional)";
    if (!translations[lang].hours_label)
      translations[lang].hours_label = lang === "it" ? "ORE" : "HOURS";
    if (!translations[lang].minutes_label)
      translations[lang].minutes_label = lang === "it" ? "MINUTI" : "MINUTES";
  }

  currentLang = lang;
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("data-lang", lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
}

function setupThemeControls() {
  const modal = document.getElementById("theme-modal");
  const openBtn = document.getElementById("theme-open-btn");
  const closeBtn = modal.querySelector(".close-modal");
  const grid = document.getElementById("theme-grid");
  const searchInput = document.getElementById("theme-search");

  const savedTheme = localStorage.getItem("countdown_theme");
  if (savedTheme && savedTheme !== "default") {
    document.body.setAttribute("data-theme", savedTheme);
  }

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

  themes.forEach((theme) => {
    const el = document.createElement("div");
    el.className = "theme-option";
    el.tabIndex = 0;
    el.setAttribute("role", "button");

    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.style.background = theme.color;

    const label = document.createElement("span");
    label.setAttribute("data-i18n", "theme_" + theme.id);
    label.textContent = t("theme_" + theme.id);

    el.appendChild(preview);
    el.appendChild(label);

    el.addEventListener("click", () => {
      if (theme.id === "default") document.body.removeAttribute("data-theme");
      else document.body.setAttribute("data-theme", theme.id);

      grid
        .querySelectorAll(".theme-option")
        .forEach((opt) => opt.classList.remove("selected"));
      el.classList.add("selected");

      modal.classList.remove("open");
    });
    grid.appendChild(el);
  });
  if (savedTheme) {
    const activeEl = grid.querySelector(
      `.theme-option:nth-child(${
        themes.findIndex((t) => t.id === savedTheme) + 1
      })`
    );
    if (activeEl) activeEl.classList.add("selected");
  }

  if (openBtn)
    openBtn.addEventListener("click", () => modal.classList.add("open"));
  if (closeBtn)
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

function setupLanguageControls() {
  const modal = document.getElementById("lang-modal");
  const openBtn = document.getElementById("lang-open-btn");
  const closeBtn = modal ? modal.querySelector(".close-modal") : null;
  const list = document.getElementById("lang-list");
  const searchInput = document.getElementById("lang-search");

  supportedLangs.forEach((lang) => {
    const el = document.createElement("div");
    el.className = "lang-option";
    el.dataset.lang = lang.id;

    const label = document.createElement("span");
    label.textContent = lang.label;

    el.appendChild(label);

    el.addEventListener("click", async () => {
      await applyLanguage(lang.id);
      list
        .querySelectorAll(".lang-option")
        .forEach((opt) => opt.classList.remove("selected"));
      el.classList.add("selected");
      modal.classList.remove("open");
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

  const activeLang = list.querySelector(
    `.lang-option[data-lang="${currentLang}"]`
  );
  if (activeLang) activeLang.classList.add("selected");

  if (openBtn)
    openBtn.addEventListener("click", () => modal.classList.add("open"));
  if (closeBtn)
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

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
      updateVisibility();
    });
  }

  if (alarmToggle) {
    alarmToggle.checked = isAlarmSoundEnabled;
    alarmToggle.addEventListener("change", (e) => {
      isAlarmSoundEnabled = e.target.checked;
      updateVisibility();
    });
  }

  if (tickVolumeSlider) {
    tickVolumeSlider.value = tickVolume;
    tickVolumeSlider.addEventListener("input", (e) => {
      tickVolume = parseFloat(e.target.value);
    });
  }

  if (alarmVolumeSlider) {
    alarmVolumeSlider.value = alarmVolume;
    alarmVolumeSlider.addEventListener("input", (e) => {
      alarmVolume = parseFloat(e.target.value);
    });
  }

  updateVisibility();

  if (openBtn)
    openBtn.addEventListener("click", () => modal.classList.add("open"));
  if (closeBtn)
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

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

function setupAnimationSwitcher() {
  const toggle = document.getElementById("animation-toggle");
  const isEnabled = localStorage.getItem("countdown_animation") !== "false";

  if (toggle) {
    toggle.checked = isEnabled;
    applyAnimationState(isEnabled);

    toggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      applyAnimationState(enabled);
    });
  }
}

function applyAnimationState(enabled) {
  document.body.classList.toggle("no-animations", !enabled);
}

function startBlobAnimation() {
  const blobs = document.querySelectorAll(".blob");
  function updatePositions() {
    if (document.body.classList.contains("no-animations")) return;
    blobs.forEach((blob) => {
      const x = Math.random() * (window.innerWidth - blob.clientWidth);
      const y = Math.random() * (window.innerHeight - blob.clientHeight);
      blob.style.transform = `translate(${x}px, ${y}px)`;
    });
    setTimeout(updatePositions, 20000);
  }
  updatePositions();

  const toggle = document.getElementById("animation-toggle");
  if (toggle) {
    toggle.addEventListener("change", (e) => {
      if (e.target.checked) updatePositions();
    });
  }
}

document
  .querySelectorAll('.range-wrapper input[type="range"]')
  .forEach((slider) => {
    const update = () => {
      const percent =
        ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
      slider.style.setProperty("--range-progress", `${percent}%`);
    };
    slider.addEventListener("input", update);
    update();
  });

document.getElementById("generate-btn").addEventListener("click", () => {
  const h = document.getElementById("hours").value;
  const m = document.getElementById("minutes").value;
  const titleInput = document.getElementById("timer-title-input");
  const title = titleInput ? titleInput.value : "";
  const theme = document.body.getAttribute("data-theme") || "default";

  const baseUrl = new URL("template/wt.html", window.location.href).href.split(
    "?"
  )[0];
  const url = new URL(baseUrl);

  url.searchParams.set("widget", "true");
  url.searchParams.set("theme", theme);
  url.searchParams.set("lang", currentLang);

  if (h > 0) url.searchParams.set("h", h);
  if (m > 0) url.searchParams.set("m", m);
  if (title) url.searchParams.set("title", title);

  url.searchParams.set("tick", isTickSoundEnabled);
  url.searchParams.set("alarm", isAlarmSoundEnabled);
  url.searchParams.set("tickVol", tickVolume);
  url.searchParams.set("alarmVol", alarmVolume);

  const animToggle = document.getElementById("widget-anim-toggle");
  if (animToggle) url.searchParams.set("anim", animToggle.checked);

  const transparentBg = document.getElementById("transparent-bg-toggle");
  if (transparentBg && transparentBg.checked) {
    url.searchParams.set("bg", "transparent");
  }

  const hideBtn = document.getElementById("hide-btn-toggle");
  if (hideBtn && hideBtn.checked) {
    url.searchParams.set("hideBtn", "true");
  }

  const autoRestart = document.getElementById("auto-restart-toggle");
  if (autoRestart && autoRestart.checked) {
    url.searchParams.set("autoRestart", "true");
  }

  const code = `<iframe src="${url.toString()}" width="100%" height="600" frameborder="0" allow="autoplay; fullscreen"></iframe>`;

  const output = document.getElementById("widget-output");
  const textarea = document.getElementById("widget-code");

  textarea.value = code;
  output.classList.remove("hidden");

  requestAnimationFrame(() => {
    autoResizeTextarea(textarea);
    textarea.scrollTop = 0;
  });

  output.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const textarea = document.getElementById("widget-code");
  textarea.select();
  document.execCommand("copy");
  const btn = document.getElementById("copy-btn");
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t("copied_msg")}`;
  setTimeout(() => (btn.innerHTML = originalText), 2000);
});

document.addEventListener("DOMContentLoaded", () => {
  const translationsPromise = loadTranslations();
  setupThemeControls();
  setupLanguageControls();
  setupSoundControls();
  setupSettingsModal();
  setupAnimationSwitcher();
  startBlobAnimation();

  [
    document.getElementById("hours"),
    document.getElementById("minutes"),
  ].forEach((input) => {
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

  const loaderScreen = document.getElementById("loading-screen");
  const loaderBar = document.querySelector(".loader-bar");
  const loaderPercentage = document.querySelector(".loader-percentage");
  const loaderText = document.querySelector(".loader-text");

  if (loaderScreen && loaderBar) {
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
        "Prêt!",
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
      translationsPromise,
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
});

document.addEventListener("keydown", (e) => {
  const openModal = document.querySelector(".modal.open");
  if (openModal && e.key === "Escape") {
    openModal.classList.remove("open");
  }
});
