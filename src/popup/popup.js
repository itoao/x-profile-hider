// X Profile Hider - Popup Script

const toggleSwitch = document.getElementById('toggleSwitch');
const statusText = document.getElementById('statusText');

/**
 * UIの状態を更新する
 * @param {boolean} enabled - 有効/無効の状態
 */
function updateUI(enabled) {
  toggleSwitch.checked = enabled;
  statusText.textContent = enabled ? '有効' : '無効';
  statusText.classList.toggle('enabled', enabled);
}

/**
 * 現在の状態を取得してUIを更新
 */
async function loadCurrentState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    if (response && response.hasOwnProperty('enabled')) {
      updateUI(response.enabled);
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
}

/**
 * トグルスイッチの変更を処理
 */
toggleSwitch.addEventListener('change', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'toggle' });
    if (response && response.hasOwnProperty('enabled')) {
      updateUI(response.enabled);
    }
  } catch (error) {
    console.error('Failed to toggle state:', error);
    loadCurrentState();
  }
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentState();
});