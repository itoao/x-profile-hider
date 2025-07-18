// X Profile Hider - Content Script

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
      profileContainer.style.display = 'none';
      profileContainer.classList.add('x-profile-hider-hidden');
    } else {
      profileContainer.style.display = '';
      profileContainer.classList.remove('x-profile-hider-hidden');
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
/**
 * DOM要素の出現を待機する
 * @param {string} selector - 待機するセレクタ
 * @param {number} timeout - タイムアウト時間（ミリ秒）
 * @returns {Promise<Element|null>}
 */
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * 汎用的なX.com DOM探索
 */
function exploreDOM() {
  // 基本的な構造要素を確認（ログなし）
  const body = document.body;
  const mainContainers = document.querySelectorAll('div[id], main, [role="main"]');
  const navElements = document.querySelectorAll('nav, [role="navigation"]');
  const testidElements = document.querySelectorAll('[data-testid]');
  const imgElements = document.querySelectorAll('img[src*="profile"], img[alt*="profile"], img[alt*="avatar"]');
  const linkElements = document.querySelectorAll('a[href*="profile"], a[href*="settings"]');
}

async function init() {
  try {
    // DOM探索
    exploreDOM();
    
    // X.comのメイン構造が読み込まれるまで待機
    const mainSelectors = [
      'nav[role="navigation"]',
      '[data-testid="sidebarColumn"]', 
      '[data-testid="primaryColumn"]',
      'main',
      '#react-root'
    ];
    
    let foundElement = null;
    for (const selector of mainSelectors) {
      foundElement = await waitForElement(selector, 5000);
      if (foundElement) {
        break;
      }
    }
    
    // 初期状態を取得
    chrome.runtime.sendMessage({ action: 'getInitialState' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to get initial state:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.enabled) {
        toggleProfileVisibility(true);
      }
    });

    // DOM変更の監視を開始
    observeChanges();
    
    // 定期的に要素をチェック（フォールバック）
    setInterval(() => {
      const profileContainer = findProfileElement(PROFILE_SELECTORS.container);
      if (isHidden && profileContainer) {
        if (profileContainer.style.visibility !== 'hidden') {
          toggleProfileVisibility(true);
        }
      }
    }, 3000);
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

console.log('X Profile Hider: Content script loaded');

// グローバルテスト関数を追加
window.testProfileHider = {
  hide: () => {
    console.log('Manual test: Hiding profile');
    toggleProfileVisibility(true);
  },
  show: () => {
    console.log('Manual test: Showing profile');
    toggleProfileVisibility(false);
  },
  findElement: () => {
    const element = findProfileElement(PROFILE_SELECTORS.container);
    console.log('Manual test: Found element:', element);
    return element;
  },
  getStatus: () => {
    console.log('Manual test: Current status:', { isHidden, profileElementCache });
    return { isHidden, profileElementCache };
  },
  directHide: () => {
    console.log('Direct test: Hiding profile');
    const element = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (element) {
      element.style.display = 'none';
      console.log('Direct test: Applied display none');
    }
  },
  directShow: () => {
    console.log('Direct test: Showing profile');
    const element = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (element) {
      element.style.display = '';
      console.log('Direct test: Removed display none');
    }
  }
};

// ページが読み込まれたら初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}