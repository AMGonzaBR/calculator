(() => {
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const apiHintEl = document.getElementById("apiHint");
  const keys = document.querySelector(".keys");

  const API_BASE = new URLSearchParams(window.location.search).get("api") || "http://localhost:3000";
  apiHintEl.textContent = `API: ${API_BASE}`;

  const state = {
    displayValue: "0",
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
    busy: false,
  };

  const operatorToRoute = {
    "+": "add",
    "−": "subtract",
    "×": "multiply",
    "÷": "divide",
  };

  function setBusy(isBusy) {
    state.busy = isBusy;
    keys.querySelectorAll("button").forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function updateDisplay() {
    resultEl.textContent = state.displayValue;

    if (state.operator && state.firstOperand !== null) {
      const second = state.waitingForSecondOperand ? "" : state.displayValue;
      expressionEl.textContent = `${formatNumber(state.firstOperand)} ${state.operator} ${second}`.trim();
    } else {
      expressionEl.textContent = "";
    }

    document.querySelectorAll(".key-op").forEach((button) => {
      button.classList.toggle(
        "is-active",
        state.waitingForSecondOperand && button.dataset.value === state.operator
      );
    });
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Error";

    const asString = String(number);
    if (asString.length > 12) {
      return number.toPrecision(8).replace(/\.?0+$/, "");
    }
    return asString;
  }

  function inputDigit(digit) {
    if (state.waitingForSecondOperand) {
      state.displayValue = digit;
      state.waitingForSecondOperand = false;
      return;
    }

    if (state.displayValue === "0") {
      state.displayValue = digit;
    } else if (state.displayValue.replace("-", "").length < 12) {
      state.displayValue += digit;
    }
  }

  function inputDecimal() {
    if (state.waitingForSecondOperand) {
      state.displayValue = "0.";
      state.waitingForSecondOperand = false;
      return;
    }

    if (!state.displayValue.includes(".")) {
      state.displayValue += ".";
    }
  }

  function clearAll() {
    state.displayValue = "0";
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
  }

  function toggleSign() {
    if (state.displayValue === "0" || state.displayValue === "Error") return;
    state.displayValue = state.displayValue.startsWith("-")
      ? state.displayValue.slice(1)
      : `-${state.displayValue}`;
  }

  function inputPercent() {
    const current = Number(state.displayValue);
    if (!Number.isFinite(current)) return;
    state.displayValue = formatNumber(current / 100);
  }

  async function callOperation(operator, a, b) {
    const route = operatorToRoute[operator];
    if (!route) {
      throw new Error(`Unsupported operator: ${operator}`);
    }

    const response = await fetch(`${API_BASE}/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Service ${route} failed`);
    }
    if (!Number.isFinite(Number(payload.result))) {
      throw new Error("Service returned an invalid result");
    }
    return Number(payload.result);
  }

  async function handleOperator(nextOperator) {
    const inputValue = Number(state.displayValue);

    if (state.operator && state.waitingForSecondOperand) {
      state.operator = nextOperator;
      return;
    }

    if (state.firstOperand === null) {
      state.firstOperand = inputValue;
    } else if (state.operator) {
      setBusy(true);
      try {
        const result = await callOperation(state.operator, state.firstOperand, inputValue);
        state.displayValue = formatNumber(result);
        state.firstOperand = result;
      } catch (error) {
        state.displayValue = "Error";
        state.firstOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
        expressionEl.textContent = error.message;
        return;
      } finally {
        setBusy(false);
      }
    }

    state.waitingForSecondOperand = true;
    state.operator = nextOperator;
  }

  async function handleEquals() {
    if (state.operator === null || state.firstOperand === null || state.waitingForSecondOperand) {
      return;
    }

    const secondOperand = Number(state.displayValue);
    setBusy(true);
    try {
      const result = await callOperation(state.operator, state.firstOperand, secondOperand);
      expressionEl.textContent = `${formatNumber(state.firstOperand)} ${state.operator} ${formatNumber(secondOperand)} =`;
      state.displayValue = formatNumber(result);
      state.firstOperand = null;
      state.operator = null;
      state.waitingForSecondOperand = false;
      resultEl.textContent = state.displayValue;
      document.querySelectorAll(".key-op").forEach((btn) => btn.classList.remove("is-active"));
    } catch (error) {
      state.displayValue = "Error";
      expressionEl.textContent = error.message;
      state.firstOperand = null;
      state.operator = null;
      state.waitingForSecondOperand = false;
      updateDisplay();
    } finally {
      setBusy(false);
    }
  }

  keys.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || state.busy) return;

    const { action, value } = button.dataset;

    switch (action) {
      case "digit":
        inputDigit(value);
        updateDisplay();
        break;
      case "decimal":
        inputDecimal();
        updateDisplay();
        break;
      case "clear":
        clearAll();
        updateDisplay();
        break;
      case "sign":
        toggleSign();
        updateDisplay();
        break;
      case "percent":
        inputPercent();
        updateDisplay();
        break;
      case "operator":
        await handleOperator(value);
        updateDisplay();
        break;
      case "equals":
        await handleEquals();
        break;
      default:
        break;
    }
  });

  updateDisplay();
})();
