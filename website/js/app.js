(function () {
  "use strict";

  const data = window.TRUST_DATA;
  if (!data) {
    console.error("TRUST_DATA not loaded!");
    return;
  }

  // State
  const state = {
    lang: localStorage.getItem("trust-lang") || "ta", // Default to Tamil as per client specs
    activeTab: "exec",
    activeEventFilter: "all",
    activeFinanceYear: "2023_2024"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function t(key) {
    const dict = data.translations[state.lang] || data.translations.ta;
    return dict[key] || (data.translations.en && data.translations.en[key]) || key;
  }

  // Persistent Bilingual Switcher & Re-rendering
  function setLanguage(newLang) {
    state.lang = newLang;
    localStorage.setItem("trust-lang", newLang);
    document.documentElement.lang = newLang;

    // Update persistent segmented buttons
    const btnTa = $("#btnLangTa");
    const btnEn = $("#btnLangEn");
    if (btnTa && btnEn) {
      btnTa.classList.toggle("active", newLang === "ta");
      btnTa.setAttribute("aria-pressed", String(newLang === "ta"));
      btnEn.classList.toggle("active", newLang === "en");
      btnEn.setAttribute("aria-pressed", String(newLang === "en"));
    }

    // Update all i18n texts
    $$("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const translated = t(key);
      if (translated) el.textContent = translated;
    });

    // Update placeholders
    const searchInput = $("#villageSearchInput");
    if (searchInput) {
      searchInput.placeholder = state.lang === "ta" 
        ? "கிராமம் அல்லது ஒருங்கிணைப்பாளர் பெயர் தேடவும்..." 
        : "Search village name or coordinator...";
    }

    const chatInput = $("#chatInput");
    if (chatInput) {
      chatInput.placeholder = state.lang === "ta"
        ? "உங்கள் கேள்வியை தட்டச்சு செய்யவும்..."
        : "Type your question here...";
    }

    // Re-render dynamic sections
    renderPillars();
    renderVillages($("#villageSearchInput")?.value || "");
    renderLeadership(state.activeTab);
    renderEvents(state.activeEventFilter);
    renderFinancials(state.activeFinanceYear);
    renderAuditTable();
    populateVillageSelect();
    renderQuickChips();

    // Re-welcome message in chat if open
    const chatLog = $("#chatLog");
    if (chatLog && chatLog.children.length === 0) {
      addBotMessage(state.lang === "ta" ? data.translations.ta["chat.welcome"] : data.translations.en["chat.welcome"]);
    }
  }

  // Render 6 Mission Pillars
  function renderPillars() {
    const grid = $("#pillarsGrid");
    if (!grid) return;
    grid.innerHTML = data.pillars.map((item) => {
      const title = state.lang === "ta" ? item.titleTa : item.titleEn;
      const desc = state.lang === "ta" ? item.descTa : item.descEn;
      return `
        <article class="pillar-card">
          <span class="pillar-icon" aria-hidden="true">${item.icon}</span>
          <h3>${title}</h3>
          <p>${desc}</p>
        </article>
      `;
    }).join("");
  }

  // Render 18 Villages
  function renderVillages(query = "") {
    const grid = $("#villagesGrid");
    if (!grid) return;
    const q = query.trim().toLowerCase();

    const filtered = data.villages.filter((v) => {
      const haystack = [v.en, v.ta, v.coordinator, v.profTa, v.profEn, v.phone].join(" ").toLowerCase();
      return haystack.includes(q);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: #fff; border-radius: var(--radius); border: 1px dashed var(--border);">
          <p style="color: var(--text-muted); font-size: 1.1rem; margin: 0;">
            ${state.lang === "ta" ? "பொருத்தமான கிராமம் அல்லது ஒருங்கிணைப்பாளர் காணப்படவில்லை." : "No matching village or coordinator found."}
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((v) => {
      const villageName = state.lang === "ta" ? v.ta : v.en;
      const prof = state.lang === "ta" ? v.profTa : v.profEn;
      const cleanPhone = v.phone.replace(/[^0-9]/g, "");
      const waText = encodeURIComponent(
        state.lang === "ta"
          ? `வணக்கம், நான் ${v.ta} கிராமத்தை சேர்ந்தவர். 18 கிராம மக்கள் அறக்கட்டளை தொடர்பு கொள்ள விரும்புகிறேன்.`
          : `Hello, I am from ${v.en} village. I want to connect with 18 Village People Trust.`
      );

      return `
        <article class="village-card">
          <div class="village-top">
            <span class="village-num">${String(v.id).padStart(2, "0")}</span>
            <span class="village-badge">${state.lang === "ta" ? "ஒருங்கிணைப்பாளர்" : "Coordinator"}</span>
          </div>
          <h3>${villageName}</h3>
          <p class="village-coordinator">👤 ${v.coordinator}</p>
          <p class="village-prof">💼 ${prof}</p>
          <span class="village-phone">📞 ${v.phone}</span>
          <div class="village-actions">
            <a class="btn-call" href="tel:${v.phone}">📞 ${state.lang === "ta" ? "அழைக்க" : "Call"}</a>
            <a class="btn-wa" href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </div>
        </article>
      `;
    }).join("");
  }

  // Render Leadership Grid based on Active Tab
  function renderLeadership(tabKey = "exec") {
    state.activeTab = tabKey;
    const grid = $("#leadershipGrid");
    if (!grid) return;

    if (tabKey === "exec") {
      grid.innerHTML = data.executiveCommittee.map((exec) => {
        const role = state.lang === "ta" ? exec.roleTa : exec.roleEn;
        const title = state.lang === "ta" ? exec.titleTa : exec.titleEn;
        const duties = state.lang === "ta" ? exec.dutiesTa : exec.dutiesTa;
        const cleanPhone = exec.phone.replace(/[^0-9]/g, "");

        return `
          <article class="leader-card">
            <span class="leader-role-tag">${role}</span>
            <h3 class="leader-name">${exec.name}</h3>
            <p class="leader-title">🏢 ${title}</p>
            <p class="leader-details">📍 <strong>${state.lang === "ta" ? "சொந்த ஊர்:" : "Hometown:"}</strong> ${exec.hometown}<br>🎯 ${duties}</p>
            <div class="leader-footer">
              <span class="leader-phone">📞 ${exec.phone}</span>
              <a class="button sm whatsapp-btn" href="https://wa.me/${cleanPhone}" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </article>
        `;
      }).join("");
    } else if (tabKey === "trustees") {
      grid.innerHTML = data.boardOfTrustees.map((tr) => {
        const company = state.lang === "ta" ? tr.companyTa : tr.companyEn;
        const role = state.lang === "ta" ? tr.roleTa : tr.roleEn;
        const cleanPhone = tr.phone.replace(/[^0-9]/g, "");

        return `
          <article class="leader-card">
            <span class="leader-role-tag" style="background: var(--gold-light); color: var(--gold-dark); border-color: var(--gold);">
              ${state.lang === "ta" ? "அறங்காவலர்" : "Trustee"}
            </span>
            <h3 class="leader-name">${tr.name}</h3>
            <p class="leader-title">🌐 ${company}</p>
            <p class="leader-details">📍 <strong>${state.lang === "ta" ? "சொந்த ஊர்:" : "Hometown:"}</strong> ${tr.hometown}<br>🎯 <strong>${state.lang === "ta" ? "முக்கிய பொறுப்பு:" : "Focus:"}</strong> ${role}</p>
            <div class="leader-footer">
              <span class="leader-phone">📞 ${tr.phone}</span>
              <a class="button sm whatsapp-btn" href="https://wa.me/${cleanPhone}" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </article>
        `;
      }).join("");
    } else if (tabKey === "coordinators") {
      grid.innerHTML = data.advisorsAndCoordinators.map((c) => {
        const title = state.lang === "ta" ? c.titleTa : c.titleEn;
        const org = state.lang === "ta" ? c.orgTa : c.orgEn;
        const focus = state.lang === "ta" ? c.focusTa : c.focusTa;
        const cleanPhone = c.phone.replace(/[^0-9]/g, "");

        return `
          <article class="leader-card">
            <span class="leader-role-tag" style="background: var(--green-light); color: var(--green-dark); border-color: var(--green);">
              ${title}
            </span>
            <h3 class="leader-name">${c.name}</h3>
            <p class="leader-title">💼 ${org}</p>
            <p class="leader-details">📍 <strong>${state.lang === "ta" ? "சொந்த ஊர்:" : "Hometown:"}</strong> ${c.hometown}<br>🎯 <strong>${state.lang === "ta" ? "செயல்பாடு:" : "Focus:"}</strong> ${focus}</p>
            <div class="leader-footer">
              <span class="leader-phone">📞 ${c.phone}</span>
              <a class="button sm whatsapp-btn" href="https://wa.me/${cleanPhone}" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </article>
        `;
      }).join("");
    }
  }

  // Render Events Gallery with Category Filter, Amount Pill, Itemized Breakdown & Lightbox
  function renderEvents(category = "all") {
    state.activeEventFilter = category;
    const grid = $("#eventsGrid");
    if (!grid) return;

    const filtered = category === "all"
      ? data.events
      : data.events.filter((ev) => ev.category === category);

    grid.innerHTML = filtered.map((ev) => {
      const title = state.lang === "ta" ? ev.titleTa : ev.titleEn;
      const desc = state.lang === "ta" ? ev.descTa : ev.descEn;
      const venue = state.lang === "ta" ? ev.venueTa : ev.venueEn;

      return `
        <article class="event-card" data-event-id="${ev.id}">
          <div class="event-media" role="button" tabindex="0" title="${state.lang === "ta" ? "புகைப்படத்தை முழு அளவில் பார்க்க கிளிக் செய்க" : "Click to view full image"}">
            <img src="${ev.image}" alt="${title}" loading="lazy">
            <span class="event-badge">${ev.code}</span>
            <span class="zoom-hint">🔍 ${state.lang === "ta" ? "பெரிதாக்க" : "Enlarge"}</span>
          </div>
          <div class="event-body">
            <div class="event-meta">
              <span>📅 ${ev.date}</span>
              <span>📍 ${venue}</span>
              ${ev.amount ? `<span class="event-amount-pill">💰 ${ev.amount}</span>` : ""}
            </div>
            <h3>${title}</h3>
            ${ev.beneficiary ? `
              <p style="font-weight: 700; color: var(--gold-dark); margin: 0 0 0.5rem; font-size: 0.88rem;">
                🎯 ${ev.beneficiary}
              </p>
            ` : ""}
            <p>${desc}</p>

            ${ev.expenseDetails && ev.expenseDetails.length > 0 ? `
              <details class="event-breakdown-details">
                <summary>
                  <span>📋 ${state.lang === "ta" ? "செலவு விவரங்கள் (Exp. Details)" : "Itemized Cost Breakdown"}</span>
                  <span style="font-size: 0.78rem; color: var(--text-light);">▼</span>
                </summary>
                <div class="expense-item-list" style="margin-top: 0.5rem;">
                  ${ev.expenseDetails.map((item) => `
                    <div class="expense-item-row">
                      <span>${state.lang === "ta" ? item.itemTa : (item.itemEn || item.itemTa)}</span>
                      <span class="expense-item-amt">${item.amount}</span>
                    </div>
                  `).join("")}
                </div>
              </details>
            ` : ""}

            <div class="event-footer">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--green-dark);">
                ✓ ${state.lang === "ta" ? "நிறைவேற்றப்பட்டது" : "Completed"}
              </span>
              ${ev.megaUrl ? `
                <a class="event-album-link" href="${ev.megaUrl}" target="_blank" rel="noreferrer">
                  📸 ${state.lang === "ta" ? "முழு ஆல்பம் (Mega)" : "Full Album"} ↗
                </a>
              ` : ""}
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Attach Lightbox click handler to all event media
    grid.querySelectorAll(".event-media").forEach((mediaWrap) => {
      const img = mediaWrap.querySelector("img");
      const title = mediaWrap.closest(".event-card")?.querySelector("h3")?.textContent || "";
      const handleOpen = () => {
        if (img) openLightbox(img.src, title);
      };
      mediaWrap.addEventListener("click", handleOpen);
      mediaWrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      });
    });
  }

  // Render Annual Income & Expenditure Statement Section (வருடாந்திர வரவு – செலவு அறிக்கை)
  function renderFinancials(yearKey = "2023_2024") {
    state.activeFinanceYear = yearKey;
    const container = $("#financeYearContainer");
    if (!container) return;

    // Update active tab buttons
    $$(".finance-tabs-nav .finance-tab-btn").forEach((btn) => {
      const isActive = btn.dataset.year === yearKey;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    const isTa = state.lang === "ta";

    // Scenario A: 3-Year Consolidated Summary
    if (yearKey === "threeYearAudit") {
      const summaryList = data.annualFinancials.threeYearAudit;
      container.innerHTML = `
        <div class="finance-kpi-grid">
          <div class="finance-kpi-card income">
            <div class="finance-kpi-icon">📈</div>
            <div class="finance-kpi-titles">
              <span class="finance-kpi-label">${isTa ? "3-ஆண்டு மொத்த வரவு (Total Inflow)" : "3-Year Total Receipts"}</span>
              <span class="finance-kpi-val" style="color: #15803d;">₹7,27,792</span>
            </div>
          </div>
          <div class="finance-kpi-card expense">
            <div class="finance-kpi-icon">📉</div>
            <div class="finance-kpi-titles">
              <span class="finance-kpi-label">${isTa ? "3-ஆண்டு மொத்த செலவு (Total Outlay)" : "3-Year Total Outlay"}</span>
              <span class="finance-kpi-val" style="color: #b91c1c;">₹6,30,358</span>
            </div>
          </div>
          <div class="finance-kpi-card balance">
            <div class="finance-kpi-icon">💰</div>
            <div class="finance-kpi-titles">
              <span class="finance-kpi-label">${isTa ? "நிகர கையிருப்பு (Closing Cash Balance)" : "Net Closing Balance"}</span>
              <span class="finance-kpi-val" style="color: var(--gold-dark);">₹220*</span>
            </div>
          </div>
        </div>

        <div class="finance-card" style="margin-bottom: 1.5rem;">
          <div class="finance-card-head">
            <h3>📊 ${isTa ? "3 ஆண்டுகளின் ஒருங்கிணைந்த தணிக்கை அறிக்கை சுருக்கம்" : "3-Year Consolidated Audited Statement"}</h3>
            <span class="amount-badge-credit">2023 – 2025</span>
          </div>
          <div class="finance-table-scroll">
            <table class="finance-table">
              <thead>
                <tr>
                  <th>${isTa ? "ஆண்டு (Year)" : "Year"}</th>
                  <th style="text-align: right;">${isTa ? "மொத்த வரவு" : "Total Receipts"}</th>
                  <th style="text-align: right;">${isTa ? "மொத்த செலவு" : "Total Outlay"}</th>
                  <th style="text-align: right;">${isTa ? "ஆண்டு இருப்பு" : "Balance"}</th>
                  <th>${isTa ? "முக்கிய பணிகள் & திட்டங்கள்" : "Key Programs & Milestones"}</th>
                </tr>
              </thead>
              <tbody>
                ${summaryList.map((row) => `
                  <tr>
                    <td><strong>${row.year}</strong></td>
                    <td style="text-align: right;"><span class="amount-badge-credit">${row.income}</span></td>
                    <td style="text-align: right;"><span class="amount-badge-debit">${row.expense}</span></td>
                    <td style="text-align: right;"><strong>${row.balance}</strong></td>
                    <td>${isTa ? row.descTa : (row.descEn || row.descTa)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="finance-note-card">
          <h4>📜 ${isTa ? "வெளிப்படையான தணிக்கை உறுதிமொழி" : "Transparency & Audit Certificate"}</h4>
          <p>
            ${isTa 
              ? "18 கிராம மக்கள் அறக்கட்டளையின் அனைத்து வரவு-செலவுகளும் நிர்வாகக் குழுவின் முறைப்படியான ஒப்புதலுடன் பதிவு செய்யப்பட்டு, சமூக நலன், கல்வி, மருத்துவம் மற்றும் மாணவர் அரசு வேலைவாய்ப்பு பணிகளுக்காக 100% வெளிப்படைத்தன்மையுடன் பயன்படுத்தப்பட்டுள்ளன. ஆண்டு பொதுக்குழு கூட்டங்களில் உறுப்பினர்கள் மற்றும் பொதுமக்கள் பார்வைக்கு முழு கணக்குகளும் சமர்ப்பிக்கப்பட்டு அங்கீகரிக்கப்பட்டுள்ளன."
              : "All financial transactions of 18 Village People Trust are meticulously verified, documented, and approved by the Executive Committee. 100% of receipts are deployed directly towards higher education scholarships, emergency medical transplants, free competitive coaching, and rural development."}
          </p>
        </div>
      `;
      return;
    }

    // Scenario B: PMT College Special Dedicated Fund
    if (yearKey === "pmtCollegeAccount") {
      const colData = data.annualFinancials.pmtCollegeAccount;
      container.innerHTML = `
        <div class="finance-kpi-grid">
          <div class="finance-kpi-card income">
            <div class="finance-kpi-icon">📈</div>
            <div class="finance-kpi-titles">
              <span class="finance-kpi-label">${isTa ? "மொத்த நிதி வரவு (Total Received)" : "Total Received"}</span>
              <span class="finance-kpi-val" style="color: #15803d;">${colData.totalIncome}</span>
            </div>
          </div>
          <div class="finance-kpi-card expense">
            <div class="finance-kpi-icon">📉</div>
            <div class="finance-kpi-titles">
              <span class="finance-kpi-label">${isTa ? "மொத்த உறுப்பினர் சேர்க்கை செலவு" : "Total Outlay (500 Members)"}</span>
              <span class="finance-kpi-val" style="color: #b91c1c;">${colData.totalExpense}</span>
            </div>
          </div>
          <div class="finance-kpi-card balance">
            <div class="finance-kpi-icon">💰</div>
            <div class="finance-kpi-titles">
              <span class="finance-kpi-label">${isTa ? "கையிருப்பு இருப்பு (Retained Balance)" : "Retained Balance"}</span>
              <span class="finance-kpi-val" style="color: var(--gold-dark);">${colData.closingBalance}</span>
            </div>
          </div>
        </div>

        <div class="finance-card" style="margin-bottom: 1.5rem;">
          <div class="finance-card-head">
            <h3>🎓 ${isTa ? colData.titleTa : colData.titleEn}</h3>
            <span class="amount-badge-credit">${colData.sponsors.length} ${isTa ? "நன்கொடையாளர்கள் & நிதிகள்" : "Donors & Allocations"}</span>
          </div>
          <div class="finance-table-scroll">
            <table class="finance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isTa ? "நன்கொடையாளர் / ஒதுக்கீடு" : "Donor Name / Allocation"}</th>
                  <th>${isTa ? "ஊர்" : "Village"}</th>
                  <th style="text-align: right;">${isTa ? "தொகை" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                ${colData.sponsors.map((sp) => `
                  <tr>
                    <td>${sp.sno}</td>
                    <td><strong>${sp.name}</strong></td>
                    <td>📍 ${sp.village}</td>
                    <td style="text-align: right;"><span class="amount-badge-credit">${sp.amount}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="finance-note-card">
          <h4>📜 ${isTa ? "திட்டத்தின் நோக்கம் & அறிக்கை" : "Program Note & Objective"}</h4>
          <p>${isTa ? colData.reportNoteTa : colData.reportNoteEn}</p>
        </div>
      `;
      return;
    }

    // Scenario C: Yearly Statements (2023_2024, 2024_2025, 2025_2026)
    const finData = data.annualFinancials["y" + yearKey];
    if (!finData) return;

    container.innerHTML = `
      <div class="finance-kpi-grid">
        <div class="finance-kpi-card income">
          <div class="finance-kpi-icon">📈</div>
          <div class="finance-kpi-titles">
            <span class="finance-kpi-label">${isTa ? "மொத்த வரவு (Total Receipts)" : "Total Receipts"}</span>
            <span class="finance-kpi-val" style="color: #15803d;">${finData.totalIncome}</span>
          </div>
        </div>
        <div class="finance-kpi-card expense">
          <div class="finance-kpi-icon">📉</div>
          <div class="finance-kpi-titles">
            <span class="finance-kpi-label">${isTa ? "மொத்த செலவு (Total Outlay)" : "Total Outlay"}</span>
            <span class="finance-kpi-val" style="color: #b91c1c;">${finData.totalExpense}</span>
          </div>
        </div>
        <div class="finance-kpi-card balance">
          <div class="finance-kpi-icon">💰</div>
          <div class="finance-kpi-titles">
            <span class="finance-kpi-label">${isTa ? "ஆண்டு இறுதி இருப்பு (Closing Balance)" : "Closing Balance"}</span>
            <span class="finance-kpi-val" style="color: var(--gold-dark);">${finData.closingBalance}</span>
          </div>
        </div>
      </div>

      <div class="finance-table-grid">
        <!-- Left: Income Table -->
        <div class="finance-card">
          <div class="finance-card-head">
            <h3>📥 ${isTa ? "1. வரவு விவரங்கள் (Donations / Receipts)" : "1. Income & Receipts Roster"}</h3>
            <span class="amount-badge-credit">${finData.incomeList.length} ${isTa ? "பதிவுகள்" : "Entries"}</span>
          </div>
          <div class="finance-table-scroll">
            <table class="finance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isTa ? "நன்கொடையாளர் / விவரம்" : "Donor Name / Source"}</th>
                  <th>${isTa ? "ஊர் / நாடு" : "Village / Place"}</th>
                  <th style="text-align: right;">${isTa ? "தொகை" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                ${finData.incomeList.map((item) => `
                  <tr>
                    <td>${item.sno}</td>
                    <td><strong>${item.name}</strong></td>
                    <td>📍 ${item.place}</td>
                    <td style="text-align: right;"><span class="amount-badge-credit">${item.amount}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Expenditure Table -->
        <div class="finance-card">
          <div class="finance-card-head">
            <h3>📤 ${isTa ? "2. செலவு விவரங்கள் (Expenditure Outlay)" : "2. Itemized Expenditure Outlay"}</h3>
            <span class="amount-badge-debit">${finData.expenseList.length} ${isTa ? "இனங்கள்" : "Items"}</span>
          </div>
          <div class="finance-table-scroll">
            <table class="finance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isTa ? "செலவினம் / நலம் பெற்றோர்" : "Expenditure Item / Purpose"}</th>
                  <th style="text-align: right;">${isTa ? "தொகை" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                ${finData.expenseList.map((item) => `
                  <tr>
                    <td>${item.sno}</td>
                    <td>${isTa ? item.itemTa : (item.itemEn || item.itemTa)}</td>
                    <td style="text-align: right;"><span class="amount-badge-debit">${item.amount}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="finance-note-card">
        <h4>📜 ${isTa ? "நிர்வாக மற்றும் தணிக்கை அறிக்கை" : "Executive & Audit Note"}</h4>
        <p>${isTa ? finData.reportNoteTa : finData.reportNoteEn}</p>
      </div>
    `;
  }

  // Photo Lightbox Modal
  function openLightbox(imgSrc, caption = "") {
    const modal = $("#photoLightbox");
    const modalImg = $("#lightboxImg");
    const captionEl = $("#lightboxCaption");
    if (!modal || !modalImg) return;

    modalImg.src = imgSrc;
    if (captionEl) captionEl.textContent = caption;

    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const modal = $("#photoLightbox");
    if (!modal) return;
    modal.setAttribute("hidden", "true");
    document.body.style.overflow = "";
    const modalImg = $("#lightboxImg");
    if (modalImg) modalImg.src = "";
  }

  function bindLightbox() {
    $("#lightboxCloseBtn")?.addEventListener("click", closeLightbox);
    $("#lightboxOverlay")?.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (e) => {
      const modal = $("#photoLightbox");
      if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) {
        closeLightbox();
      }
    });

    // Also attach lightbox to any special photos on the page (e.g. about image, QR code)
    $$(".about-image-wrap img, .qr-image-wrap img").forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        openLightbox(img.src, img.alt);
      });
    });
  }

  // Render 3-Year Audited Financial Statement Table
  function renderAuditTable() {
    const tbody = $("#auditTableBody");
    if (!tbody) return;

    tbody.innerHTML = data.financialSummary.map((item) => {
      const notes = state.lang === "ta" ? item.notesTa : item.notesEn;
      return `
        <tr>
          <td><strong>${item.year}</strong></td>
          <td class="amount-plus">${item.income}</td>
          <td class="amount-minus">${item.expense}</td>
          <td class="amount-bal">${item.balance}</td>
          <td>${notes}</td>
        </tr>
      `;
    }).join("");
  }

  // Populate Village Dropdown in Membership Form
  function populateVillageSelect() {
    const select = $("#mVillage");
    if (!select) return;

    const options = [
      `<option value="">${state.lang === "ta" ? "-- கிராமத்தை தேர்வு செய்யவும் --" : "-- Select Village --"}</option>`,
      ...data.villages.map((v) => {
        const name = state.lang === "ta" ? v.ta : v.en;
        return `<option value="${name}">${String(v.id).padStart(2, "0")}. ${name}</option>`;
      })
    ];
    select.innerHTML = options.join("");
  }

  // Toast Notification Helper
  function showToast(message) {
    const toast = $("#toastMsg");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // Copy to Clipboard Handler
  function bindCopyButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      const val = btn.dataset.copy;
      navigator.clipboard.writeText(val).then(() => {
        const originalText = btn.textContent;
        btn.textContent = state.lang === "ta" ? "நகலெடுக்கப்பட்டது!" : "Copied!";
        showToast(`✓ ${val} ${state.lang === "ta" ? "நகலெடுக்கப்பட்டது!" : "copied to clipboard!"}`);
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }).catch(() => {
        showToast("Error copying text");
      });
    });
  }

  // Rule 3: Membership Form Submission -> Direct WhatsApp Redirection
  function bindMembershipForm() {
    const form = $("#membershipForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#mName").value.trim();
      const guardian = $("#mGuardian").value.trim();
      const village = $("#mVillage").value;
      const mobile = $("#mMobile").value.trim();
      const whatsapp = $("#mWhatsapp").value.trim();
      const education = $("#mEdu") ? $("#mEdu").value.trim() : "";
      const occupation = $("#mOcc") ? $("#mOcc").value.trim() : "";
      const bloodGroup = $("#mBlood") ? $("#mBlood").value : "";
      const address = $("#mAddress") ? $("#mAddress").value.trim() : "";

      if (!name || !guardian || !village || !mobile || !whatsapp) {
        alert(state.lang === "ta" ? "தயவுசெய்து அனைத்து கட்டாய விவரங்களையும் பூர்த்தி செய்யவும்." : "Please fill in all required fields.");
        return;
      }

      // Format professional WhatsApp message for Trust Office
      const waMessage = 
`*18 கிராம மக்கள் அறக்கட்டளை - உறுப்பினர் சேர்க்கை பதிவு*
━━━━━━━━━━━━━━━━━━━━
👤 *பெயர்:* ${name}
👨‍👦 *தந்தை / பாதுகாவலர்:* ${guardian}
🏘️ *கிராமம்:* ${village}
📞 *அலைபேசி:* ${mobile}
💬 *WhatsApp:* ${whatsapp}
🎓 *கல்வித் தகுதி:* ${education || "—"}
💼 *தொழில்:* ${occupation || "—"}
🩸 *இரத்த வகை:* ${bloodGroup || "—"}
🏠 *முகவரி:* ${address || "—"}
━━━━━━━━━━━━━━━━━━━━
18 கிராம மக்கள் அறக்கட்டளையில் உறுப்பினராக இணைய விரும்புகிறேன். தயவுசெய்து எனது உறுப்பினர் பதிவை உறுதி செய்ய வேண்டுகிறேன். நன்றி!`;

      const targetWaUrl = `https://wa.me/917010866771?text=${encodeURIComponent(waMessage)}`;

      showToast(state.lang === "ta" ? "WhatsApp-க்கு மாற்றப்படுகிறது..." : "Redirecting to WhatsApp...");
      
      // Open WhatsApp in new tab/window
      setTimeout(() => {
        window.open(targetWaUrl, "_blank");
        form.reset();
        populateVillageSelect();
      }, 600);
    });
  }

  // Rule 2: 20 Q&A Chatbot Engine
  function renderQuickChips() {
    const container = $("#quickChips");
    if (!container) return;

    container.innerHTML = data.faq20.map((faq) => {
      const q = state.lang === "ta" ? faq.qTa : faq.qEn;
      return `<button type="button" class="quick-chip" data-faq-id="${faq.id}">${q}</button>`;
    }).join("");
  }

  function addBotMessage(text, showWaBtn = false) {
    const log = $("#chatLog");
    if (!log) return;

    const msg = document.createElement("div");
    msg.className = "chat-msg bot";
    msg.innerHTML = text;

    if (showWaBtn) {
      const waDiv = document.createElement("div");
      waDiv.style.marginTop = "0.6rem";
      waDiv.innerHTML = `
        <a class="button sm whatsapp-btn" href="https://wa.me/917010866771" target="_blank" rel="noreferrer" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
          💬 ${state.lang === "ta" ? "தலைமை அலுவலகத்துடன் WhatsApp-ல் பேச" : "Chat with Office on WhatsApp"}
        </a>
      `;
      msg.appendChild(waDiv);
    }

    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function addUserMessage(text) {
    const log = $("#chatLog");
    if (!log) return;

    const msg = document.createElement("div");
    msg.className = "chat-msg user";
    msg.textContent = text;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function handleChatQuery(query) {
    const trimmed = query.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);

    const lower = trimmed.toLowerCase();
    
    // Search in FAQ20
    const matched = data.faq20.find((item) => {
      const keysMatch = item.keys.some((k) => lower.includes(k.toLowerCase()));
      const qTaMatch = item.qTa.toLowerCase().includes(lower);
      const qEnMatch = item.qEn.toLowerCase().includes(lower);
      return keysMatch || qTaMatch || qEnMatch;
    });

    setTimeout(() => {
      if (matched) {
        const answer = state.lang === "ta" ? matched.aTa : matched.aEn;
        addBotMessage(answer, true);
      } else {
        const fallback = state.lang === "ta"
          ? `தங்களின் கேள்விக்குரிய நேரடி தகவல் பெறப்படவில்லை. நீங்கள் நேரடியாக எங்கள் தலைமை அலுவலகப் பொறுப்பாளர் திரு. A. ரமேஷ் (+91 7010866771) அவர்களை WhatsApp-ல் தொடர்புகொண்டு உடனடியாக விளக்கம் பெறலாம்.`
          : `We could not find an exact match for your query. Please connect directly with our Office In-charge Mr. A. Ramesh (+91 7010866771) on WhatsApp for immediate assistance.`;
        addBotMessage(fallback, true);
      }
    }, 300);
  }

  function bindChatbot() {
    const panel = $("#chatPanel");
    const toggleBtn = $("#chatToggleBtn");
    const closeBtn = $("#chatCloseBtn");
    const form = $("#chatForm");
    const input = $("#chatInput");
    const chipsContainer = $("#quickChips");

    toggleBtn?.addEventListener("click", () => {
      const isHidden = panel.hasAttribute("hidden");
      if (isHidden) {
        panel.removeAttribute("hidden");
        if ($("#chatLog")?.children.length === 0) {
          addBotMessage(state.lang === "ta" ? data.translations.ta["chat.welcome"] : data.translations.en["chat.welcome"]);
        }
        input?.focus();
      } else {
        panel.setAttribute("hidden", "true");
      }
    });

    closeBtn?.addEventListener("click", () => {
      panel?.setAttribute("hidden", "true");
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (panel && !panel.hasAttribute("hidden") && !e.target.closest("#chatbotWrap")) {
        panel.setAttribute("hidden", "true");
      }
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value;
      input.value = "";
      handleChatQuery(val);
    });

    chipsContainer?.addEventListener("click", (e) => {
      const chip = e.target.closest(".quick-chip");
      if (!chip) return;
      const faqId = parseInt(chip.dataset.faqId, 10);
      const item = data.faq20.find((f) => f.id === faqId);
      if (item) {
        const question = state.lang === "ta" ? item.qTa : item.qEn;
        addUserMessage(question);
        setTimeout(() => {
          const answer = state.lang === "ta" ? item.aTa : item.aEn;
          addBotMessage(answer, true);
        }, 200);
      }
    });
  }

  // 13. Navigation Active Highlight & Scroll-Spy Engine
  function bindNavigationScrollSpy() {
    const navLinksContainer = $("#navLinks");
    const navLinks = $$("#navLinks a");
    const navToggle = $("#navToggleBtn");

    // Click handler to immediately set active state
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const targetHref = link.getAttribute("href");
        if (targetHref && targetHref.startsWith("#")) {
          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
        navLinksContainer?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
      });
    });

    // Mobile Navigation Toggle
    navToggle?.addEventListener("click", () => {
      const open = navLinksContainer.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    // Dropdown Toggles (About & Schemes)
    $$(".nav-dropdown-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const currentDropdown = btn.closest(".nav-dropdown");
        const isOpen = currentDropdown?.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(isOpen));
        $$(".nav-dropdown").forEach((dd) => {
          if (dd !== currentDropdown) {
            dd.classList.remove("is-open");
            dd.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
          }
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-dropdown")) {
        $$(".nav-dropdown").forEach((dd) => {
          dd.classList.remove("is-open");
          dd.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
        });
      }
    });

    $$(".nav-dropdown-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        $$(".nav-dropdown").forEach((dd) => {
          dd.classList.remove("is-open");
          dd.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
        });
        navLinksContainer?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
      });
    });

    // ScrollSpy using IntersectionObserver
    const sectionIds = ["home", "about", "villages", "leadership", "events", "finance", "donate", "join", "contact"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const sectionDropdownMap = {
      about: "#aboutDropdown .nav-dropdown-toggle",
      villages: "#aboutDropdown .nav-dropdown-toggle",
      leadership: "#aboutDropdown .nav-dropdown-toggle",
      pillars: "#schemesDropdown .nav-dropdown-toggle"
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              // Clear previous active states on all nav items
              navLinks.forEach((l) => l.classList.remove("active"));
              $$(".nav-dropdown-toggle").forEach((btn) => btn.classList.remove("active"));

              if (sectionDropdownMap[id]) {
                const targetBtn = $(sectionDropdownMap[id]);
                if (targetBtn) targetBtn.classList.add("active");
              } else {
                const targetLink = $(`#navLinks a[href="#${id}"]`);
                if (targetLink) targetLink.classList.add("active");
              }
            }
          });
        },
        { rootMargin: "-25% 0px -55% 0px", threshold: 0 }
      );

      sections.forEach((sec) => observer.observe(sec));
    }
  }

  // 14. UI Interaction Bindings
  function bindUIInteractions() {
    // Persistent Language Buttons
    $("#btnLangTa")?.addEventListener("click", () => setLanguage("ta"));
    $("#btnLangEn")?.addEventListener("click", () => setLanguage("en"));

    // Village Search
    $("#villageSearchInput")?.addEventListener("input", (e) => {
      renderVillages(e.target.value);
    });

    // Leadership Tabs
    $$(".tabs-nav .tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".tabs-nav .tab-btn").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        renderLeadership(btn.dataset.tab);
      });
    });

    // Events Category Filter
    $$(".events-filter-bar .filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".events-filter-bar .filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderEvents(btn.dataset.filter);
      });
    });

    // Financial Year Selector Tabs
    document.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".finance-tabs-nav .finance-tab-btn");
      if (!tabBtn) return;
      const year = tabBtn.dataset.year;
      if (year) {
        renderFinancials(year);
      }
    });

    // Scroll to Top
    const scrollBtn = $("#scrollTopBtn");
    scrollBtn?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", () => {
      if (scrollBtn) {
        scrollBtn.classList.toggle("is-visible", window.scrollY > 450);
      }
    }, { passive: true });
  }

  // 15. Force clear any old service workers and cache storage to ensure fresh reload
  function clearAllCachesAndServiceWorkers() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});
    }
    if (window.caches) {
      caches.keys().then((keys) => {
        for (let key of keys) caches.delete(key);
      }).catch(() => {});
    }
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    clearAllCachesAndServiceWorkers();
    bindNavigationScrollSpy();
    bindUIInteractions();
    bindLightbox();
    bindCopyButtons();
    bindMembershipForm();
    bindChatbot();
    setLanguage(state.lang);
  });
})();
