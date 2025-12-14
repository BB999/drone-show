// ユーティリティ関数

// 情報表示の更新
export function updateInfo(text) {
  const info = document.getElementById('info');
  if (info) {
    info.textContent = text;
  }
  console.log('[INFO]', text);
}
