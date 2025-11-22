// @author: João Gouveia
// Helper para ler números (aceita vírgula ou ponto)
function getNumber(id, defaultValue = 0) {
  const el = document.getElementById(id);
  if (!el) return defaultValue;
  const raw = (el.value || "").replace(",", ".");
  const v = parseFloat(raw);
  return isNaN(v) ? defaultValue : v;
}

function formatNumber(value, decimals = 1) {
  if (value == null || !isFinite(value)) return "N/A";
  if (value < 0) return "N/A";  // bloqueia negativos
  return value.toFixed(decimals).replace(".", ",");
}

function parseNumberValue(input) {
  if (!input) return NaN;
  const raw = String(input.value).replace(",", ".");
  const value = parseFloat(raw);
  return isNaN(value) ? NaN : value;
}


// Navegação lateral entre secções
function setupNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === `section-${target}`);
      });
    });
  });
}

// Função expandir
function setupSidebarAccordion() {
  const mains = document.querySelectorAll(".sidebar-main-btn");
  const subs = document.querySelectorAll(".sidebar-subgroup");

  mains.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      const subgroup = document.querySelector(`.sidebar-subgroup[data-parent="${target}"]`);
      const isOpen = subgroup.classList.contains("open");

      // fecha tudo
      subs.forEach(s => s.classList.remove("open"));
      mains.forEach(b => b.classList.remove("active"));

      // reabre só se estava fechado
      if (!isOpen) {
        subgroup.classList.add("open");
        btn.classList.add("active");
      }
    });
  });
}




// Tabs (Hipernatrémia / Hiponatrémia)
function setupTabs() {
  const tabSets = document.querySelectorAll(".tabs");
  tabSets.forEach((tabs) => {
    const buttons = tabs.querySelectorAll(".tab-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        const parentSection = tabs.closest(".section");
        const panels = parentSection.querySelectorAll(".tab-panel");

        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        panels.forEach((panel) => {
          panel.classList.toggle("active", panel.id === `tab-${tabName}`);
        });
      });
    });
  });
}

/* ======================
   Cálculo Efluente & FF
   ====================== */
function setupEfluente() {
  const btn = document.getElementById("calcEfluenteBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const PBS = getNumber("pbsInput");
    const repPre = getNumber("repPreInput");
    const dial = getNumber("dialInput");
    const repPos = getNumber("repPosInput");
    const UF = getNumber("ufInput");

    const Qb = getNumber("qbInput");
    const Htc = getNumber("htcInput");
    const peso = getNumber("pesoInput");

    // Dose de efluente total (mL/h)
    const totalEfluente = PBS + repPre + dial + repPos + UF;
    const doseEfluente = peso > 0 ? totalEfluente / peso : null;

    // Cálculo FF:
    const htcFrac = Htc / 100;
    const Quf = PBS + UF + repPre + repPos;
    const denom = Qb * 60 * (1 - htcFrac) + (PBS + repPre);
    const FF = denom > 0 ? (Quf / denom) * 100 : null;

    document.getElementById("totalEfluente").textContent = formatNumber(
      totalEfluente,
      0
    );
    document.getElementById("doseEfluente").textContent =
      doseEfluente != null ? formatNumber(doseEfluente, 1) : "–";
    document.getElementById("fracFiltracao").textContent =
      FF != null ? formatNumber(FF, 1) : "–";

    const ffWarning = document.getElementById("ffWarning");
    if (FF != null && FF > 25) {
      ffWarning.classList.remove("hidden");
    } else {
      ffWarning.classList.add("hidden");
    }
  });
}

/* ======================
   Cálculo HCO3
   ====================== */
function setupHco3() {
  const btn = document.getElementById("calcHco3Btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const target = getNumber("hco3TargetInput");

    const basePrismasol = 32;
    const baseBiphozyl = 22;
    const volumeSacoL = 5; // 5 L
    const volPrismasol = (target - basePrismasol) * volumeSacoL;
    const volBiphozyl = (target - baseBiphozyl) * volumeSacoL;

    document.getElementById("volHco3Prismasol").textContent =
      volPrismasol >= 0 ? formatNumber(volPrismasol, 0) + " mL" : "N/A";
    document.getElementById("volHco3Biphozyl").textContent =
      volBiphozyl >= 0 ? formatNumber(volBiphozyl, 0) + " mL" : "N/A";
  });
}

/* ======================
   Hipernatrémia
   ====================== */
function setupHypernatremia() {
  // Constantes (fixas, não editáveis na interface)
  const NA_SACOS = 140;   // mEq/L
  const VOL_SACO_L = 5;   // L
  const NACL20_MEQ_ML = 3.4; // mEq/mL
  const NA_3P = 513;      // mEq/L

  // Ajuste sacos – NaCl 20% (só Na pretendida é editável)
  const btnSacos = document.getElementById("calcHyperSacosBtn");
  if (btnSacos) {
    btnSacos.addEventListener("click", () => {
      const naTarget = getNumber("hyperNaTargetInput");

      // Volume NaCl 20% (mL) = (V * (Na_target - Na_sacos)) / [NaCl20% (mEq/mL)]
      const volumeNaCl20 =
        NACL20_MEQ_ML > 0
          ? (VOL_SACO_L * (naTarget - NA_SACOS)) / NACL20_MEQ_ML
          : null;

      document.getElementById("hyperNaBagResult").textContent =
        volumeNaCl20 != null
          ? volumeNaCl20 >= 0
            ? formatNumber(volumeNaCl20, 0) + " mL"
            : "N/A"
          : "Parâmetros inválidos";
    });
  }

  // Perfusão NaCl 3% (só Na pretendida e dose de efluente são editáveis)
  const btnPerf = document.getElementById("calcHyperPerfBtn");
  if (btnPerf) {
    btnPerf.addEventListener("click", () => {
      const naTarget = getNumber("hyperNaTarget3Input");
      const effluent = getNumber("hyperEffluentInput");

      const denom = NA_3P - naTarget;
      const perf =
        denom !== 0
          ? ((naTarget - NA_SACOS) / denom) * effluent
          : null;

      document.getElementById("hyperPerfResult").textContent =
        perf != null ? formatNumber(perf, 0) + " mL/h" : "Parâmetros inválidos";
    });
  }
}


