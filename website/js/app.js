(function () {
  const data = window.TRUST_DATA;
  const state = {
    lang: localStorage.getItem("trust-lang") || "en",
    appsScriptUrl: ""
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const t = (key) => data.translations[state.lang][key] || data.translations.en[key] || key;

  function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem("trust-lang", lang);
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    $$("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    $("[data-lang-toggle]").textContent = lang === "en" ? "தமிழ்" : "English";
    renderDynamicContent();
  }

  function renderDynamicContent() {
    renderMissions();
    renderVillages($("#villageSearch")?.value || "");
    renderActivities();
    renderTools();
    fillSelects();
    renderQuickQuestions();
  }

  function renderMissions() {
    const grid = $("#missionGrid");
    if (!grid) return;
    grid.innerHTML = data.missions.map((item) => {
      const [icon, enTitle, taTitle, enCopy, taCopy] = item;
      return `
        <article class="mission-card reveal">
          <span class="card-icon" aria-hidden="true">${icon}</span>
          <h3>${state.lang === "ta" ? taTitle : enTitle}</h3>
          <p>${state.lang === "ta" ? taCopy : enCopy}</p>
        </article>
      `;
    }).join("");
  }

  function renderVillages(query = "") {
    const grid = $("#villageGrid");
    if (!grid) return;
    const q = query.trim().toLowerCase();
    const villages = data.villages.filter(([en, ta, coordinator, phone]) => {
      return [en, ta, coordinator, phone].join(" ").toLowerCase().includes(q);
    });
    grid.innerHTML = villages.map(([en, ta, coordinator, phone], index) => {
      const name = state.lang === "ta" ? ta : en;
      const displayPhone = phone.replace(/^(\+91|\+974|\+968)/, "$1 ");
      return `
        <article class="village-card reveal">
          <div class="village-image" style="--hue:${index * 19}">
            <span>${String(index + 1).padStart(2, "0")}</span>
          </div>
          <div class="village-body">
            <h3>${name}</h3>
            
            <dl>
              <div><dt>${state.lang === "ta" ? "ஒருங்கிணைப்பாளர்" : "Coordinator"}</dt><dd>${coordinator}</dd></div>
              <div><dt>${state.lang === "ta" ? "தொலைபேசி" : "Phone"}</dt><dd>${displayPhone}</dd></div>
            </dl>
            <div class="card-actions">
              <a href="tel:${phone}" aria-label="Call ${coordinator}">${state.lang === "ta" ? "அழைப்பு" : "Call"}</a>
              <a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderActivities() {
    const list = $("#activityList");
    if (!list) return;
    list.innerHTML = data.activities.map(([en, ta], index) => `
      <article class="activity-item reveal">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h3>${state.lang === "ta" ? ta : en}</h3>
      </article>
    `).join("");
  }

  function renderTools() {
    const grid = $("#toolGrid");
    if (!grid) return;
    grid.innerHTML = data.tools.map(([en, ta]) => `
      <article class="tool-card reveal">
        <span aria-hidden="true">✓</span>
        <h3>${state.lang === "ta" ? ta : en}</h3>
        <p>${state.lang === "ta" ? "Google Sheets மற்றும் Apps Script இணைப்புக்கு தயார்." : "Ready for Google Sheets and Apps Script integration."}</p>
      </article>
    `).join("");
  }

  function fillSelects() {
    const villageOptions = data.villages.map(([en, ta]) => `<option value="${en}">${state.lang === "ta" ? ta : en}</option>`).join("");
    ["#villageSelect", "#volunteerVillageSelect"].forEach((id) => {
      const node = $(id);
      if (node && node.dataset.filledLang !== state.lang) {
        node.innerHTML = villageOptions;
        node.dataset.filledLang = state.lang;
      }
    });

    const occupations = state.lang === "ta"
      ? ["மாணவர்", "தனியார் ஊழியர்", "அரசு ஊழியர்", "வியாபாரம்", "விவசாயி", "சுயதொழில்", "இல்லத்தரசி", "மற்றவை"]
      : ["Student", "Private Employee", "Government Employee", "Business", "Farmer", "Self-employed", "Housewife", "Other"];
    const occupationSelect = $("#occupationSelect");
    if (occupationSelect && occupationSelect.dataset.filledLang !== state.lang) {
      occupationSelect.innerHTML = occupations.map((value) => `<option>${value}</option>`).join("");
      occupationSelect.dataset.filledLang = state.lang;
    }

    const bloodSelect = $("#bloodSelect");
    if (bloodSelect && !bloodSelect.dataset.filled) {
      bloodSelect.innerHTML = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((value) => `<option>${value}</option>`).join("");
      bloodSelect.dataset.filled = "true";
    }
  }

  function bindNavigation() {
    const toggle = $(".nav-toggle");
    const links = $("#navLinks");
    toggle?.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$("#navLinks a").forEach((link) => {
      link.addEventListener("click", () => {
        links.classList.remove("is-open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });
    $("[data-lang-toggle]")?.addEventListener("click", () => setLanguage(state.lang === "en" ? "ta" : "en"));
    $(".scroll-top")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener("scroll", () => {
      $(".scroll-top")?.classList.toggle("is-visible", window.scrollY > 700);
    }, { passive: true });
  }

  function bindSearch() {
    $("#villageSearch")?.addEventListener("input", (event) => renderVillages(event.target.value));
  }

  function bindForms() {
    $$(".smart-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const result = form.querySelector(".form-result");
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.type = form.dataset.formType;
        payload.createdAt = new Date().toISOString();
        payload.membershipId = payload.type === "member" ? createMembershipId(payload.name) : "";

        if (!state.appsScriptUrl) {
          result.textContent = state.lang === "ta"
            ? `பதிவு தயார். ID: ${payload.membershipId || "VOL-" + Date.now().toString().slice(-6)}. Google Apps Script URL சேர்த்தால் இது Sheets-ல் சேமிக்கப்படும்.`
            : `Record ready. ID: ${payload.membershipId || "VOL-" + Date.now().toString().slice(-6)}. Add the Google Apps Script URL to save it in Sheets.`;
          form.reset();
          return;
        }

        try {
          result.textContent = state.lang === "ta" ? "சமர்ப்பிக்கப்படுகிறது..." : "Submitting...";
          await fetch(state.appsScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          result.textContent = state.lang === "ta" ? "வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது." : "Submitted successfully.";
          form.reset();
        } catch (error) {
          result.textContent = state.lang === "ta"
            ? "சமர்ப்பிக்க முடியவில்லை. WhatsApp அல்லது Phone மூலம் தொடர்பு கொள்ளவும்."
            : "Could not submit. Please contact through WhatsApp or Phone.";
        }
      });
    });
  }

  function createMembershipId(name) {
    const initials = (name || "Member").split(/\s+/).map((part) => part[0] || "").join("").slice(0, 3).toUpperCase();
    return `18VPT-${new Date().getFullYear()}-${initials}-${Date.now().toString().slice(-5)}`;
  }

  const faq = [
    {
      keys: ["member", "membership", "join", "உறுப்பினர்", "சேர"],
      en: "To become a member, fill the Membership Registration form with your name, guardian name, mobile, village, address and volunteer interest. Annual membership discussed in the trust notes is Rs. 1200.",
      ta: "உறுப்பினராக சேர, பெயர், பாதுகாவலர் பெயர், மொபைல், கிராமம், முகவரி மற்றும் தன்னார்வ ஆர்வம் ஆகியவற்றுடன் உறுப்பினர் பதிவு படிவத்தை நிரப்பவும். அறக்கட்டளை குறிப்புகளில் வருட சந்தா ரூ.1200 என குறிப்பிடப்பட்டுள்ளது."
    },
    {
      keys: ["donate", "donation", "நன்கொடை"],
      en: "You can donate for education, medical support, food, village development or emergency help. Current membership/donation account details are shown in the Donation section.",
      ta: "கல்வி, மருத்துவ உதவி, உணவு, கிராம வளர்ச்சி அல்லது அவசர உதவிக்காக நன்கொடை அளிக்கலாம். தற்போதைய உறுப்பினர்/நன்கொடை கணக்கு விவரங்கள் நன்கொடை பகுதியில் உள்ளது."
    },
    {
      keys: ["office", "address", "where", "அலுவலகம்", "முகவரி"],
      en: "The office address is 1/397B Pillaiyar Kovil Street, Pattadaikatti, Naduvakurichi Post, Veerasigamani Via, Sankarankovil T.K, Tenkasi District.",
      ta: "அலுவலக முகவரி: 1/397B பிள்ளையார் கோயில் தெரு, பட்டாடை கட்டி, நடுவக்குறிச்சி Post, வீரசிகாமணி Via, சங்கரன்கோவில் T.K, தென்காசி District."
    },
    {
      keys: ["president", "secretary", "treasurer", "leader", "தலைவர்", "செயலாளர்", "பொருளாளர்"],
      en: "President: Thiru Samuthirakani. Secretary: Thiru Radhakrishnan. Treasurer: Thiru Maniparathi.",
      ta: "தலைவர்: திரு. சமுத்திரக்கனி. செயலாளர்: திரு. ராதாகிருஷ்ணன். பொருளாளர்: திரு. மணிபாரதி."
    },
    {
      keys: ["villages", "18", "கிராம"],
      en: "The trust covers 18 villages including Andarkulam, Uchipatti, Melakalangal, Vellalankulam, Uthanakulam, Velayuthapuram, Balapathirapuram, Ramakrishnapuram, Sarkaraikulam and others.",
      ta: "அறக்கட்டளை ஆண்டார்குளம், உச்சிபத்தை, மேலகலங்கல், வெள்ளாளங்குளம், உத்தான்குளம், வேலாயுதபுரம், பலபத்திராமபுரம், ராமகிருஷ்ணாபுரம், சர்க்கரைக்குளம் உள்ளிட்ட 18 கிராமங்களை உள்ளடக்கியது."
    },
    {
      keys: ["student", "scholarship", "education", "மாணவர்", "கல்வி"],
      en: "Students can seek support for education, scholarships and guidance. Applications are reviewed by village coordinators and leadership based on immediate need.",
      ta: "மாணவர்கள் கல்வி உதவி, உதவித்தொகை மற்றும் வழிகாட்டுதலுக்காக விண்ணப்பிக்கலாம். உடனடி தேவையின் அடிப்படையில் ஒருங்கிணைப்பாளர்கள் மற்றும் தலைமை விண்ணப்பங்களை பரிசீலிப்பார்கள்."
    }
  ];

  function renderQuickQuestions() {
    const node = $("#quickQuestions");
    if (!node) return;
    const questions = state.lang === "ta"
      ? ["உறுப்பினராக எப்படி சேரலாம்?", "நன்கொடை எப்படி அளிப்பது?", "அலுவலகம் எங்கே?"]
      : ["How can I become a member?", "How do I donate?", "Where is the office?"];
    node.innerHTML = questions.map((question) => `<button type="button">${question}</button>`).join("");
    $$("button", node).forEach((button) => button.addEventListener("click", () => answerQuestion(button.textContent)));
  }

  function bindChat() {
    const panel = $(".chat-panel");
    $(".chat-toggle")?.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden && !$("#chatLog").children.length) addChatMessage("bot", state.lang === "ta" ? "வணக்கம். அறக்கட்டளை பற்றி கேளுங்கள்." : "Hello. Ask me about the trust.");
    });
    $(".chat-close")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.hidden = true; 
    });
    document.addEventListener("click", (e) => {
      if (panel && !panel.hidden && !e.target.closest(".chatbot")) {
        panel.hidden = true;
      }
    });
    $("#chatForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#chatInput");
      const question = input.value.trim();
      if (!question) return;
      input.value = "";
      answerQuestion(question);
    });
  }

  function answerQuestion(question) {
    addChatMessage("user", question);
    const lower = question.toLowerCase();
    const hit = faq.find((item) => item.keys.some((key) => lower.includes(key.toLowerCase())));
    addChatMessage("bot", hit ? hit[state.lang] : (state.lang === "ta" ? "தயவுசெய்து WhatsApp அல்லது Phone மூலம் அலுவலகத்தை தொடர்பு கொள்ளவும்." : "Please contact our office through WhatsApp or Phone."));
  }

  function addChatMessage(role, text) {
    const log = $("#chatLog");
    const bubble = document.createElement("p");
    bubble.className = `chat-message ${role}`;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.08 });
    const observe = () => $$(".reveal").forEach((node) => observer.observe(node));
    observe();
    const originalRender = renderDynamicContent;
    window.refreshReveals = () => setTimeout(observe, 0);
    renderDynamicContent = function () {
      originalRender();
      window.refreshReveals();
    };
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupReveal();
    bindNavigation();
    bindSearch();
    bindForms();
    bindChat();
    setLanguage(state.lang);
    registerServiceWorker();
  });
})();
