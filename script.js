'use strict';

/* ---------- State ---------- */
const STORAGE_KEY = 'taskboard.tasks.v1';
const THEME_KEY = 'taskboard.theme';

let tasks = load();        // [{ id, text, completed, createdAt }]
let filter = 'all';        // 'all' | 'active' | 'completed'
let editingId = null;      // id of the task currently in edit mode

/* ---------- DOM refs ---------- */
const $ = (id) => document.getElementById(id);
const form = $('addForm'), input = $('taskInput'), errorEl = $('error');
const listEl = $('taskList'), emptyEl = $('empty'), counterEl = $('counter');

/* ---------- Persistence ---------- */
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch { return []; }               // corrupted JSON or storage blocked
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* storage full/blocked */ }
}

/* ---------- Helpers ---------- */
// Friendly timestamp, e.g. "Oct 1, 3:42 PM"
const fmt = (ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Create elements with textContent (never innerHTML) so user text can't inject HTML
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/* ---------- Render: builds the DOM entirely from state ---------- */
function render() {
  const visible = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed);

  listEl.replaceChildren(...visible.map(buildItem));

  // Empty state message depends on whether tasks exist at all or just none in this filter
  emptyEl.hidden = visible.length > 0;
  emptyEl.textContent = tasks.length === 0
    ? 'No tasks yet. Add your first one above.'
    : `No ${filter} tasks.`;

  // Counter + clear button + filter highlight
  const left = tasks.filter((t) => !t.completed).length;
  counterEl.textContent = `${left} ${left === 1 ? 'item' : 'items'} left`;
  $('clearCompleted').disabled = left === tasks.length;
  document.querySelectorAll('.filter').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.filter === filter));
}

function buildItem(t) {
  const li = el('li', { className: 'item' + (t.completed ? ' is-done' : '') });
  li.dataset.id = t.id;

  const check = el('input', { type: 'checkbox', className: 'item__check', checked: t.completed });
  check.dataset.action = 'toggle';
  check.setAttribute('aria-label', `Mark "${t.text}" as ${t.completed ? 'active' : 'completed'}`);

  const body = el('div', { className: 'item__body' });
  if (editingId === t.id) {
    const edit = el('input', { className: 'item__edit', value: t.text, maxLength: 120 });
    edit.dataset.role = 'edit';
    body.append(edit);
    queueMicrotask(() => edit.focus());     // focus after it is attached to the DOM
  } else {
    body.append(el('div', { className: 'item__text' }, t.text));
  }
  body.append(el('div', { className: 'item__meta' },
    el('span', { className: 'badge' }, t.completed ? 'Completed' : 'Active'),
    el('span', {}, fmt(t.createdAt))));

  const actions = el('div', { className: 'item__actions' });
  const editBtn = el('button', { className: 'act', title: 'Edit', ariaLabel: 'Edit task' }, editingId === t.id ? 'Save' : 'Edit');
  editBtn.dataset.action = editingId === t.id ? 'save' : 'edit';
  const delBtn = el('button', { className: 'act', title: 'Delete', ariaLabel: 'Delete task' }, 'Delete');
  delBtn.dataset.action = 'delete';
  actions.append(editBtn, delBtn);

  li.append(check, body, actions);
  return li;
}

/* ---------- Actions (each mutates state, saves, re-renders) ---------- */
function addTask(text) {
  tasks.unshift({ id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() });
  commit();
}
function toggleTask(id) {
  const t = tasks.find((x) => x.id === id);
  if (t) t.completed = !t.completed;
  commit();
}
function deleteTask(id) { tasks = tasks.filter((t) => t.id !== id); commit(); }
function saveEdit(id, text) {
  text = text.trim();
  if (!text) return deleteTask(id);         // clearing the text removes the task
  const t = tasks.find((x) => x.id === id);
  if (t) t.text = text;
  editingId = null;
  commit();
}
function clearCompleted() { tasks = tasks.filter((t) => !t.completed); commit(); }
function commit() { save(); render(); }

/* ---------- Events ---------- */
// Create, with validation
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  errorEl.hidden = text.length > 0;
  if (!text) return input.focus();
  addTask(text);
  input.value = '';
  input.focus();
});
input.addEventListener('input', () => (errorEl.hidden = true));

// Event delegation: ONE click listener on the list handles toggle / edit / save / delete
listEl.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const id = target.closest('.item').dataset.id;
  switch (target.dataset.action) {
    case 'toggle': toggleTask(id); break;
    case 'delete': deleteTask(id); break;
    case 'edit': editingId = id; render(); break;
    case 'save': saveEdit(id, listEl.querySelector('[data-role="edit"]').value); break;
  }
});

// Delegated keyboard support inside the inline editor: Enter saves, Escape cancels
listEl.addEventListener('keydown', (e) => {
  if (e.target.dataset.role !== 'edit') return;
  const id = e.target.closest('.item').dataset.id;
  if (e.key === 'Enter') saveEdit(id, e.target.value);
  if (e.key === 'Escape') { editingId = null; render(); }
});

// Filters (delegated on the nav)
$('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  render();
});

$('clearCompleted').addEventListener('click', clearCompleted);

/* ---------- Theme: saved choice, else the OS preference ---------- */
function applyTheme(theme) { document.documentElement.dataset.theme = theme; }
const stored = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
applyTheme(stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

$('themeToggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
});

/* ---------- Boot ---------- */
render();
