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
    const peso = getNumber("pesoInput", 1);

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
          ? formatNumber(volumeNaCl20, 0) + " mL"
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

      const waterAdd =
        naTarget > 0
          ? ((NA_SACOS * VOL_SACO_L) / naTarget - VOL_SACO_L) * 1000
          : null;

      const waterReplace =
        (VOL_SACO_L - (naTarget * VOL_SACO_L) / 140) * 1000;

      document.getElementById("hypoWaterAddResult").textContent =
        waterAdd != null
          ? formatNumber(waterAdd, 0) + " mL"
          : "Na pretendida inválida";

      document.getElementById("hypoWaterReplaceResult").textContent =
        formatNumber(waterReplace, 0) + " mL";
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
   Init
   ====================== */
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupTabs();
  setupEfluente();
  setupHco3();
  setupHypernatremia();
  setupHyponatremia();
});
