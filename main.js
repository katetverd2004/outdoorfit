
"use strict";

const DATA = window.PLANNER_DATA;
const STORAGE_KEY = "outdoorfit_plans_v1";

// Элементы формы
const form = document.getElementById("trainingForm");
const nameInput = document.getElementById("trainingName");
const dateInput = document.getElementById("trainingDate");
const typeInput = document.getElementById("trainingType");
const darkInput = document.getElementById("isDark");

// Элементы интерфейса
const message = document.getElementById("formMessage");
const currentPlan = document.getElementById("currentPlan");
const checklist = document.getElementById("checklist");
const summary = document.getElementById("summary");
const sourcesList = document.getElementById("sourcesList");

const planStatus = document.getElementById("planStatus");
const progressValue = document.getElementById("progressValue");
const progressBar = document.getElementById("progressBar");

// Новые элементы
const saveBtn = document.getElementById("savePlanBtn");
const newBtn = document.getElementById("newPlanBtn");
const savedList = document.getElementById("savedPlansList");
const storageMessage = document.getElementById("storageMessage");

// Состояние
let planCreated = false;
let checkedItems = {};
let plans = [];
let currentPlanId = null;
let baseline = null;
let storageAvailable = true;

// Уникальный ID
function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    "-" + Math.random().toString(36).slice(2);
}

// Данные текущей формы
function getFormData() {
  return {
    name: nameInput.value.trim(),
    location: "Санкт-Петербург",
    date: dateInput.value,
    type: typeInput.value,
    isDark: darkInput.checked,
    checkedItems: { ...checkedItems }
  };
}

// Проверка даты
function validDate(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

// Проверка формы
function validateForm() {
  if (!nameInput.value.trim()) {
    message.textContent = "Введите название тренировки.";
    nameInput.focus();
    return false;
  }

  if (nameInput.value.trim().length > 100) {
    message.textContent = "Название слишком длинное.";
    nameInput.focus();
    return false;
  }

  if (!validDate(dateInput.value)) {
    message.textContent = "Выберите корректную дату.";
    dateInput.focus();
    return false;
  }

  if (!Object.hasOwn(DATA.activities, typeInput.value)) {
    message.textContent = "Выберите корректный вид активности.";
    return false;
  }

  return true;
}

// Проверка структуры сохранённой записи
function isValidPlan(plan) {
  if (!plan || typeof plan !== "object" ||
      Array.isArray(plan)) {
    return false;
  }

  const validChecks = plan.checkedItems &&
    typeof plan.checkedItems === "object" &&
    !Array.isArray(plan.checkedItems) &&
    Object.keys(plan.checkedItems).every(id =>
      DATA.checklist.some(item => item.id === id) &&
      typeof plan.checkedItems[id] === "boolean"
    );

  return typeof plan.id === "string" &&
    plan.id.length > 0 &&
    typeof plan.name === "string" &&
    plan.name.trim().length > 0 &&
    plan.name.length <= 100 &&
    plan.location === "Санкт-Петербург" &&
    validDate(plan.date) &&
    Object.hasOwn(DATA.activities, plan.type) &&
    typeof plan.isDark === "boolean" &&
    validChecks &&
    typeof plan.savedAt === "string" &&
    !Number.isNaN(Date.parse(plan.savedAt));
}

// Сообщения о сохранении
function showStorageMessage(text, isError = false) {
  storageMessage.textContent = text;
  storageMessage.className =
    isError ? "storage-error" : "storage-success";
}

// Чтение localStorage
function loadPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      plans = [];
      storageAvailable = true;
      return;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) ||
        !parsed.every(isValidPlan)) {
      throw new Error("Повреждённая структура данных");
    }

    const ids = parsed.map(plan => plan.id);

    if (new Set(ids).size !== ids.length) {
      throw new Error("Повторяющиеся идентификаторы");
    }

    plans = parsed;
    storageAvailable = true;
  } catch (error) {
    storageAvailable = false;
    plans = [];

    showStorageMessage(
      "Не удалось прочитать сохранённые планы. " +
      "Данные могут быть повреждены или хранилище " +
      "недоступно. Запись заблокирована, чтобы " +
      "не потерять существующие данные.",
      true
    );
  }
}

