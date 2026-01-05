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
      let response = await fetch(`../assets/languages/${lang}.json`);
      if (!response.ok) {
        response = await fetch(`../../assets/languages/${lang}.json`);
      }
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
    if (!translations[lang].preview_label)
      translations[lang].preview_label =
        lang === "it" ? "Anteprima" : "Preview";
    if (!translations[lang].back_btn)
      translations[lang].back_btn = lang === "it" ? "Modifica" : "Edit";
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

function setupWidgetControls() {
  setupCustomSelect(
    "widget-lang-select",
    supportedLangs,
    currentLang,
    (val) => {
      updateWidgetCode(false);
    }
  );

  setupCustomSelect(
    "widget-theme-select",
    themes,
    "default",
    (val) => {
      updateWidgetCode(false);
    },
    true
  );

  ["widget-tick-toggle", "widget-alarm-toggle", "widget-anim-toggle"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => updateWidgetCode(false));
  });
}

function setupCustomSelect(
  id,
  options,
  initialValue,
  onChange,
  isTheme = false
) {
  const container = document.getElementById(id);
  if (!container) return;

  container.dataset.value = initialValue;

  // Create Trigger
  const trigger = document.createElement("div");
  trigger.className = "select-trigger";

  const getLabel = (opt) => (isTheme ? t("theme_" + opt.id) : opt.label);
  const initialOpt = options.find((o) => o.id === initialValue) || options[0];

  const contentWrapper = document.createElement("div");
  contentWrapper.style.cssText =
    "display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;";

  const visualSpan = document.createElement("span");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "select-input";
  input.readOnly = true;
  input.placeholder = t("search_placeholder");

  const arrow = document.createElement("i");
  arrow.className = "fa-solid fa-chevron-down";

  contentWrapper.appendChild(visualSpan);
  contentWrapper.appendChild(input);
  trigger.appendChild(contentWrapper);
  trigger.appendChild(arrow);

  const updateTriggerUI = (opt) => {
    visualSpan.innerHTML = "";
    visualSpan.style.display = "none";
    if (isTheme) {
      visualSpan.style.display = "flex";
      visualSpan.style.alignItems = "center";
      visualSpan.innerHTML = `<span class="theme-dot" style="background: ${opt.color}"></span>`;
    } else if (opt.flag) {
      visualSpan.style.display = "flex";
      visualSpan.style.alignItems = "center";
      visualSpan.innerHTML = `<img src="https://flagcdn.com/24x18/${opt.flag}.png" alt="${opt.flag}" style="width: 20px; height: 15px; object-fit: cover; border-radius: 2px;">`;
    }
    input.value = getLabel(opt);
  };

  updateTriggerUI(initialOpt);

  // Create Options List
  const optionsList = document.createElement("div");
  optionsList.className = "select-options";

  const renderOptions = (filter = "") => {
    optionsList.innerHTML = "";
    const term = filter.toLowerCase();
    let found = false;

    options.forEach((opt) => {
      const label = getLabel(opt);
      if (term && !label.toLowerCase().includes(term)) return;
      found = true;

      const optionEl = document.createElement("div");
      optionEl.className = "custom-option";
      if (opt.id === container.dataset.value)
        optionEl.classList.add("selected");

      optionEl.innerHTML = `
        ${
          isTheme
            ? `<span class="theme-dot" style="background: ${opt.color}"></span>`
            : ""
        }
        ${
          opt.flag
            ? `<img src="https://flagcdn.com/24x18/${opt.flag}.png" alt="${opt.flag}" style="width: 20px; height: 15px; object-fit: cover; border-radius: 2px;">`
            : ""
        }
        <span>${label}</span>
    `;

      optionEl.addEventListener("click", (e) => {
        e.stopPropagation();
        container.dataset.value = opt.id;
        updateTriggerUI(opt);

        container.classList.remove("open");
        if (container.resetInput) container.resetInput();
        if (onChange) onChange(opt.id);
      });

      optionsList.appendChild(optionEl);
    });

    if (!found) {
      const noRes = document.createElement("div");
      noRes.className = "custom-option";
      noRes.style.cursor = "default";
      noRes.textContent =
        t("search_placeholder") === "Search..."
          ? "No results"
          : "Nessun risultato";
      optionsList.appendChild(noRes);
    }
  };

  renderOptions();

  container.appendChild(trigger);
  container.appendChild(optionsList);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = container.classList.contains("open");

    document.querySelectorAll(".custom-select").forEach((el) => {
      if (el !== container) {
        el.classList.remove("open");
        if (el.resetInput) el.resetInput();
      }
    });

    if (!wasOpen) {
      container.classList.add("open");
      input.readOnly = false;
      input.focus();
      input.select();
      renderOptions("");
    } else {
      if (e.target !== input) {
        container.classList.remove("open");
        if (container.resetInput) container.resetInput();
      }
    }
  });

  input.addEventListener("input", (e) => {
    if (!container.classList.contains("open")) container.classList.add("open");
    renderOptions(e.target.value);
  });

  container.resetInput = () => {
    const val = container.dataset.value;
    const opt = options.find((o) => o.id === val);
    if (opt) updateTriggerUI(opt);
    input.readOnly = true;
    input.blur();
  };
}

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-select").forEach((el) => {
    el.classList.remove("open");
    if (el.resetInput) el.resetInput();
  });
});

