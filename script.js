(() => {
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const keys = document.querySelector(".keys");

  const state = {
    displayValue: "0",
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
  };

  const operatorSymbols = {
    "+": "+",
    "−": "−",
    "×": "×",
    "÷": "÷",
  };

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

  function calculate(first, second, operator) {
    switch (operator) {
      case "+":
        return first + second;
      case "−":
        return first - second;
      case "×":
        return first * second;
      case "÷":
        return second === 0 ? NaN : first / second;
      default:
        return second;
    }
  }

  function handleOperator(nextOperator) {
    const inputValue = Number(state.displayValue);

    if (state.operator && state.waitingForSecondOperand) {
      state.operator = nextOperator;
      return;
    }

    if (state.firstOperand === null) {
      state.firstOperand = inputValue;
    } else if (state.operator) {
      const result = calculate(state.firstOperand, inputValue, state.operator);
      state.displayValue = formatNumber(result);
      state.firstOperand = Number.isFinite(result) ? result : null;
    }

    state.waitingForSecondOperand = true;
    state.operator = nextOperator;
  }

  function handleEquals() {
    if (state.operator === null || state.firstOperand === null || state.waitingForSecondOperand) {
      return;
    }

    const secondOperand = Number(state.displayValue);
    const result = calculate(state.firstOperand, secondOperand, state.operator);

    expressionEl.textContent = `${formatNumber(state.firstOperand)} ${state.operator} ${formatNumber(secondOperand)} =`;
    state.displayValue = formatNumber(result);
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
  }

  keys.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, value } = button.dataset;

    switch (action) {
      case "digit":
        inputDigit(value);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        inputPercent();
        break;
      case "operator":
        handleOperator(value);
        break;
      case "equals":
        handleEquals();
        break;
      default:
        break;
    }

    if (action !== "equals") {
      updateDisplay();
    } else {
      resultEl.textContent = state.displayValue;
      document.querySelectorAll(".key-op").forEach((btn) => btn.classList.remove("is-active"));
    }
  });

  document.addEventListener("keydown", (event) => {
    const { key } = event;

    if (/\d/.test(key)) {
      inputDigit(key);
      updateDisplay();
      return;
    }

    const keyMap = {
      ".": () => inputDecimal(),
      ",": () => inputDecimal(),
      Escape: () => clearAll(),
      Backspace: () => {
        if (state.waitingForSecondOperand) return;
        state.displayValue =
          state.displayValue.length > 1 ? state.displayValue.slice(0, -1) : "0";
      },
      "%": () => inputPercent(),
      Enter: () => handleEquals(),
      "=": () => handleEquals(),
      "+": () => handleOperator("+"),
      "-": () => handleOperator("−"),
      "*": () => handleOperator("×"),
      "/": () => {
        event.preventDefault();
        handleOperator("÷");
      },
    };

    if (keyMap[key]) {
      keyMap[key]();
      if (key === "Enter" || key === "=") {
        resultEl.textContent = state.displayValue;
        document.querySelectorAll(".key-op").forEach((btn) => btn.classList.remove("is-active"));
      } else {
        updateDisplay();
      }
    }
  });

  updateDisplay();
})();
