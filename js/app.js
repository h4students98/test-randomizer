const STORAGE_KEY = "item-divider-pwa-state-v2";

const state = {
  people: [],
  groups: [],   // { id, name }
  items: [],    // { id, name, selected, groupId | null }
  lastResultText: ""
};

// ── DOM refs ──────────────────────────────────────────────
const personInput   = document.getElementById("personInput");
const addPersonBtn  = document.getElementById("addPersonBtn");
const peopleList    = document.getElementById("peopleList");

const groupInput    = document.getElementById("groupInput");
const addGroupBtn   = document.getElementById("addGroupBtn");
const groupsList    = document.getElementById("groupsList");

const itemInput     = document.getElementById("itemInput");
const addItemBtn    = document.getElementById("addItemBtn");
const itemsList     = document.getElementById("itemsList");

const selectAllBtn  = document.getElementById("selectAllBtn");
const deselectAllBtn= document.getElementById("deselectAllBtn");

const divideBtn     = document.getElementById("divideBtn");
const resultBox     = document.getElementById("resultBox");
const shareBtn      = document.getElementById("shareBtn");
const copyBtn       = document.getElementById("copyBtn");
const clearDataBtn  = document.getElementById("clearDataBtn");

// ── Utilità ───────────────────────────────────────────────
function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

// ── Persistenza ───────────────────────────────────────────
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    people: state.people,
    groups: state.groups,
    items: state.items,
    lastResultText: state.lastResultText
  }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.people        = Array.isArray(saved.people) ? saved.people : [];
    state.groups        = Array.isArray(saved.groups) ? saved.groups : [];
    state.items         = Array.isArray(saved.items)  ? saved.items  : [];
    state.lastResultText= typeof saved.lastResultText === "string" ? saved.lastResultText : "";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ── Render: Persone ───────────────────────────────────────
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
    const btn = deleteButton(() => { removePerson(person.id); }, `Elimina ${person.name}`);
    li.append(span, btn);
    peopleList.appendChild(li);
  });
}

// ── Render: Gruppi (lista gestione) ──────────────────────
function renderGroups() {
  groupsList.innerHTML = "";
  if (state.groups.length === 0) {
    groupsList.innerHTML = `<li class="list-item"><span>Nessun gruppo creato.</span></li>`;
    return;
  }
  state.groups.forEach(group => {
    const count = state.items.filter(i => i.groupId === group.id).length;
    const li = document.createElement("li");
    li.className = "list-item";
    const span = document.createElement("span");
    span.textContent = `${group.name}`;
    const badge = document.createElement("span");
    badge.className = "item-group-badge";
    badge.textContent = `${count} item`;
    const btn = deleteButton(() => { removeGroup(group.id); }, `Elimina gruppo ${group.name}`);
    li.append(span, badge, btn);
    groupsList.appendChild(li);
  });
}

// ── Render: Item (con gruppi) ─────────────────────────────
function renderItems() {
  itemsList.innerHTML = "";

  if (state.items.length === 0) {
    itemsList.innerHTML = `<li class="list-item"><span>Nessun item aggiunto.</span></li>`;
    return;
  }

  // Raggruppa item per groupId
  const grouped = {};     // groupId -> items[]
  const ungrouped = [];

  state.items.forEach(item => {
    if (item.groupId) {
      if (!grouped[item.groupId]) grouped[item.groupId] = [];
      grouped[item.groupId].push(item);
    } else {
      ungrouped.push(item);
    }
  });

  // Blocchi per ogni gruppo
  state.groups.forEach(group => {
    const groupItems = grouped[group.id] || [];
    if (groupItems.length === 0) return; // nascondi blocco se vuoto

    const block = document.createElement("li");
    block.className = "group-block";

    // Header gruppo
    const header = document.createElement("div");
    header.className = "group-header";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.title = "Seleziona/deseleziona tutti gli item del gruppo";
    // stato checkbox: checked se tutti selezionati, indeterminate se misti
    const allSelected  = groupItems.every(i => i.selected);
    const someSelected = groupItems.some(i => i.selected);
    chk.checked       = allSelected;
    chk.indeterminate = !allSelected && someSelected;

    chk.addEventListener("change", () => {
      groupItems.forEach(i => i.selected = chk.checked);
      saveState();
      renderItems();
    });

    const label = document.createElement("span");
    label.className = "group-checkbox-label";
    label.textContent = "tutti";

    const nameSpan = document.createElement("span");
    nameSpan.className = "group-name";
    nameSpan.textContent = group.name;

    header.append(chk, label, nameSpan);
    block.appendChild(header);

    // Lista item del gruppo
    const ul = document.createElement("ul");
    ul.className = "group-items";
    groupItems.forEach(item => ul.appendChild(itemRow(item)));
    block.appendChild(ul);

    itemsList.appendChild(block);
  });

  // Item senza gruppo
  if (ungrouped.length > 0) {
    if (state.groups.length > 0) {
      const label = document.createElement("p");
      label.className = "ungrouped-label";
      label.textContent = "Senza gruppo";
      itemsList.appendChild(label);
    }
    ungrouped.forEach(item => {
      itemsList.appendChild(itemRow(item));
    });
  }
}