function setupAnimationSwitcher() {
  const isEnabled = localStorage.getItem("countdown_animation") !== "false";
  applyAnimationState(isEnabled);
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
}

function showNotification(message) {
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

function updateWidgetCode(isClick = false) {
  const h = document.getElementById("hours").value;
  const m = document.getElementById("minutes").value;

  if ((parseInt(h) || 0) === 0 && (parseInt(m) || 0) === 0) {
    if (isClick) showNotification(t("notif_min_time"));
    return;
  }

  const titleInput = document.getElementById("timer-title-input");
  const title = titleInput ? titleInput.value : "";
  const themeSelect = document.getElementById("widget-theme-select");
  const theme = themeSelect ? themeSelect.dataset.value : "default";

  const baseUrl = new URL("template/wt.html", window.location.href).href.split(
    "?"
  )[0];
  const url = new URL(baseUrl);

  url.searchParams.set("widget", "true");
  url.searchParams.set("theme", theme);

  const langSelect = document.getElementById("widget-lang-select");
  url.searchParams.set(
    "lang",
    langSelect ? langSelect.dataset.value : currentLang
  );

  if (h > 0) url.searchParams.set("h", h);
  if (m > 0) url.searchParams.set("m", m);
  if (title) url.searchParams.set("title", title);

  const tickToggle = document.getElementById("widget-tick-toggle");
  const alarmToggle = document.getElementById("widget-alarm-toggle");

  url.searchParams.set("tick", tickToggle ? tickToggle.checked : false);
  url.searchParams.set("alarm", alarmToggle ? alarmToggle.checked : false);
  url.searchParams.set("tickVol", 1);
  url.searchParams.set("alarmVol", 1);

  const animToggle = document.getElementById("widget-anim-toggle");
  if (animToggle) url.searchParams.set("anim", animToggle.checked);

  const transparentBg = document.getElementById("transparent-bg-toggle");
  const previewWrapper = document.getElementById("widget-preview-wrapper");

  if (transparentBg && transparentBg.checked) {
    url.searchParams.set("bg", "transparent");
    if (previewWrapper) previewWrapper.style.background = "transparent";
  } else {
    if (previewWrapper) previewWrapper.style.background = "rgba(0,0,0,0.1)";
  }

  const hideBtn = document.getElementById("hide-btn-toggle");
  if (hideBtn && hideBtn.checked) {
    url.searchParams.set("hideBtn", "true");
  }

  const autoRestart = document.getElementById("auto-restart-toggle");
  if (autoRestart && autoRestart.checked) {
    url.searchParams.set("autoRestart", "true");
  }

  const embedMethod =
    document.querySelector('input[name="embed_method"]:checked')?.value ||
    "iframe";
  let code = "";

  if (embedMethod === "script") {
    code = `<script>
(function() {
  var f = document.createElement('iframe');
  f.src = "${url.toString()}";
  f.style.cssText = "width:100%;height:600px;border:0;";
  f.allow = "autoplay; fullscreen";
  document.currentScript.parentNode.insertBefore(f, document.currentScript);
})();
<\/script>`;
  } else {
    code = `<iframe src="${url.toString()}" width="100%" height="600" frameborder="0" allow="autoplay; fullscreen"></iframe>`;
  }

  const output = document.getElementById("widget-output");
  const configSection = document.getElementById("config-section");
  const textarea = document.getElementById("widget-code");

  textarea.value = code;

  if (isClick) {
    if (configSection) configSection.classList.add("hidden");
    if (previewWrapper) {
      previewWrapper.innerHTML = "";
      const fragment = document.createRange().createContextualFragment(code);
      previewWrapper.appendChild(fragment);
      const iframe = previewWrapper.querySelector("iframe");
      if (iframe) {
        iframe.style.width = "100%";
        iframe.style.height = "100%";
      }
    }
    output.classList.remove("hidden");
    output.scrollIntoView({ behavior: "smooth" });
  }

  requestAnimationFrame(() => {
    autoResizeTextarea(textarea);
    textarea.scrollTop = 0;
  });
}

document
  .getElementById("generate-btn")
  .addEventListener("click", () => updateWidgetCode(true));

document.querySelectorAll('input[name="embed_method"]').forEach((input) => {
  input.addEventListener("change", () => updateWidgetCode(false));
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

const backBtn = document.getElementById("back-to-config-btn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    document.getElementById("widget-output").classList.add("hidden");
    document.getElementById("config-section").classList.remove("hidden");
    const wrapper = document.getElementById("widget-preview-wrapper");
    if (wrapper) wrapper.innerHTML = "";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const translationsTask = loadTranslations();

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
      translationsTask,
      new Promise((resolve) => {
        if (document.readyState === "complete") resolve();
        else window.addEventListener("load", resolve);
      }),
    ])
      .then(() => {
        setupWidgetControls();
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

        const savedTheme = localStorage.getItem("countdown_theme");
        if (savedTheme && savedTheme !== "default") {
          document.body.setAttribute("data-theme", savedTheme);
        }
      })
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