/* ======================
   Hiponatrémia
   ====================== */
function setupHyponatremia() {
  // Constantes (fixas, não editáveis na interface)
  const NA_SACOS = 140;   // mEq/L
  const VOL_SACO_L = 5;   // L

  // Ajuste dos sacos (só Na pretendida é editável)
  const btnSacos = document.getElementById("calcHypoSacosBtn");
  if (btnSacos) {
    btnSacos.addEventListener("click", () => {
      const naTarget = getNumber("hypoNaTargetInput");

      // Água a adicionar (mL) = V * (Na_sacos / Na_target - 1)
      const waterAdd =
        naTarget > 0
          ? VOL_SACO_L * 1000 * (NA_SACOS / naTarget - 1)
          : null;

      let waterReplace = 0;
      if (waterAdd != null && waterAdd > 1000) {
        waterReplace = waterAdd - 1000;
      }

      document.getElementById("hypoWaterAddResult").textContent =
        waterAdd != null ? formatNumber(waterAdd, 0) + " mL" : "Na alvo inválida";

      document.getElementById("hypoWaterReplaceResult").textContent =
        waterAdd != null ? formatNumber(waterReplace, 0) + " mL" : "Na alvo inválida";
    });
  }

  // Perfusão Dx5%
  const btnPerf = document.getElementById("calcHypoPerfBtn");
  if (btnPerf) {
    btnPerf.addEventListener("click", () => {
      const naTarget = getNumber("hypoNaTargetPerfInput");
      const effluent = getNumber("hypoEffluentInput");

      const perf =
        naTarget > 0
          ? ((140 - naTarget) / naTarget) * effluent
          : null;

      document.getElementById("hypoPerfResult").textContent =
        perf != null ? formatNumber(perf, 0) + " mL/h" : "Na alvo inválida";
    });
  }
}

/* ======================
   Anticoagulação CRRT
   ====================== */