// Запись localStorage
function writePlans(nextPlans) {
  if (!storageAvailable) {
    showStorageMessage(
      "Сохранение заблокировано: сначала " +
      "устраните ошибку хранилища.",
      true
    );
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextPlans)
    );

    plans = nextPlans;
    return true;
  } catch (error) {
    showStorageMessage(
      "Не удалось сохранить данные. Проверьте " +
      "доступность хранилища браузера.",
      true
    );
    return false;
  }
}

// Проверка несохранённых изменений
function hasUnsavedChanges() {
  const current = JSON.stringify(getFormData());

  if (baseline === null) {
    return Boolean(
      nameInput.value.trim() ||
      dateInput.value ||
      darkInput.checked ||
      typeInput.value !== "running" ||
      Object.values(checkedItems).some(Boolean)
    );
  }

  return current !== baseline;
}

function confirmDiscard() {
  if (!hasUnsavedChanges()) return true;

  return window.confirm(
    "Есть несохранённые изменения. " +
    "Продолжить без их сохранения?"
  );
}

// Применимые пункты чек-листа
function getApplicableItems() {
  return DATA.checklist.filter(item => {
    return item.types.includes(typeInput.value) &&
      (!item.darkOnly || darkInput.checked);
  });
}

// Отображение чек-листа
function renderChecklist() {
  checklist.replaceChildren();

  getApplicableItems().forEach(item => {
    const row = document.createElement("div");
    row.className = "check-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "check-" + item.id;
    checkbox.checked = Boolean(checkedItems[item.id]);

    checkbox.addEventListener("change", () => {
      checkedItems[item.id] = checkbox.checked;
      renderSummary();
      renderPlan();
    });

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;

    const text = document.createElement("span");
    text.textContent = item.text;

    const note = document.createElement("small");
    note.textContent = item.category;

    label.append(text, note);
    row.append(checkbox, label);
    checklist.append(row);
  });

  renderSummary();
}

// Сводка
function renderSummary() {
  summary.replaceChildren();

  const items = getApplicableItems();
  const completed = items.filter(item =>
    checkedItems[item.id]
  );

  const remaining = items.filter(item =>
    !checkedItems[item.id]
  );

  const percentage = items.length
    ? Math.round(completed.length / items.length * 100)
    : 0;

  progressValue.textContent = percentage + "%";
  progressBar.style.width = percentage + "%";

  const counter = document.createElement("p");
  counter.textContent =
    `Выполнено: ${completed.length} из ${items.length}`;
  summary.append(counter);

  const heading = document.createElement("h3");
  heading.textContent = "Осталось выполнить:";
  summary.append(heading);

  if (remaining.length === 0) {
    const done = document.createElement("p");
    done.textContent = "Все применимые пункты отмечены.";
    summary.append(done);
  } else {
    const list = document.createElement("ul");

    remaining.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.text;
      list.append(li);
    });

    summary.append(list);
  }

  const warning = document.createElement("p");
  warning.className = "muted";
  warning.textContent =
    "Отметки не гарантируют безопасность тренировки.";
  summary.append(warning);
}

// Текущий план
function renderPlan() {
  currentPlan.replaceChildren();

  if (!planCreated) {
    planStatus.textContent = "Не создан";
    return;
  }

  planStatus.textContent =
    hasUnsavedChanges() ? "Не сохранён" : "Сохранён";

  const heading = document.createElement("h3");
  heading.textContent = "Текущий план";

  const details = document.createElement("p");

  details.textContent =
    `${nameInput.value.trim()} — ${dateInput.value}. ` +
    `${DATA.activities[typeInput.value]}. ` +
    `Санкт-Петербург. ` +
    (darkInput.checked
      ? "Тёмное время суток."
      : "Без дополнительного условия.");

  currentPlan.append(heading, details);
}

