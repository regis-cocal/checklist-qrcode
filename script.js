(() => {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const API_URL = String(cfg.POWER_AUTOMATE_URL || "").trim();
  const MOCK_MODE = Boolean(cfg.MOCK_MODE);
  const REQUEST_TIMEOUT_MS = Number(cfg.REQUEST_TIMEOUT_MS || 15000);

  const $ = (selector) => document.querySelector(selector);

  const state = {
    step: 1,
    colaborador: null,
    submitting: false
  };

  const els = {
    alert: $("#alert"),
    apiStatus: $("#apiStatus"),
    matricula: $("#matricula"),
    matriculaCount: $("#matriculaCount"),
    clearMatricula: $("#clearMatricula"),
    buscarBtn: $("#buscarBtn"),
    backToIdentity: $("#backToIdentity"),
    frota: $("#frota"),
    gravarBtn: $("#gravarBtn"),
    novoChecklistBtn: $("#novoChecklistBtn"),
    profileName: $("#profileName"),
    profileRole: $("#profileRole"),
    profileMatricula: $("#profileMatricula"),
    profileLocal: $("#profileLocal"),
    profileDate: $("#profileDate"),
    avatar: $("#avatar"),
    receiptFrota: $("#receiptFrota"),
    receiptMatricula: $("#receiptMatricula"),
    receiptDate: $("#receiptDate"),
    successMessage: $("#successMessage"),
    progressLine: $("#progressLine"),
    progressLine2: $("#progressLine2")
  };

  function showAlert(message, type = "error") {
    els.alert.textContent = message;
    els.alert.className = `alert ${type} is-visible`;
  }

  function clearAlert() {
    els.alert.className = "alert";
    els.alert.textContent = "";
  }

  function setLoading(button, loading) {
    button.classList.toggle("is-loading", loading);
    button.disabled = loading;
  }

  function normalize(value) {
    return String(value ?? "").trim();
  }

  function onlyDigits(value) {
    return normalize(value).replace(/\D/g, "");
  }

  function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(date);
  }

  function initials(name) {
    const parts = normalize(name).split(/\s+/).filter(Boolean);
    if (!parts.length) return "CO";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function setApiStatus(ok, text = null) {
    els.apiStatus.classList.toggle("is-error", !ok);
    els.apiStatus.querySelector("span:last-child").textContent =
      text || (ok ? "Online" : "Indisponível");
  }

  function updateProgress(step) {
    state.step = step;
    document.querySelectorAll(".progress-step").forEach((node) => {
      const n = Number(node.dataset.step);
      node.classList.toggle("is-active", n === step);
      node.classList.toggle("is-done", n < step);
    });

    els.progressLine.style.width = step >= 2 ? "100%" : "0%";
    els.progressLine2.style.width = step >= 3 ? "100%" : "0%";
  }

  function showStep(step) {
    document.querySelectorAll(".step-panel").forEach((panel) => {
      panel.classList.remove("is-visible");
    });
    $(`#step${step}`).classList.add("is-visible");
    updateProgress(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function callApi(payload) {
    if (MOCK_MODE) {
      return mockApi(payload);
    }

    if (!API_URL) {
      throw new Error(
        "A URL do Power Automate ainda não foi configurada em config.js."
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const raw = await response.text();
      let data = {};

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { ok: response.ok, raw };
        }
      }

      if (!response.ok) {
        const details = data.erro || data.message || data.raw || `HTTP ${response.status}`;
        throw new Error(String(details));
      }

      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("A solicitação demorou demais. Tente novamente.");
      }
      if (String(error?.message || "").toLowerCase().includes("failed to fetch")) {
        throw new Error(
          "Não foi possível conectar ao Power Automate. Verifique a URL e, se a página estiver hospedada em outro site, confira se o endpoint aceita chamadas do navegador (CORS)."
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Apenas para visualizar/testar a interface sem backend.
  async function mockApi(payload) {
    await new Promise((resolve) => setTimeout(resolve, 650));

    if (payload.acao === "buscar") {
      if (payload.matricula === "0000000") {
        return { ok: false, erro: "Matrícula não encontrada" };
      }

      return {
        ok: true,
        matricula: payload.matricula,
        nome: "Colaborador de Demonstração",
        cargo: "Operador",
        local: "PPT"
      };
    }

    if (payload.acao === "gravar") {
      return {
        ok: true,
        mensagem: "Checklist registrado com sucesso."
      };
    }

    throw new Error("Ação desconhecida.");
  }

  function fillCollaborator(data) {
    state.colaborador = {
      matricula: normalize(data.matricula),
      nome: normalize(data.nome),
      cargo: normalize(data.cargo),
      local: normalize(data.local)
    };

    els.profileMatricula.textContent = state.colaborador.matricula || "—";
    els.profileName.textContent = state.colaborador.nome || "—";
    els.profileRole.textContent = state.colaborador.cargo || "—";
    els.profileLocal.textContent = state.colaborador.local || "—";
    els.profileDate.textContent = formatDate();
    els.avatar.textContent = initials(state.colaborador.nome);
  }

  function getProblemaPneu() {
    const selected = document.querySelector('input[name="problema_pneu"]:checked');
    return selected ? selected.value : "";
  }

  function validateIdentity() {
    const matricula = onlyDigits(els.matricula.value);

    if (!matricula) {
      showAlert("Digite sua matrícula para continuar.");
      els.matricula.focus();
      return null;
    }

    if (matricula.length < 4) {
      showAlert("Confira a matrícula informada.");
      els.matricula.focus();
      return null;
    }

    return matricula;
  }

  async function buscarColaborador() {
    clearAlert();
    const matricula = validateIdentity();
    if (!matricula || state.submitting) return;

    state.submitting = true;
    setLoading(els.buscarBtn, true);

    try {
      const data = await callApi({
        acao: "buscar",
        matricula
      });

      if (!data?.ok) {
        setApiStatus(true, "Online");
        throw new Error(data?.erro || "Matrícula não encontrada.");
      }

      fillCollaborator(data);
      els.frota.value = "";
      document.querySelectorAll('input[name="problema_pneu"]').forEach((input) => {
        input.checked = false;
      });

      showStep(2);
      setTimeout(() => els.frota.focus(), 260);
    } catch (error) {
      setApiStatus(true, "Online");
      showAlert(error.message || "Não foi possível buscar seus dados.");
    } finally {
      state.submitting = false;
      setLoading(els.buscarBtn, false);
    }
  }

  async function gravarChecklist() {
    clearAlert();

    if (!state.colaborador) {
      showStep(1);
      showAlert("Identifique o colaborador antes de enviar.");
      return;
    }

    const frota = onlyDigits(els.frota.value);
    const problemaPneu = getProblemaPneu();

    if (!frota) {
      showAlert("Informe a frota do equipamento.");
      els.frota.focus();
      return;
    }

    if (!problemaPneu) {
      showAlert("Selecione se existe ou não problema no pneu.");
      return;
    }

    if (state.submitting) return;

    state.submitting = true;
    setLoading(els.gravarBtn, true);

    const payload = {
      acao: "gravar",
      matricula: state.colaborador.matricula,
      nome: state.colaborador.nome,
      cargo: state.colaborador.cargo,
      local: state.colaborador.local,
      frota,
      problema_pneu: problemaPneu
    };

    try {
      const data = await callApi(payload);

      if (!data?.ok) {
        throw new Error(data?.erro || "Não foi possível registrar o checklist.");
      }

      const now = new Date();
      els.receiptFrota.textContent = frota;
      els.receiptMatricula.textContent = state.colaborador.matricula;
      els.receiptDate.textContent = formatDate(now);
      els.successMessage.textContent =
        data.mensagem || "O registro foi salvo com sucesso.";

      showStep(3);
    } catch (error) {
      setApiStatus(true, "Online");
      showAlert(error.message || "Não foi possível registrar o checklist.");
    } finally {
      state.submitting = false;
      setLoading(els.gravarBtn, false);
    }
  }

  function resetForm() {
    state.colaborador = null;
    state.submitting = false;
    els.matricula.value = "";
    els.frota.value = "";
    els.matriculaCount.textContent = "0/20";
    document.querySelectorAll('input[name="problema_pneu"]').forEach((input) => {
      input.checked = false;
    });
    clearAlert();
    showStep(1);
    els.matricula.focus();
  }

  function bindEvents() {
    els.matricula.addEventListener("input", () => {
      const value = onlyDigits(els.matricula.value).slice(0, 20);
      els.matricula.value = value;
      els.matriculaCount.textContent = `${value.length}/20`;
      clearAlert();
    });

    els.clearMatricula.addEventListener("click", () => {
      els.matricula.value = "";
      els.matriculaCount.textContent = "0/20";
      clearAlert();
      els.matricula.focus();
    });

    els.matricula.addEventListener("keydown", (event) => {
      if (event.key === "Enter") buscarColaborador();
    });

    els.buscarBtn.addEventListener("click", buscarColaborador);
    els.gravarBtn.addEventListener("click", gravarChecklist);

    els.backToIdentity.addEventListener("click", () => {
      clearAlert();
      showStep(1);
      els.matricula.focus();
    });

    els.novoChecklistBtn.addEventListener("click", resetForm);
  }

  function boot() {
    bindEvents();
    setApiStatus(Boolean(API_URL || MOCK_MODE), MOCK_MODE ? "Demo" : (API_URL ? "Online" : "Config."));
    updateProgress(1);
  }

  boot();
})();