function setupAnticoag() {
  const needsSystemicAnticoag = document.getElementById("needsSystemicAnticoag");
  const citrateContra = document.getElementById("citrateContra");
  const highBleedingRisk = document.getElementById("highBleedingRisk");
  const anticoagRecommendation = document.getElementById("anticoagRecommendation");

  const citrateBlock = document.getElementById("citrateBlock");
  const heparinBlock = document.getElementById("heparinBlock");
  const noAnticoagBlock = document.getElementById("noAnticoagBlock");

  const monitoringBlock = document.getElementById("monitoringBlock");
  const monitoringGeneric = document.getElementById("monitoringGeneric");
  const monitoringTabsWrapper = document.getElementById("monitoringTabsWrapper");

  if (
    !needsSystemicAnticoag ||
    !citrateContra ||
    !highBleedingRisk ||
    !anticoagRecommendation ||
    !monitoringBlock ||
    !monitoringGeneric ||
    !monitoringTabsWrapper
  ) {
    return;
  }

  function setMonitoringFor(strategy) {
    // esconde tudo por defeito
    monitoringBlock.hidden = !strategy;
    if (!strategy) {
      monitoringGeneric.innerHTML = "";
      monitoringTabsWrapper.hidden = true;
      return;
    }

    if (strategy === "citrate") {
      monitoringTabsWrapper.hidden = false;
      monitoringGeneric.innerHTML = `
        <ul>
          <li>Monitorizar Ca<sup>2+</sup> pós-filtro: 10 min, 60 min, depois de 3/3 h até alvo, depois 6/6 h.</li>
          <li>Monitorizar Ca<sup>2+</sup> sistémico: 1 h após início, depois de 3/3 h até alvo, depois 6/6 h.</li>
          <li>Monitorizar Ca total e relação CaT/Ca<sup>2+</sup>: 8/8 h na fase inicial, depois diário.</li>
          <li>Suspender citrato se acidose com AG elevado, necessidades crescentes de CaCl<sub>2</sub> ou relação CaT/Ca<sup>2+</sup> &gt; 2,5.</li>
        </ul>
      `;
    } else if (strategy === "heparin") {
      monitoringTabsWrapper.hidden = true;
      monitoringGeneric.innerHTML = `
        <ul>
          <li>Monitorizar aPTT 4–6 h após início e após qualquer ajuste de dose.</li>
          <li>Monitorizar sinais de hemorragia, plaquetas e Hb diariamente.</li>
          <li>Monitorizar pressões do circuito e vida útil do filtro.</li>
          <li>Reavaliar necessidade de heparinização sistémica pelo menos a cada 24 h.</li>
        </ul>
      `;
    } else if (strategy === "noAnticoag") {
      monitoringTabsWrapper.hidden = true;
      monitoringGeneric.innerHTML = `
        <ul>
          <li>Monitorizar pressões do circuito e ocorrência de coágulos no filtro e linhas.</li>
          <li>Registar e avaliar a vida média dos filtros (ex.: número de horas até coagulação).</li>
          <li>Otimizar posição do cateter e Qb sempre que possível para prolongar a vida do filtro.</li>
          <li>Reavaliar diariamente a possibilidade de iniciar anticoagulação (heparina ou citrato).</li>
        </ul>
      `;
    }
  }

  function updateAnticoagChoice() {
    const needsSys = needsSystemicAnticoag.value;
    const contraCit = citrateContra.value;
    const highBleed = highBleedingRisk.value;

    if (citrateBlock) citrateBlock.hidden = true;
    if (heparinBlock) heparinBlock.hidden = true;
    if (noAnticoagBlock) noAnticoagBlock.hidden = true;
    setMonitoringFor(null);

    if (!needsSys || !contraCit || !highBleed) {
      anticoagRecommendation.textContent = "— preencher todos os campos —";
      return;
    }

    if (needsSys === "yes") {
      anticoagRecommendation.textContent =
        "Heparina não fraccionada (doente necessita de anticoagulação sistémica).";
      if (heparinBlock) heparinBlock.hidden = false;
      setMonitoringFor("heparin");
      return;
    }

    if (contraCit === "no") {
      anticoagRecommendation.textContent =
        "Anticoagulação regional com citrato (sem contraindicação identificada).";
      if (citrateBlock) citrateBlock.hidden = false;
      setMonitoringFor("citrate");
      return;
    }

    if (contraCit === "yes" && highBleed === "yes") {
      anticoagRecommendation.textContent =
        "Sem anticoagulação (citrato contraindicado e risco hemorrágico elevado).";
      if (noAnticoagBlock) noAnticoagBlock.hidden = false;
      setMonitoringFor("noAnticoag");
      return;
    }

    if (contraCit === "yes" && highBleed === "no") {
      anticoagRecommendation.textContent =
        "Heparina não fraccionada (citrato contraindicado, sem risco hemorrágico elevado).";
      if (heparinBlock) heparinBlock.hidden = false;
      setMonitoringFor("heparin");
      return;
    }

    anticoagRecommendation.textContent = "— verificar seleção —";
  }

  [needsSystemicAnticoag, citrateContra, highBleedingRisk].forEach((el) => {
    el.addEventListener("change", updateAnticoagChoice);
  });

  // --- Prescrição inicial HDFVVC com citrato (tabela por peso) ---
  const citrateTable = [
    { weight: 50, qb: 100, dialysate: 1000, postFilter: 200, effDose: 37 },
    { weight: 60, qb: 110, dialysate: 1000, postFilter: 400, effDose: 37 },
    { weight: 70, qb: 120, dialysate: 1200, postFilter: 500, effDose: 35 },
    { weight: 80, qb: 130, dialysate: 1300, postFilter: 500, effDose: 33 },
    { weight: 90, qb: 140, dialysate: 1400, postFilter: 500, effDose: 31 },
    { weight: 100, qb: 150, dialysate: 1500, postFilter: 600, effDose: 31 },
    { weight: 110, qb: 160, dialysate: 1600, postFilter: 700, effDose: 30 },
    { weight: 120, qb: 170, dialysate: 1700, postFilter: 800, effDose: 30 },
    { weight: 130, qb: 180, dialysate: 1800, postFilter: 1000, effDose: 30 }
  ];

  const citrateWeightInput = document.getElementById("citrateWeightInput");
  const citratePrescriptionDiv = document.getElementById("citratePrescription");

  function getCitrateSettingsForWeight(kg) {
    if (!kg || kg < 50) return null;
    let best = citrateTable[0];
    let bestDiff = Math.abs(kg - best.weight);
    for (const row of citrateTable) {
      const diff = Math.abs(kg - row.weight);
      if (diff < bestDiff) {
        best = row;
        bestDiff = diff;
      }
    }
    return best;
  }

  function updateCitratePrescription() {
    if (!citratePrescriptionDiv) return;

    const kg = Number(citrateWeightInput ? citrateWeightInput.value : 0);
    const row = getCitrateSettingsForWeight(kg);

    if (!row) {
      citratePrescriptionDiv.innerHTML =
        "<p>Introduzir um peso ≥ 50 kg. Valores fora da tabela: ajustar manualmente.</p>";
      return;
    }

    citratePrescriptionDiv.innerHTML = `
      <p><strong>Configuração sugerida (dose de citrato 3 mmol/L):</strong></p>
      <ul>
        <li>Bomba de sangue (Qb): <strong>${row.qb} mL/min</strong></li>
        <li>Dialisante: <strong>${row.dialysate} mL/h</strong></li>
        <li>Reposição pós-filtro: <strong>${row.postFilter} mL/h</strong></li>
        <li>Dose de efluente aproximada: <strong>${row.effDose} mL/kg/h</strong></li>
      </ul>
    `;
  }

  if (citrateWeightInput) {
    citrateWeightInput.addEventListener("input", updateCitratePrescription);
  }

  // --- HDFVVC com heparina não fraccionada (dose + fluxos ao peso) ---
  const heparinWeightInput = document.getElementById("heparinWeightInput");
  const heparinPrescriptionDiv = document.getElementById("heparinPrescription");

  function updateHeparinPrescription() {
    if (!heparinPrescriptionDiv) return;

    const kg = Number(heparinWeightInput ? heparinWeightInput.value : 0);
    if (!kg || kg <= 0) {
      heparinPrescriptionDiv.innerHTML =
        "<p>Introduzir um peso válido para calcular a perfusão de HNF e os fluxos.</p>";
      return;
    }

    const lowRate = (5 * kg).toFixed(0);
    const highRate = (10 * kg).toFixed(0);

    const doseMin = 25;
    const doseMax = 30;

    const effMin = kg * doseMin;
    const effMax = kg * doseMax;

    const dialMin = (2 / 3) * effMin;
    const dialMax = (2 / 3) * effMax;
    const posMin = (1 / 3) * effMin;
    const posMax = (1 / 3) * effMax;

    heparinPrescriptionDiv.innerHTML = `
      <p><strong>Dose sugerida de heparina:</strong></p>
      <ul>
        <li>Bólus inicial: <strong>500–1000 UI IV</strong>.</li>
        <li>Perfusão contínua: entre <strong>${lowRate}–${highRate} UI/h</strong> (5–10 UI/kg/h).</li>
        <li>Valor habitual: <strong>≈ 500 UI/h</strong>, a ajustar por aPTT.</li>
      </ul>

      <p><strong>Prescrição HDFVVC (ajustada ao peso):</strong></p>
      <ul>
        <li>Qb: <strong>150–300 mL/min</strong>.</li>
        <li>Dose de efluente alvo: <strong>${formatNumber(effMin, 0)}–${formatNumber(effMax, 0)} mL/h</strong> (${doseMin}–${doseMax} mL/kg/h).</li>
        <li>Dialisante (≈ 2/3 da dose): <strong>${formatNumber(dialMin, 0)}–${formatNumber(dialMax, 0)} mL/h</strong>.</li>
        <li>Reposição pós-filtro (≈ 1/3 da dose): <strong>${formatNumber(posMin, 0)}–${formatNumber(posMax, 0)} mL/h</strong>.</li>
        <li>Ultrafiltração: <strong>0–150 mL/h</strong>, ajustar à volémia e hemodinâmica.</li>
      </ul>
    `;
  }

  if (heparinWeightInput) {
    heparinWeightInput.addEventListener("input", updateHeparinPrescription);
  }

  // Ajuste da dose de heparina em função da aPTTr
  const heparinApttrInput = document.getElementById("heparinApttrInput");
  const heparinBleedingInput = document.getElementById("heparinBleedingInput");
  const heparinTitrationResult = document.getElementById("heparinTitrationResult");

  function updateHeparinTitration() {
    if (!heparinTitrationResult) return;

    const apttr = getNumber("heparinApttrInput", NaN);
    const bleeding = heparinBleedingInput ? heparinBleedingInput.value : "";

    // Hemorragia presente → suspender sempre
    if (bleeding === "yes") {
      heparinTitrationResult.textContent =
        "Hemorragia presente: suspender perfusão de heparina. Reavaliar aPTTr em 4 horas.";
      return;
    }

    if (isNaN(apttr) || apttr <= 0 || !bleeding) {
      heparinTitrationResult.textContent =
        "Introduzir aPTTr e estado de hemorragia para obter recomendação.";
      return;
    }

    const kg = Number(heparinWeightInput ? heparinWeightInput.value : 0);
    const hasWeight = kg > 0;

    let text = "";

    if (apttr < 1.5) {
      // < 1.5, sem hemorragia
      text = "aPTTr < 1,5 e hemorragia ausente: aumentar a perfusão para 10 UI/kg/h. Reavaliar aPTTr em 4 horas.";
      if (hasWeight) {
        const newRate = 10 * kg;
        text += ` (Correspondente a cerca de ${formatNumber(newRate, 0)} UI/h para ${formatNumber(
          kg,
          0
        )} kg.)`;
      }
    } else if (apttr > 1.5) {
      // > 1.5, sem hemorragia
      text = "aPTTr > 1,5 e hemorragia ausente: reduzir a perfusão para 5 UI/kg/h. Reavaliar aPTTr em 4 horas.";
      if (hasWeight) {
        const newRate = 5 * kg;
        text += ` (Correspondente a cerca de ${formatNumber(newRate, 0)} UI/h para ${formatNumber(
          kg,
          0
        )} kg.)`;
      }
    } else {
      // aPTTr ≈ 1.5
      text = "aPTTr ≈ 1,5 e hemorragia ausente: manter a dose atual de heparina. Reavaliar aPTTr em 12 horas.";
    }

    heparinTitrationResult.textContent = text;
  }

  if (heparinApttrInput) {
    heparinApttrInput.addEventListener("input", updateHeparinTitration);
  }
  if (heparinBleedingInput) {
    heparinBleedingInput.addEventListener("change", updateHeparinTitration);
  }
  // Se mudar o peso, atualizamos também o cálculo da dose em UI/h
  if (heparinWeightInput) {
    heparinWeightInput.addEventListener("input", updateHeparinTitration);
  }


  // --- HDFVVC sem anticoagulação (fluxos ao peso) ---
  const noAnticoagWeightInput = document.getElementById("noAnticoagWeightInput");
  const noAnticoagPrescriptionDiv = document.getElementById("noAnticoagPrescription");

  function updateNoAnticoagPrescription() {
    if (!noAnticoagPrescriptionDiv) return;

    const kg = Number(noAnticoagWeightInput ? noAnticoagWeightInput.value : 0);
    if (!kg || kg <= 0) {
      noAnticoagPrescriptionDiv.innerHTML =
        "<p>Introduzir um peso válido para calcular a prescrição.</p>";
      return;
    }

    const doseMin = 25;
    const doseMax = 30;

    const effMin = kg * doseMin;
    const effMax = kg * doseMax;

    const preMin = (1 / 3) * effMin;
    const preMax = (1 / 3) * effMax;
    const dialMin2 = (2 / 3) * effMin;
    const dialMax2 = (2 / 3) * effMax;

    noAnticoagPrescriptionDiv.innerHTML = `
      <p><strong>Prescrição HDFVVC sem anticoagulação (ajustada ao peso):</strong></p>
      <ul>
        <li>Qb: <strong>150–300 mL/min</strong>.</li>
        <li>Dose de efluente alvo: <strong>${formatNumber(effMin, 0)}–${formatNumber(effMax, 0)} mL/h</strong> (${doseMin}–${doseMax} mL/kg/h).</li>
        <li>Reposição pré-filtro (≈ 1/3 da dose): <strong>${formatNumber(preMin, 0)}–${formatNumber(preMax, 0)} mL/h</strong>.</li>
        <li>Dialisante (≈ 2/3 da dose): <strong>${formatNumber(dialMin2, 0)}–${formatNumber(dialMax2, 0)} mL/h</strong>.</li>
        <li>Ultrafiltração: <strong>0–150 mL/h</strong>, conforme volémia e hemodinâmica.</li>
      </ul>
    `;
  }

  if (noAnticoagWeightInput) {
    noAnticoagWeightInput.addEventListener("input", updateNoAnticoagPrescription);
  }

  /* ---- Ajuste dinâmico com base nas TABELAS dos flashcards ---- */

  // 1) Ajuste de taxa de citrato em função do Ca iónico pós-filtro
  const citrateCaPostFilterInput = document.getElementById("citrateCaPostFilterInput");
  const citrateAdjustmentResult = document.getElementById("citrateAdjustmentResult");

  function updateCitrateAdjustment() {
    if (!citrateAdjustmentResult) return;
    const ca = getNumber("citrateCaPostFilterInput", NaN);

    if (isNaN(ca) || ca <= 0) {
      citrateAdjustmentResult.textContent = "Introduzir um valor válido de Ca iónico pós-filtro.";
      return;
    }

    let msg = "";

    if (ca > 0.45) {
      msg = "Aumentar dose de citrato em 0,3 mmol/L.";
    } else if (ca >= 0.41) {
      msg = "Aumentar dose de citrato em 0,2 mmol/L.";
    } else if (ca >= 0.36) {
      msg = "Aumentar dose de citrato em 0,1 mmol/L.";
    } else if (ca >= 0.25) {
      msg = "Manter dose de citrato.";
    } else if (ca >= 0.20) {
      msg = "Diminuir dose de citrato em 0,1 mmol/L.";
    } else if (ca >= 0.15) {
      msg = "Diminuir dose de citrato em 0,2 mmol/L.";
    } else {
      msg = "Diminuir dose de citrato em 0,3 mmol/L.";
    }

    citrateAdjustmentResult.textContent = msg;
  }

  if (citrateCaPostFilterInput) {
    citrateCaPostFilterInput.addEventListener("input", updateCitrateAdjustment);
  }

  // 2) Ajuste da perfusão de cálcio em função do Ca iónico sistémico
  const calciumSystemicInput = document.getElementById("calciumSystemicInput");
  const calciumCurrentRateInput = document.getElementById("calciumCurrentRateInput");
  const calciumAdjustmentResult = document.getElementById("calciumAdjustmentResult");

  function updateCalciumAdjustment() {
    if (!calciumAdjustmentResult) return;

    const cai = getNumber("calciumSystemicInput", NaN);
    if (isNaN(cai) || cai <= 0) {
      calciumAdjustmentResult.textContent = "Introduzir um valor válido de Ca iónico sistémico.";
      return;
    }

    const currentRate = getNumber("calciumCurrentRateInput", NaN);
    let action = "";
    let factor = 0;
    let bolus = false;

    if (cai < 0.75) {
      action = "aumentar compensação de cálcio em 10%.";
      factor = 0.10;
      bolus = true; // 1 g ClCa em 15 min
    } else if (cai >= 0.75 && cai <= 0.79) {
      action = "aumentar compensação de cálcio em 10%.";
      factor = 0.10;
    } else if (cai >= 0.8 && cai <= 0.99) {
      action = "aumentar compensação de cálcio em 5%.";
      factor = 0.05;
    } else if (cai >= 1 && cai <= 1.3) {
      action = "manter compensação de cálcio.";
      factor = 0;
    } else if (cai > 1.3 && cai <= 1.45) {
      action = "diminuir compensação de cálcio em 5%.";
      factor = -0.05;
    } else if (cai > 1.45) {
      action = "diminuir compensação de cálcio em 10%.";
      factor = -0.10;
    }

    let text = action.charAt(0).toUpperCase() + action.slice(1);
    if (bolus) {
      text = "Administrar 1 g de Cloreto de Cálcio em 15 minutos e " + action;
    }

    if (!isNaN(currentRate) && currentRate > 0 && factor !== 0) {
      const newRate = currentRate * (1 + factor);
      text += ` Nova perfusão sugerida: aproximadamente ${formatNumber(
        newRate,
        1
      )} mL/h (a partir de ${formatNumber(currentRate, 1)} mL/h).`;
    }

    calciumAdjustmentResult.textContent = text;
  }

  if (calciumSystemicInput) {
    calciumSystemicInput.addEventListener("input", updateCalciumAdjustment);
  }
  if (calciumCurrentRateInput) {
    calciumCurrentRateInput.addEventListener("input", updateCalciumAdjustment);
  }


  // 3) Equilíbrio ácido–base / intoxicação por citrato
  const abPhInput = document.getElementById("abPhInput");
  const abHco3Input = document.getElementById("abHco3Input");
  const abCaTotalInput = document.getElementById("abCaTotalInput");
  const abCaIonInput = document.getElementById("abCaIonInput");
  const acidBaseRatioValue = document.getElementById("acidBaseRatioValue");
  const acidBaseAdjustmentResult = document.getElementById("acidBaseAdjustmentResult");

  function updateAcidBaseAdjustment() {
    if (!acidBaseAdjustmentResult) return;

    const ph = getNumber("abPhInput", NaN);
    const hco3 = getNumber("abHco3Input", NaN);
    const caTotalMgDl = getNumber("abCaTotalInput", NaN);
    const cai = getNumber("abCaIonInput", NaN);

    // Calcula relação Ca total / Ca iónico (em mmol/L)
    let ratio = null;
    if (!isNaN(caTotalMgDl) && !isNaN(cai) && cai > 0) {
      // Ca total mg/dL → mmol/L (≈ mg/dL / 4)
      const caTotalMmol = caTotalMgDl / 4;
      ratio = caTotalMmol / cai;
    }

    if (acidBaseRatioValue) {
      if (ratio !== null && isFinite(ratio)) {
        acidBaseRatioValue.textContent = formatNumber(ratio, 2);
      } else {
        acidBaseRatioValue.textContent = "—";
      }
    }

    // 1) Primeiro, avaliar relação Ca total / Ca iónico
    if (ratio !== null && ratio > 2.5) {
      acidBaseAdjustmentResult.textContent =
        "Relação Ca total / Ca iónico > 2,5: suspeita de acumulação de citrato. Suspender anticoagulação com citrato e considerar heparina ou técnica sem anticoagulação.";
      return;
    }

    // 2) Se não há pH/HCO3, não conseguimos orientar Qb / dose de diálise
    if (isNaN(ph) || isNaN(hco3)) {
      acidBaseAdjustmentResult.textContent =
        "Introduzir pH e HCO₃⁻ para obter recomendações sobre ajustes de Qb e dose de diálise.";
      return;
    }

    // 3) Alcalose metabólica (demasiado bicarbonato)
    if (ph > 7.45 && hco3 > 26) {
      acidBaseAdjustmentResult.textContent =
        "Alcalose metabólica provável: diminuir o débito de sangue (Qb) em cerca de 20% ou aumentar a dose de diálise (Qdialisante) em cerca de 20%. " +
        "Se ureia/creatinina estiverem elevadas, privilegiar o aumento da dose de diálise; se estiverem baixas ou normais, privilegiar a redução do Qb. " +
        "Exemplo: HCO₃⁻ atual 28 mmol/L e objetivo 24 mmol/L → aumentar Qdialisante ou reduzir Qb em ~20%.";
      return;
    }

    // 4) Acidose metabólica (bicarbonato baixo)
    if (ph < 7.35 && hco3 < 22) {
      acidBaseAdjustmentResult.textContent =
        "Acidose metabólica provável: aumentar o débito de sangue (Qb) em cerca de 20% ou diminuir a dose de diálise (Qdialisante) em cerca de 20%. " +
        "Se ureia/creatinina estiverem baixas, privilegiar a redução da dose de diálise; se estiverem elevadas, privilegiar o aumento do Qb. " +
        "Exemplo: HCO₃⁻ atual 20 mmol/L e objetivo 24 mmol/L → diminuir Qdialisante ou aumentar Qb em ~20%.";
      return;
    }

    // 5) Situações intermédias
    acidBaseAdjustmentResult.textContent =
      "Não há critérios claros de alcalose ou acidose metabólica atribuível ao citrato. Manter vigilância clínica e laboratorial.";
  }

  [abPhInput, abHco3Input, abCaTotalInput, abCaIonInput].forEach((el) => {
    if (el) el.addEventListener("input", updateAcidBaseAdjustment);
  });

}

