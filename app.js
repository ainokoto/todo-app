const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const emptyMsg = document.getElementById('empty-message');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateEmptyMessage() {
  emptyMsg.style.display = tasks.length === 0 ? 'block' : 'none';
}

function renderTasks() {
  list.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => toggleTask(index));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.title = '削除';
    delBtn.addEventListener('click', () => deleteTask(index));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
  updateEmptyMessage();
}

function addTask() {
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ text, done: false });
  saveTasks();
  renderTasks();
  input.value = '';
  input.focus();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

addBtn.addEventListener('click', addTask);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// ── 同期UI ──────────────────────────────────────────
const settingsToggle = document.getElementById('settings-toggle');
const syncSettings = document.getElementById('sync-settings');
const patInput = document.getElementById('pat-input');
const gistIdInput = document.getElementById('gist-id-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const syncSaveBtn = document.getElementById('sync-save-btn');
const syncLoadBtn = document.getElementById('sync-load-btn');
const syncStatus = document.getElementById('sync-status');

// 保存済み設定を復元
(function restoreConfig() {
  const { pat, gistId } = syncProvider.getConfig();
  if (pat) patInput.value = pat;
  if (gistId) gistIdInput.value = gistId;
})();

settingsToggle.addEventListener('click', () => {
  const expanded = settingsToggle.getAttribute('aria-expanded') === 'true';
  settingsToggle.setAttribute('aria-expanded', String(!expanded));
  syncSettings.hidden = expanded;
});

saveSettingsBtn.addEventListener('click', () => {
  const pat = patInput.value.trim();
  const gistId = gistIdInput.value.trim();
  syncProvider.saveConfig(pat, gistId);
  setStatus('設定を保存しました', 'success');
});

function setStatus(msg, type) {
  syncStatus.textContent = msg;
  syncStatus.className = 'sync-status' + (type ? ' ' + type : '');
}

function setSyncBusy(busy) {
  syncSaveBtn.disabled = busy;
  syncLoadBtn.disabled = busy;
}

syncSaveBtn.addEventListener('click', async () => {
  setSyncBusy(true);
  setStatus('保存中...', '');
  try {
    await syncProvider.save(tasks);
    const now = new Date().toLocaleString('ja-JP');
    setStatus(`保存完了 (${now})`, 'success');
  } catch (e) {
    setStatus(`エラー: ${e.message}`, 'error');
  } finally {
    setSyncBusy(false);
  }
});

syncLoadBtn.addEventListener('click', async () => {
  setSyncBusy(true);
  setStatus('読み込み中...', '');
  try {
    const loaded = await syncProvider.load();
    tasks = loaded;
    saveTasks();
    renderTasks();
    const now = new Date().toLocaleString('ja-JP');
    setStatus(`読み込み完了 (${now})`, 'success');
  } catch (e) {
    setStatus(`エラー: ${e.message}`, 'error');
  } finally {
    setSyncBusy(false);
  }
});

renderTasks();
