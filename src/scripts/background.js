// X Profile Hider - Background Script

// 拡張機能の状態を管理
let extensionState = {
  enabled: true
};

// アイコンパス
const ICONS = {
  enabled: {
    16: 'src/icons/icon-enabled-16.png',
    32: 'src/icons/icon-enabled-32.png',
    48: 'src/icons/icon-enabled-48.png',
    128: 'src/icons/icon-enabled-128.png'
  },
  disabled: {
    16: 'src/icons/icon-16.png',
    32: 'src/icons/icon-32.png',
    48: 'src/icons/icon-48.png',
    128: 'src/icons/icon-128.png'
  }
};

/**
 * ローカルストレージから状態を読み込む
 */
async function loadState() {
  try {
    const result = await chrome.storage.local.get(['enabled']);
    extensionState.enabled = result.enabled !== undefined ? result.enabled : true;
    await updateIcon(extensionState.enabled);
  } catch (error) {
    console.error('Failed to load state:', error);
  }
}

/**
 * ローカルストレージに状態を保存する
 */
async function saveState() {
  try {
    await chrome.storage.local.set({ enabled: extensionState.enabled });
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * 拡張機能アイコンを更新する
 * @param {boolean} enabled - 有効/無効の状態
 */
async function updateIcon(enabled) {
  try {
    // まずバッジを設定（これは常に動作する）
    await chrome.action.setBadgeText({
      text: enabled ? 'ON' : ''
    });
    
    await chrome.action.setBadgeBackgroundColor({
      color: enabled ? '#ff3333' : '#1da1f2'
    });
    
    // アイコンの更新を試行（失敗しても続行）
    try {
      const iconPath = enabled ? ICONS.enabled : ICONS.disabled;
      await chrome.action.setIcon({
        path: iconPath
      });
    } catch (iconError) {
      console.warn('Icon update failed, using badge only:', iconError.message);
      // アイコンが失敗した場合はバッジテキストで状態を明確に表示
      await chrome.action.setBadgeText({
        text: enabled ? 'ON' : 'OFF'
      });
    }
  } catch (error) {
    console.error('Failed to update extension UI:', error);
  }
}

/**
 * 全てのX.comタブに状態変更を通知
 * @param {boolean} hide - プロフィールを非表示にするかどうか
 */
async function notifyAllTabs(hide) {
  const tabs = await chrome.tabs.query({
    url: ['*://x.com/*', '*://twitter.com/*']
  });
  
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleVisibility',
        hide: hide
      });
    } catch (error) {
      console.error(`Failed to send message to tab ${tab.id}:`, error);
    }
  }
}

/**
 * 拡張機能の状態を切り替える
 */
async function toggleState() {
  extensionState.enabled = !extensionState.enabled;
  await saveState();
  await updateIcon(extensionState.enabled);
  await notifyAllTabs(extensionState.enabled);
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  try {
    if (request.action === 'getInitialState') {
      sendResponse({ enabled: extensionState.enabled });
    } else if (request.action === 'toggle') {
      toggleState()
        .then(() => {
          sendResponse({ enabled: extensionState.enabled });
        })
        .catch((error) => {
          console.error('Failed to toggle state:', error);
          sendResponse({ error: error.message });
        });
      return true; // 非同期レスポンスのため
    } else if (request.action === 'getState') {
      sendResponse({ enabled: extensionState.enabled });
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ error: error.message });
  }
});

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // 初回インストール時は有効状態で開始
    extensionState.enabled = true;
    await saveState();
    await updateIcon(true);
  }
});


// 初期化
loadState();