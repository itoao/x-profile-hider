// Twitter Profile Hider - Content Script

const PROFILE_SELECTORS = {
  // X.com/Twitter左下のプロフィール要素のセレクタ
  // 複数のセレクタを試行して、X.comのインターフェース変更に対応
  container: [
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    'div[aria-label="Account menu"]',
    'a[data-testid="SideNav_AccountSwitcher_Button"]',
    // より汎用的なセレクタ
    'nav[role="navigation"] a[href="/settings"]',
    'nav[role="navigation"] a[href*="/profile"]',
    // 構造的なセレクタ（最後の手段）
    'div[data-testid="sidebarColumn"] > div > div:last-child',
    'aside nav > div:last-child',
    'nav[aria-label*="Primary"] > div:last-child'
  ],
  // より特定的なセレクタ（アイコン、名前、ID）
  profileIcon: [
    '[data-testid="SideNav_AccountSwitcher_Button"] img',
    'div[aria-label="Account menu"] img',
    'a[data-testid="SideNav_AccountSwitcher_Button"] img',
    'nav[role="navigation"] img[alt*="profile"]',
    'img[alt*="Profile"]'
  ],
  userName: [
    '[data-testid="SideNav_AccountSwitcher_Button"] span',
    'div[aria-label="Account menu"] span',
    'a[data-testid="SideNav_AccountSwitcher_Button"] span'
  ],
  userId: [
    '[data-testid="SideNav_AccountSwitcher_Button"] div[dir] span',
    'div[aria-label="Account menu"] div[dir] span',
    'a[data-testid="SideNav_AccountSwitcher_Button"] div[dir] span'
  ]
};

let isHidden = false;
let profileElementCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5秒間キャッシュ

/**
 * プロフィール要素を見つける（キャッシュ付き）
 * @param {string[]} selectors - 試行するセレクタの配列
 * @returns {Element|null} - 見つかった要素、または null
 */
function findProfileElement(selectors) {
  // キャッシュが有効な場合は返す
  const now = Date.now();
  if (profileElementCache && (now - cacheTimestamp) < CACHE_DURATION) {
    // 要素がまだDOMに存在するか確認
    if (document.contains(profileElementCache)) {
      return profileElementCache;
    }
  }
  
  // 新しく要素を探す
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        profileElementCache = element;
        cacheTimestamp = now;
        return element;
      }
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e);
    }
  }
  
  profileElementCache = null;
  return null;
}

/**
 * プロフィール情報を非表示/表示する
 * @param {boolean} hide - true で非表示、false で表示
 */
function toggleProfileVisibility(hide) {
  const profileContainer = findProfileElement(PROFILE_SELECTORS.container);
  
  if (profileContainer) {
    if (hide) {
      profileContainer.style.opacity = '0';
      profileContainer.style.pointerEvents = 'none';
      profileContainer.style.visibility = 'hidden';
    } else {
      profileContainer.style.opacity = '';
      profileContainer.style.pointerEvents = '';
      profileContainer.style.visibility = '';
    }
    isHidden = hide;
    console.log(`Profile visibility: ${hide ? 'hidden' : 'visible'}`);
  } else {
    console.warn('Profile element not found');
  }
}

/**
 * DOMの変更を監視して、動的に追加される要素に対応
 */
function observeChanges() {
  let debounceTimer;
  
  const observer = new MutationObserver((_mutations) => {
    if (isHidden) {
      // デバウンスを使用して過度な再適用を防ぐ
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const profileContainer = findProfileElement(PROFILE_SELECTORS.container);
        if (profileContainer && profileContainer.style.visibility !== 'hidden') {
          toggleProfileVisibility(true);
        }
      }, 100);
    }
  });

  try {
    // より具体的なターゲットを観察してパフォーマンスを向上
    const targetNode = document.querySelector('main') || document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  } catch (error) {
    console.error('Failed to start observing DOM changes:', error);
  }
}

/**
 * バックグラウンドスクリプトからのメッセージを処理
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  try {
    if (request.action === 'toggleVisibility') {
      toggleProfileVisibility(request.hide);
      sendResponse({ success: true, hidden: request.hide });
    } else if (request.action === 'getStatus') {
      sendResponse({ hidden: isHidden });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

/**
 * 初期化処理
 */
function init() {
  console.log('Twitter Profile Hider: Initializing...');
  try {
    // まず要素を探してみる
    const profileContainer = findProfileElement(PROFILE_SELECTORS.container);
    console.log('Profile container found:', profileContainer);
    
    // 初期状態を取得
    console.log('Twitter Profile Hider: Requesting initial state...');
    chrome.runtime.sendMessage({ action: 'getInitialState' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to get initial state:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Initial state response:', response);
      if (response && response.enabled) {
        console.log('Extension is enabled, hiding profile');
        toggleProfileVisibility(true);
      }
    });

    // DOM変更の監視を開始
    console.log('Twitter Profile Hider: Starting DOM observation...');
    observeChanges();
    
    // 定期的に要素をチェック（フォールバック）
    let checkInterval;
    checkInterval = setInterval(() => {
      if (isHidden) {
        const profileContainer = findProfileElement(PROFILE_SELECTORS.container);
        if (profileContainer && profileContainer.style.visibility !== 'hidden') {
          toggleProfileVisibility(true);
        }
      } else if (!isHidden && checkInterval) {
        // 非表示でない場合は、パフォーマンス向上のためインターバルをクリア
        clearInterval(checkInterval);
      }
    }, 3000); // 3秒に延長してパフォーマンスを向上
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

// デバッグ用ログ
console.log('Twitter Profile Hider: Content script loaded');
console.log('Document ready state:', document.readyState);
console.log('Current URL:', window.location.href);

// ページが読み込まれたら初期化
if (document.readyState === 'loading') {
  console.log('Twitter Profile Hider: Waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('Twitter Profile Hider: Document already ready, initializing immediately');
  init();
}