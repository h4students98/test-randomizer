const STORAGE_KEY = "item-divider-pwa-state-v1";

const state = {
  people: [],
  items: [],
  lastResultText: ""
};

const personInput = document.getElementById("personInput");
const addPersonBtn = document.getElementById("addPersonBtn");
const peopleList = document.getElementById("peopleList");

const itemInput = document.getElementById("itemInput");
const addItemBtn = document.getElementById("addItemBtn");
const itemsList = document.getElementById("itemsList");

const selectAllBtn = document.getElementById("selectAllBtn");
const deselectAllBtn = document.getElementById("deselectAllBtn");

const divideBtn = document.getElementById("divideBtn");
const resultBox = document.getElementById("resultBox");
const shareBtn = document.getElementById("shareBtn");
const copyBtn = document.getElementById("copyBtn");
const clearDataBtn = document.getElementById("clearDataBtn");

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    people: state.people,
    items: state.items,
    lastResultText: state.lastResultText
  }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    state.people = Array.isArray(saved.people) ? saved.people : [];
    state.items = Array.isArray(saved.items) ? saved.items : [];
    state.lastResultText = typeof saved.lastResultText === "string" ? saved.lastResultText : "";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function renderPeople() {
  peopleList.innerHTML = "";

  if (state.people.length === 0) {
    peopleList.innerHTML = `<li class="list-item"><span>Nessuna persona aggiunta.</span></li>`;
    return;
  }

  state.people.forEach(person => {
    const li = document.createElement("li");
    li.className = "list-item";

    const span = document.createElement("span");
    span.textContent = person.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-button";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", `Elimina ${person.name}`);
    deleteBtn.addEventListener("click", () => removePerson(person.id));

    li.append(span, deleteBtn);
    peopleList.appendChild(li);
  });
}

function renderItems() {
  itemsList.innerHTML = "";

  if (state.items.length === 0) {
    itemsList.innerHTML = `<li class="list-item"><span>Nessun item aggiunto.</span></li>`;
    return;
  }

  state.items.forEach(item => {
    const li = document.createElement("li");
    li.className = "list-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.selected;
    checkbox.addEventListener("change", () => {
      item.selected = checkbox.checked;
      saveState();
    });

    const span = document.createElement("span");
    span.textContent = item.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-button";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", `Elimina ${item.name}`);
    deleteBtn.addEventListener("click", () => removeItem(item.id));

    li.append(checkbox, span, deleteBtn);
    itemsList.appendChild(li);
  });
}

function renderResult() {
  resultBox.textContent = state.lastResultText || "Il risultato apparirà qui.";
  shareBtn.disabled = !state.lastResultText;
  copyBtn.disabled = !state.lastResultText;
}

function render() {
  renderPeople();
  renderItems();
  renderResult();
}

function addPerson() {
  const name = normalizeName(personInput.value);
  if (!name) return;

  state.people.push({
    id: generateId(),
    name
  });

  personInput.value = "";
  saveState();
  render();
}

function removePerson(id) {
  state.people = state.people.filter(person => person.id !== id);
  saveState();
  render();
}

function addItem() {
  const name = normalizeName(itemInput.value);
  if (!name) return;

  state.items.push({
    id: generateId(),
    name,
    selected: true
  });

  itemInput.value = "";
  saveState();
  render();
}

function removeItem(id) {
  state.items = state.items.filter(item => item.id !== id);
  saveState();
  render();
}

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

function divideItems() {
  const selectedItems = state.items.filter(item => item.selected);

  if (state.people.length < 1) {
    alert("Aggiungi almeno una persona.");
    return;
  }

  if (selectedItems.length < 1) {
    alert("Seleziona almeno un item.");
    return;
  }

  const shuffledItems = shuffleArray(selectedItems);
  const shuffledPeople = shuffleArray(state.people);

  const assignment = {};
  shuffledPeople.forEach(person => {
    assignment[person.name] = [];
  });

  shuffledItems.forEach((item, index) => {
    const person = shuffledPeople[index % shuffledPeople.length];
    assignment[person.name].push(item.name);
  });

  state.lastResultText = formatResult(assignment);
  saveState();
  render();
}

function formatResult(assignment) {
  const lines = [];
  const now = new Date();

  lines.push("Suddivisione casuale");
  lines.push(now.toLocaleString("it-IT"));
  lines.push("");

  Object.entries(assignment).forEach(([personName, items]) => {
    lines.push(`${personName}:`);

    if (items.length === 0) {
      lines.push("- nessun item");
    } else {
      items.forEach(item => lines.push(`- ${item}`));
    }

    lines.push("");
  });

  return lines.join("\n").trim();
}

async function shareResult() {
  if (!state.lastResultText) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Suddivisione item",
        text: state.lastResultText
      });
      return;
    } catch (error) {
      // Se l'utente annulla la condivisione, non serve mostrare errore.
      if (error.name === "AbortError") return;
    }
  }

  const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(state.lastResultText);
  window.open(whatsappUrl, "_blank");
}

async function copyResult() {
  if (!state.lastResultText) return;

  try {
    await navigator.clipboard.writeText(state.lastResultText);
    alert("Testo copiato negli appunti.");
  } catch {
    alert("Non riesco a copiare automaticamente. Seleziona il testo e copialo manualmente.");
  }
}

function clearAllData() {
  const confirmed = confirm("Vuoi davvero cancellare persone, item e ultimo risultato?");
  if (!confirmed) return;

  state.people = [];
  state.items = [];
  state.lastResultText = "";
  localStorage.removeItem(STORAGE_KEY);
  render();
}

addPersonBtn.addEventListener("click", addPerson);
personInput.addEventListener("keydown", event => {
  if (event.key === "Enter") addPerson();
});

addItemBtn.addEventListener("click", addItem);
itemInput.addEventListener("keydown", event => {
  if (event.key === "Enter") addItem();
});

selectAllBtn.addEventListener("click", () => {
  state.items.forEach(item => item.selected = true);
  saveState();
  render();
});

deselectAllBtn.addEventListener("click", () => {
  state.items.forEach(item => item.selected = false);
  saveState();
  render();
});

divideBtn.addEventListener("click", divideItems);
shareBtn.addEventListener("click", shareResult);
copyBtn.addEventListener("click", copyResult);
clearDataBtn.addEventListener("click", clearAllData);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

loadState();
render();