// Отображение списка планов
function renderSavedPlans() {
  savedList.replaceChildren();

  if (plans.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-plans";
    empty.textContent =
      storageAvailable
        ? "Сохранённых тренировок пока нет."
        : "Не удалось загрузить список тренировок.";

    savedList.append(empty);
    return;
  }

  plans.forEach(plan => {
    const card = document.createElement("div");
    card.className = "saved-plan";

    if (plan.id === currentPlanId) {
      card.classList.add("active");
    }

    const info = document.createElement("div");
    info.className = "saved-plan-info";

    const title = document.createElement("h3");
    title.textContent = plan.name;

    const details = document.createElement("p");
    details.textContent =
      `${plan.date} • ${DATA.activities[plan.type]}`;

    const savedTime = document.createElement("p");
    savedTime.textContent =
      "Сохранено: " +
      new Date(plan.savedAt).toLocaleString("ru-RU");

    info.append(title, details, savedTime);

    const buttons = document.createElement("div");
    buttons.className = "saved-plan-buttons";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "plan-open-btn";
    openBtn.textContent = "Открыть";

    openBtn.addEventListener("click", () => {
      openPlan(plan.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "plan-delete-btn";
    deleteBtn.textContent = "Удалить";

    deleteBtn.addEventListener("click", () => {
      deletePlan(plan.id);
    });

    buttons.append(openBtn, deleteBtn);
    card.append(info, buttons);
    savedList.append(card);
  });
}

// Сохранение плана
function savePlan() {
  if (!validateForm()) return;

  const formData = getFormData();

  const plan = {
    ...formData,
    id: currentPlanId || createId(),
    savedAt: new Date().toISOString()
  };

  const nextPlans = [...plans];
  const index = nextPlans.findIndex(
    item => item.id === plan.id
  );

  if (currentPlanId !== null && index === -1) {
    showStorageMessage(
      "Открытый план не найден в хранилище. " +
      "Сохранение остановлено.",
      true
    );
    return;
  }

  if (index >= 0) {
    nextPlans[index] = plan;
  } else {
    nextPlans.push(plan);
  }

  if (!writePlans(nextPlans)) return;

  currentPlanId = plan.id;
  planCreated = true;
  baseline = JSON.stringify(formData);

  message.textContent = "";
  showStorageMessage("План успешно сохранён.");

  renderPlan();
  renderSavedPlans();
}

// Открытие плана
function openPlan(id) {
  const plan = plans.find(item => item.id === id);
  if (!plan) return;

  if (!confirmDiscard()) return;

  nameInput.value = plan.name;
  dateInput.value = plan.date;
  typeInput.value = plan.type;
  darkInput.checked = plan.isDark;

  checkedItems = { ...plan.checkedItems };
  currentPlanId = plan.id;
  planCreated = true;

  baseline = JSON.stringify(getFormData());

  message.textContent = "";
  showStorageMessage("План открыт.");

  renderChecklist();
  renderPlan();
  renderSavedPlans();

  document.getElementById("plans")
    .scrollIntoView({ behavior: "smooth" });
}

// Новый план
function newPlan() {
  if (!confirmDiscard()) return;

  form.reset();
  checkedItems = {};
  currentPlanId = null;
  planCreated = false;
  baseline = null;

  message.textContent = "";
  showStorageMessage("Можно создать новую тренировку.");

  renderChecklist();
  renderPlan();
  renderSavedPlans();
}

// Удаление плана
function deletePlan(id) {
  const plan = plans.find(item => item.id === id);
  if (!plan) return;

  if (id === currentPlanId && !confirmDiscard()) {
    return;
  }

  if (!window.confirm(
    `Удалить тренировку «${plan.name}»?`
  )) {
    return;
  }

  const nextPlans = plans.filter(item => item.id !== id);

  if (!writePlans(nextPlans)) return;

  if (currentPlanId === id) {
    form.reset();
    checkedItems = {};
    currentPlanId = null;
    planCreated = false;
    baseline = null;

    renderChecklist();
    renderPlan();
  }

  showStorageMessage("Тренировка удалена.");
  renderSavedPlans();
}

// Создание плана
form.addEventListener("submit", event => {
  event.preventDefault();

  if (!validateForm()) return;

  planCreated = true;

  message.textContent =
    "План создан или изменён. " +
    "Нажмите «Сохранить план», чтобы записать его.";

  renderPlan();
  renderChecklist();
});

// Изменения условий
[typeInput, darkInput].forEach(input => {
  input.addEventListener("change", () => {
    renderChecklist();
    renderPlan();
  });
});

[nameInput, dateInput].forEach(input => {
  input.addEventListener("input", renderPlan);
});

// Кнопки сохранения
saveBtn.addEventListener("click", savePlan);
newBtn.addEventListener("click", newPlan);

// Источники
function renderSources() {
  sourcesList.replaceChildren();

  if (DATA.sources.length === 0) {
    const notice = document.createElement("p");
    notice.className = "muted";
    notice.textContent =
      "Проверенные рекомендации и официальные источники пока не добавлены.";

    sourcesList.append(notice);
    return;
  }

  DATA.sources.forEach(source => {
    const item = document.createElement("p");
    const link = document.createElement("a");

    link.href = source.url;
    link.textContent = source.title;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    item.append(link);
    sourcesList.append(item);
  });
}

// Первый запуск
loadPlans();
renderChecklist();
renderSources();
renderPlan();
renderSavedPlans();
// ========================================
// ОТЧЁТ О ТРЕНИРОВКЕ
// ========================================

const generateReportBtn =
  document.getElementById("generateReportBtn");

const printReportBtn =
  document.getElementById("printReportBtn");

const reportMessage =
  document.getElementById("reportMessage");

const reportContent =
  document.getElementById("reportContent");

// Создание отчёта
function generateReport() {
  reportContent.replaceChildren();
  reportMessage.textContent = "";
  printReportBtn.disabled = true;

  if (!planCreated) {
    reportMessage.textContent =
      "Сначала создайте план тренировки.";
    return;
  }

  const plan = getFormData();

  const relevantItems = DATA.checklist.filter(item =>
    item.types.includes(plan.type) &&
    (!item.darkOnly || plan.isDark)
  );

  const completedItems = relevantItems.filter(
    item => plan.checkedItems[item.id] === true
  );

  const total = relevantItems.length;
  const completed = completedItems.length;

  const percent = total > 0
    ? Math.round((completed / total) * 100)
    : 0;

  const heading = document.createElement("h3");
  heading.textContent = "Отчёт: " + plan.name;
  reportContent.append(heading);

  const details = [
    "Место: " + plan.location,
    "Дата: " + plan.date,
    "Вид тренировки: " + DATA.activities[plan.type],
    "Тренировка в темноте: " + (plan.isDark ? "Да" : "Нет"),
    "Подготовка: " + completed + " из " + total +
      " (" + percent + "%)"
  ];

  details.forEach(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    reportContent.append(paragraph);
  });

  const checklistHeading = document.createElement("h4");
  checklistHeading.textContent = "Результаты подготовки";
  reportContent.append(checklistHeading);

  const list = document.createElement("ul");

  relevantItems.forEach(item => {
    const li = document.createElement("li");

    const isCompleted =
      plan.checkedItems[item.id] === true;

    li.textContent =
      (isCompleted ? "Выполнено: " : "Не выполнено: ") +
      item.text;

    list.append(li);
  });

  reportContent.append(list);

  const warning = document.createElement("p");
  warning.textContent =
    "Отчёт отражает отметки пользователя и не гарантирует " +
    "безопасность проведения тренировки.";

  reportContent.append(warning);

  reportMessage.textContent =
    "Отчёт успешно сформирован.";

  printReportBtn.disabled = false;
}

// Кнопка формирования отчёта
generateReportBtn.addEventListener(
  "click",
  generateReport
);

// Кнопка печати отчёта
printReportBtn.addEventListener("click", () => {
  window.print();
});