// Crea una riga item (con select gruppo)
function itemRow(item) {
  const li = document.createElement("li");
  li.className = "list-item";

  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = item.selected;
  chk.addEventListener("change", () => {
    item.selected = chk.checked;
    saveState();
    renderItems(); // aggiorna stato indeterminate dei gruppi
  });

  const span = document.createElement("span");
  span.textContent = item.name;

  const controls = [];

  // Se ci sono gruppi, mostra select per assegnare il gruppo
  if (state.groups.length > 0) {
    const sel = document.createElement("select");
    sel.title = "Assegna a un gruppo";

    const optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "—";
    sel.appendChild(optNone);

    state.groups.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      if (item.groupId === g.id) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.style.cssText = "flex:0 0 auto; width:auto; padding:4px 8px; font-size:0.8rem; border-radius:8px;";
    sel.addEventListener("change", () => {
      item.groupId = sel.value || null;
      saveState();
      renderItems();
    });
    controls.push(sel);
  }

  const btn = deleteButton(() => { removeItem(item.id); }, `Elimina ${item.name}`);
  controls.push(btn);

  li.append(chk, span, ...controls);
  return li;
}

// Helper bottone elimina
function deleteButton(onClick, label) {
  const btn = document.createElement("button");
  btn.className = "icon-button";
  btn.textContent = "✕";
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", onClick);
  return btn;
}

function renderResult() {
  resultBox.textContent = state.lastResultText || "Il risultato apparirà qui.";
  shareBtn.disabled = !state.lastResultText;
  copyBtn.disabled  = !state.lastResultText;
}

function render() {
  renderPeople();
  renderGroups();
  renderItems();
  renderResult();
}

// ── Azioni: Persone ───────────────────────────────────────
function addPerson() {
  const name = normalizeName(personInput.value);
  if (!name) return;
  state.people.push({ id: generateId(), name });
  personInput.value = "";
  saveState();
  render();
}

function removePerson(id) {
  state.people = state.people.filter(p => p.id !== id);
  saveState();
  render();
}

// ── Azioni: Gruppi ────────────────────────────────────────
function addGroup() {
  const name = normalizeName(groupInput.value);
  if (!name) return;
  state.groups.push({ id: generateId(), name });
  groupInput.value = "";
  saveState();
  render();
}

function removeGroup(id) {
  // Gli item del gruppo diventano "senza gruppo"
  state.items.forEach(item => {
    if (item.groupId === id) item.groupId = null;
  });
  state.groups = state.groups.filter(g => g.id !== id);
  saveState();
  render();
}

// ── Azioni: Item ──────────────────────────────────────────
function addItem() {
  const name = normalizeName(itemInput.value);
  if (!name) return;
  state.items.push({ id: generateId(), name, selected: true, groupId: null });
  itemInput.value = "";
  saveState();
  render();
}

function removeItem(id) {
  state.items = state.items.filter(i => i.id !== id);
  saveState();
  render();
}

// ── Divisione ─────────────────────────────────────────────
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function divideItems() {
  const selected = state.items.filter(i => i.selected);
  if (state.people.length < 1) { alert("Aggiungi almeno una persona."); return; }
  if (selected.length < 1)     { alert("Seleziona almeno un item.");    return; }

  const shuffledItems  = shuffleArray(selected);
  const shuffledPeople = shuffleArray(state.people);

  const assignment = {};
  shuffledPeople.forEach(p => assignment[p.name] = []);
  shuffledItems.forEach((item, i) => {
    assignment[shuffledPeople[i % shuffledPeople.length].name].push(item.name);
  });

  state.lastResultText = formatResult(assignment);
  saveState();
  render();
}

function formatResult(assignment) {
  const lines = [];
  const now   = new Date();
  lines.push("Suddivisione casuale");
  lines.push(now.toLocaleString("it-IT"));
  lines.push("");
  Object.entries(assignment).forEach(([name, items]) => {
    lines.push(`${name}:`);
    items.length === 0
      ? lines.push("- nessun item")
      : items.forEach(item => lines.push(`- ${item}`));
    lines.push("");
  });
  return lines.join("\n").trim();
}

// ── Condivisione ──────────────────────────────────────────
async function shareResult() {
  if (!state.lastResultText) return;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Suddivisione item", text: state.lastResultText });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(state.lastResultText), "_blank");
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
  if (!confirm("Vuoi davvero cancellare persone, gruppi, item e ultimo risultato?")) return;
  state.people = []; state.groups = []; state.items = []; state.lastResultText = "";
  localStorage.removeItem(STORAGE_KEY);
  render();
}

// ── Event listeners ───────────────────────────────────────
addPersonBtn.addEventListener("click", addPerson);
personInput.addEventListener("keydown", e => { if (e.key === "Enter") addPerson(); });

addGroupBtn.addEventListener("click", addGroup);
groupInput.addEventListener("keydown", e => { if (e.key === "Enter") addGroup(); });

addItemBtn.addEventListener("click", addItem);
itemInput.addEventListener("keydown", e => { if (e.key === "Enter") addItem(); });

selectAllBtn.addEventListener("click", () => {
  state.items.forEach(i => i.selected = true);
  saveState(); render();
});
deselectAllBtn.addEventListener("click", () => {
  state.items.forEach(i => i.selected = false);
  saveState(); render();
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
