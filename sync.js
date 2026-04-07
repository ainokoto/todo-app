/**
 * sync.js — デバイス間同期プロバイダー（GitHub Gist実装）
 *
 * インターフェース:
 *   syncProvider.save(todos)  → クラウドにデータを保存
 *   syncProvider.load()       → クラウドからデータを読み込み
 *
 * 将来 Firebase / Supabase に切り替える場合はこのファイルだけ差し替える。
 * getConfig() / saveConfig() の実装も新プロバイダーに合わせて変更すること。
 */

const syncProvider = (() => {
  const FILENAME = 'todo-app-data.json';
  const KEY_PAT = 'sync_pat';
  const KEY_GIST_ID = 'sync_gist_id';

  function getConfig() {
    return {
      pat: localStorage.getItem(KEY_PAT) || '',
      gistId: localStorage.getItem(KEY_GIST_ID) || '',
    };
  }

  function saveConfig(pat, gistId) {
    localStorage.setItem(KEY_PAT, pat);
    localStorage.setItem(KEY_GIST_ID, gistId);
  }

  /**
   * todos: タスク配列を GitHub Gist に保存する
   * @param {Array} todos
   * @returns {Promise<void>}
   */
  async function save(todos) {
    const { pat, gistId } = getConfig();
    if (!pat || !gistId) throw new Error('PATとGist IDを設定してください');

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${pat}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        files: {
          [FILENAME]: { content: JSON.stringify(todos, null, 2) },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `保存失敗 (HTTP ${res.status})`);
    }
  }

  /**
   * GitHub Gist からタスク配列を読み込む
   * @returns {Promise<Array>}
   */
  async function load() {
    const { pat, gistId } = getConfig();
    if (!pat || !gistId) throw new Error('PATとGist IDを設定してください');

    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `読み込み失敗 (HTTP ${res.status})`);
    }

    const data = await res.json();
    const file = data.files[FILENAME];
    if (!file) throw new Error(`Gist内に "${FILENAME}" が見つかりません`);

    const parsed = JSON.parse(file.content);
    if (!Array.isArray(parsed)) throw new Error('Gistのデータ形式が不正です');
    return parsed;
  }

  return { save, load, getConfig, saveConfig };
})();
