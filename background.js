// Background service worker (currently minimal). Kept for future features like commands, keyboard shortcuts, and sync handling.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Autofill Anywhere installed');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