/* ======================
   SLED
   ====================== */


function formatResult(el, value, decimals, suffix) {
  if (!el) return;
  if (!isFinite(value)) {
    el.textContent = "—";
    return;
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const text = `${rounded.toFixed(decimals)}${suffix ? " " + suffix : ""}`;
  el.textContent = text;
}

function estimateQdFromAutoFlow(Qb) {
  if (!isFinite(Qb) || Qb <= 0) return NaN;

  // Regra prática do AUTO-FLOW: ~1,2 × Qb, com limites
  let Qd = Qb * 1.2;

  // limites típicos razoáveis para SLED (podes ajustar)
  if (Qd < 200) Qd = 200;
  if (Qd > 500) Qd = 500;

  return Qd;
}


/* ======================
   SLED - AUTO-FLOW 5008
   ====================== */

function setupSled() {
  const calcBtn = document.getElementById("sledCalcBtn");
  if (!calcBtn) return; // segurança se a secção não existir

  const pesoInput = document.getElementById("sledPesoInput");
  const ufTotalInput = document.getElementById("sledUfTotalInput");
  const duracaoInput = document.getElementById("sledDuracaoInput");
  const qbInput = document.getElementById("sledQbInput");
  const riscoSelect = document.getElementById("sledRiscoInput");

  const ufHoraEl = document.getElementById("sledUfPorHora");
  const ufKgHoraEl = document.getElementById("sledUfPorKgHora");
  const qdEstimadoEl = document.getElementById("sledQdEstimado");
  const kDepuracaoEl = document.getElementById("sledKDepuracao");
  const ktTotalEl = document.getElementById("sledKtTotal");
  const vTotalEl = document.getElementById("sledVTotal");
  const ktvEl = document.getElementById("sledKtV");
  const ureaRemovalEl = document.getElementById("sledUreaRemoval");
  const efficiencyNoteEl = document.getElementById("sledEfficiencyNote");
  const warningEl = document.getElementById("sledWarning");
  const commentaryEl = document.getElementById("sledCommentary");

  const deltaNaEl = document.getElementById("sledDeltaNa");
  const hco3CargaEl = document.getElementById("sledHco3Carga");
  const kCommentEl = document.getElementById("sledKComment");

  calcBtn.addEventListener("click", () => {
    const peso = parseNumberValue(pesoInput);
    const ufTotalL = parseNumberValue(ufTotalInput);
    const duracaoH = parseNumberValue(duracaoInput);
    const qb = parseNumberValue(qbInput);
    const risco = riscoSelect ? riscoSelect.value : "";

    // reset mensagens
    if (warningEl) {
      warningEl.textContent = "";
      warningEl.classList.add("hidden");
    }
    if (efficiencyNoteEl) efficiencyNoteEl.textContent = "";
    if (commentaryEl) commentaryEl.innerHTML = "";

    // validação básica
    if (
      !isFinite(peso) ||
      peso <= 0 ||
      !isFinite(ufTotalL) ||
      ufTotalL < 0 ||
      !isFinite(duracaoH) ||
      duracaoH <= 0 ||
      !isFinite(qb) ||
      qb <= 0
    ) {
      formatResult(ufHoraEl, NaN, 0, "");
      formatResult(ufKgHoraEl, NaN, 1, "");
      formatResult(qdEstimadoEl, NaN, 0, "");
      formatResult(kDepuracaoEl, NaN, 1, "");
      formatResult(ktTotalEl, NaN, 1, "");
      formatResult(vTotalEl, NaN, 1, "");
      formatResult(ktvEl, NaN, 2, "");
      formatResult(ureaRemovalEl, NaN, 0, "");
      if (warningEl) {
        warningEl.textContent =
          "Preencha peso, UF total, duração e Qb com valores válidos.";
        warningEl.classList.remove("hidden");
      }
      return;
    }

    // 1) UF
    const ufHora = (ufTotalL * 1000) / duracaoH; // mL/h
    const ufKgHora = ufHora / peso; // mL/kg/h

    formatResult(ufHoraEl, ufHora, 0, "mL/h");
    formatResult(ufKgHoraEl, ufKgHora, 1, "mL/kg/h");

    // 2) Qd estimado (AUTO-FLOW)
    const qd = estimateQdFromAutoFlow(qb); // mL/min
    formatResult(qdEstimadoEl, qd, 0, "mL/min");

    // 3) Depuração K (assumindo K ≈ Qd)
    let kText = "—";
    let kLh = NaN;

    if (isFinite(qd)) {
      kLh = (qd * 60) / 1000; // L/h
      const kMlMinRounded = Math.round(qd);
      const kLhRounded = Math.round(kLh * 10) / 10;
      kText = `${kMlMinRounded} mL/min (~${kLhRounded.toFixed(1)} L/h)`;
    }
    if (kDepuracaoEl) kDepuracaoEl.textContent = kText;

    // 4) Kt total
    let ktL = NaN;
    if (isFinite(kLh)) ktL = kLh * duracaoH;
    formatResult(ktTotalEl, ktL, 1, "L");

    // 5) Volume de distribuição V (0,55 × peso)
    const vL = 0.55 * peso;
    formatResult(vTotalEl, vL, 1, "L");

    // 6) Kt/V
    let ktv = NaN;
    if (isFinite(ktL) && isFinite(vL) && vL > 0) ktv = ktL / vL;
    formatResult(ktvEl, ktv, 2, "");

    // 7) Remoção percentual de ureia
    let removalPercent = NaN;
    if (isFinite(ktv) && ktv > 0) removalPercent = (1 - Math.exp(-ktv)) * 100;
    formatResult(ureaRemovalEl, removalPercent, 0, "%");

    // 8) Notas de eficiência Qb/Qd
    if (efficiencyNoteEl) {
      let note = "";
      if (!isFinite(qd)) {
        note = "";
      } else if (qb < 120) {
        note = "Qb baixo: o AUTO-FLOW irá limitar a depuração.";
      } else if (qb >= 120 && qb <= 300) {
        note = "Qb/Qd adequados para SLED com AUTO-FLOW.";
      } else if (qb > 300 && qb <= 400) {
        note = "Qb elevado — ganho adicional limitado.";
      } else {
        note = "Qb muito elevado — risco de alarmes de pressão.";
      }
      efficiencyNoteEl.textContent = note;
    }

    // 9) Comentário global (UF + dose)
    let comentario = "";
    let warning = "";

    if (ufKgHora <= 10) {
      comentario = "UF bem tolerada na maioria dos doentes.";
      if (risco === "alto") {
        comentario += " Em risco alto, considerar UF mais baixa.";
      }
    } else if (ufKgHora <= 13) {
      comentario = "UF no limite superior recomendado (10–13 mL/kg/h).";
      if (risco === "alto") {
        warning = "Risco hemodinâmico alto com UF elevada.";
      }
    } else {
      comentario = "UF excessiva para SLED.";
      warning = "Reduzir UF total ou prolongar sessão.";
    }

    if (isFinite(ktv)) {
      if (ktv < 1.2) comentario += " Kt/V baixo para SLED.";
      else if (ktv > 3) comentario += " Kt/V muito elevado (SLED longa).";
      else comentario += " Dose dialítica adequada.";
    }

    if (commentaryEl) commentaryEl.innerHTML = comentario;
    if (warning && warningEl) {
      warningEl.textContent = warning;
      warningEl.classList.remove("hidden");
    }

    /* ======================================================
       10) ΔNa — Tendência de sódio (banho vs doente)
       ====================================================== */
    const naBath = parseNumberValue(document.getElementById("sledNaBathInput"));
    let naPatient = parseNumberValue(document.getElementById("sledNaPatientInput"));
    if (!isFinite(naPatient)) naPatient = 140;

    let deltaNa = NaN;
    if (isFinite(naBath) && isFinite(naPatient)) {
      deltaNa = naBath - naPatient;
    }
    formatResult(deltaNaEl, deltaNa, 1, "mEq/L");

    if (isFinite(deltaNa)) {
      if (deltaNa > 4) {
        commentaryEl.innerHTML += " Banho hipertónico: tendência para subir Na<sup>+</sup>.";
      } else if (deltaNa < -4) {
        commentaryEl.innerHTML += " Banho hipotónico: tendência para baixar Na<sup>+</sup>.";
      }
    }

    /* ======================================================
       11) Carga de HCO₃⁻
       ====================================================== */
    const hco3Bath = parseNumberValue(document.getElementById("sledHco3BathInput"));
    let hco3Patient = parseNumberValue(
      document.getElementById("sledHco3PatientInput")
    );
    if (!isFinite(hco3Patient)) hco3Patient = 24;

    let hco3Carga = NaN;
    if (isFinite(hco3Bath) && isFinite(hco3Patient) && isFinite(qd) && isFinite(duracaoH)) {
      hco3Carga = (hco3Bath - hco3Patient) * qd * duracaoH;
    }

    formatResult(hco3CargaEl, hco3Carga, 0, "mEq");

    if (isFinite(hco3Carga)) {
      if (hco3Carga > 0) {
        commentaryEl.innerHTML += " Banho com tendência alcalinizante.";
      } else if (hco3Carga < 0) {
        commentaryEl.innerHTML += " Banho com tendência acidificante.";
      }
    }

    /* ======================================================
       12) Comentário sobre K+
       ====================================================== */
    const kBath = parseNumberValue(document.getElementById("sledKBathInput"));
    let kComment = "—";

    if (isFinite(kBath)) {
      if (kBath <= 2) kComment = "Banho muito baixo → risco de hipocalémia.";
      else if (kBath >= 4) kComment = "Banho alto → útil em hipocalémia, cautela se hipercalémia.";
      else kComment = "Banho habitual para SLED.";
    }

    kCommentEl.textContent = kComment;
  });
}


/* ======================
   HD Convencional
   ====================== */

function setupHdConv() {
  const calcBtn = document.getElementById("hdCalcBtn");
  if (!calcBtn) return;

  const pesoPreInput = document.getElementById("hdPesoPreInput");
  const pesoSecoInput = document.getElementById("hdPesoSecoInput");
  const duracaoInput = document.getElementById("hdDuracaoInput");
  const qbInput = document.getElementById("hdQbInput");
  const qdInput = document.getElementById("hdQdInput");

  const ufTotalEl = document.getElementById("hdUfTotal");
  const ufHoraEl = document.getElementById("hdUfHora");
  const ufKgHoraEl = document.getElementById("hdUfKgHora");
  const kDepuracaoEl = document.getElementById("hdKDepuracao");
  const ktTotalEl = document.getElementById("hdKtTotal");
  const vTotalEl = document.getElementById("hdVTotal");
  const ktvEl = document.getElementById("hdKtV");
  const ureaRemovalEl = document.getElementById("hdUreaRemoval");
  const warningEl = document.getElementById("hdWarning");
  const commentaryEl = document.getElementById("hdCommentary");

  calcBtn.addEventListener("click", () => {
    const pesoPre = parseNumberValue(pesoPreInput);
    const pesoSeco = parseNumberValue(pesoSecoInput);
    const duracaoH = parseNumberValue(duracaoInput);
    const qb = parseNumberValue(qbInput);
    let qd = parseNumberValue(qdInput);

    if (warningEl) {
      warningEl.textContent = "";
      warningEl.classList.add("hidden");
    }
    if (commentaryEl) commentaryEl.textContent = "";

    // Validação básica
    if (!isFinite(pesoPre) || pesoPre <= 0 || !isFinite(pesoSeco) || !isFinite(duracaoH) || duracaoH <= 0) {
      formatResult(ufTotalEl, NaN, 1, "L");
      formatResult(ufHoraEl, NaN, 0, "mL/h");
      formatResult(ufKgHoraEl, NaN, 1, "mL/kg/h");
      if (kDepuracaoEl) kDepuracaoEl.textContent = "—";
      formatResult(ktTotalEl, NaN, 1, "L");
      formatResult(vTotalEl, NaN, 1, "L");
      formatResult(ktvEl, NaN, 2, "");
      formatResult(ureaRemovalEl, NaN, 0, "%");
      if (warningEl) {
        warningEl.textContent = "Preencha peso pré, peso seco e duração com valores válidos.";
        warningEl.classList.remove("hidden");
      }
      return;
    }

    // 1) UF
    const deltaPeso = pesoPre - pesoSeco; // kg

    if (deltaPeso <= 0) {
      formatResult(ufTotalEl, 0, 1, "L");
      formatResult(ufHoraEl, 0, 0, "mL/h");
      formatResult(ufKgHoraEl, 0, 1, "mL/kg/h");
      if (warningEl) {
        warningEl.textContent =
          "Peso seco igual ou superior ao peso pré: UF significativa pode não ser necessária.";
        warningEl.classList.remove("hidden");
      }
    } else {
      const ufTotalL = deltaPeso; // 1 kg ≈ 1 L
      const ufHora = (ufTotalL * 1000) / duracaoH; // mL/h
      const ufKgHora = ufHora / pesoPre; // mL/kg/h

      formatResult(ufTotalEl, ufTotalL, 1, "L");
      formatResult(ufHoraEl, ufHora, 0, "mL/h");
      formatResult(ufKgHoraEl, ufKgHora, 1, "mL/kg/h");
    }

    // 2) Depuração K (≈ Qd)
    // Se Qd não for preenchido, podemos assumir valor típico (500 mL/min),
    // mas só se Qb for razoável.
    if (!isFinite(qd) || qd <= 0) {
      if (isFinite(qb) && qb > 0) {
        qd = Math.min(500, Math.max(300, qb * 1.5)); // heurística simples
      } else {
        qd = NaN;
      }
    }

    let kText = "—";
    let kLh = NaN;

    if (isFinite(qd)) {
      kLh = (qd * 60) / 1000; // L/h
      const kMlMinRounded = Math.round(qd);
      const kLhRounded = Math.round(kLh * 10) / 10;
      kText = `${kMlMinRounded} mL/min (~${kLhRounded.toFixed(1)} L/h)`;
    }

    if (kDepuracaoEl) {
      kDepuracaoEl.textContent = kText;
    }

    // 3) Kt total
    let ktL = NaN;
    if (isFinite(kLh)) {
      ktL = kLh * duracaoH; // L
    }
    formatResult(ktTotalEl, ktL, 1, "L");

    // 4) Volume de distribuição V (0,55 × peso)
    const vL = 0.55 * pesoPre;
    formatResult(vTotalEl, vL, 1, "L");

    // 5) Kt/V
    let ktv = NaN;
    if (isFinite(ktL) && isFinite(vL) && vL > 0) {
      ktv = ktL / vL;
    }
    formatResult(ktvEl, ktv, 2, "");

    // 6) Remoção percentual de ureia
    let removalPercent = NaN;
    if (isFinite(ktv) && ktv > 0) {
      removalPercent = (1 - Math.exp(-ktv)) * 100; // 1 - e^(-Kt/V)
    }
    formatResult(ureaRemovalEl, removalPercent, 0, "%");

    // 7) Comentário global (UF + dose dialítica)
    let comentario = "";
    let warning = "";

    // Comentário UF, se calculada
    const ufKgHoraText = ufKgHoraEl ? ufKgHoraEl.textContent : "";
    const ufKgHoraNum = ufKgHoraText && ufKgHoraText !== "—"
      ? parseFloat(ufKgHoraText)
      : NaN;

    if (isFinite(ufKgHoraNum)) {
      if (ufKgHoraNum <= 10) {
        comentario = "Taxa de UF habitualmente bem tolerada na maioria dos doentes.";
      } else if (ufKgHoraNum <= 13) {
        comentario =
          "UF/kg/h no limite superior recomendado (10–13 mL/kg/h). Monitorizar tolerância hemodinâmica.";
      } else {
        comentario =
          "UF/kg/h elevada: aumenta o risco de hipotensão e hipoperfusão.";
        warning =
          "Considerar reduzir o objetivo de perda de peso ou prolongar a sessão para diminuir UF/kg/h.";
      }
    }

    // Comentário sobre dose (Kt/V)
    if (isFinite(ktv)) {
      if (ktv < 1.0) {
        comentario +=
          " Dose dialítica estimada baixa (Kt/V < 1,0). Se possível, considerar aumentar duração ou fluxos.";
      } else if (ktv >= 1.0 && ktv < 1.2) {
        comentario +=
          " Dose dialítica no limite inferior (Kt/V 1,0–1,2).";
      } else if (ktv >= 1.2 && ktv <= 1.6) {
        comentario +=
          " Dose dialítica adequada para HD convencional (Kt/V ≥ 1,2).";
      } else if (ktv > 1.6) {
        comentario +=
          " Dose dialítica elevada; do ponto de vista de depuração, pode não ser necessário prolongar mais.";
      }
    }

    if (commentaryEl) {
      commentaryEl.textContent = comentario || "";
    }

    if (warning && warningEl) {
      warningEl.textContent = warning;
      warningEl.classList.remove("hidden");
    }
  });
}



/* ======================
   Init
   ====================== */
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupTabs();
  setupAnticoag();
  setupEfluente();
  setupHco3();
  setupHypernatremia();
  setupHyponatremia();
  setupSled();
  setupHdConv();
  setupSidebarAccordion();
});
