// シンプルなテスト用コンテンツスクリプト
console.log('🚀 Test Content Script Loaded!');
console.log('Current URL:', window.location.href);
console.log('Document title:', document.title);

// ページに視覚的な確認要素を追加
const testDiv = document.createElement('div');
testDiv.id = 'twitter-profile-hider-test';
testDiv.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: red;
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 9999;
  font-family: Arial, sans-serif;
  font-size: 12px;
`;
testDiv.textContent = 'Twitter Profile Hider: Script Loaded!';
document.body.appendChild(testDiv);

// 3秒後に削除
setTimeout(() => {
  if (testDiv.parentNode) {
    testDiv.parentNode.removeChild(testDiv);
  }
}, 3000);

// Chrome APIテスト
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Chrome APIs available');
  chrome.runtime.sendMessage({ action: 'test' }, (response) => {
    console.log('Background script response:', response);
  });
} else {
  console.log('Chrome APIs not available');
}