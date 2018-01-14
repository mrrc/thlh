/* global browser */

function updateCount () {
  browser.tabs.query({}).then(function (tabs) {
    browser.browserAction.setBadgeText({ text: tabs.length.toString() });
    browser.browserAction.setBadgeBackgroundColor({ color: 'green' });

    const date = new Date();

    const dateStr = [
      date.getFullYear(),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getDate().toString().padStart(2, '0')
    ].join('-');

    browser.storage.local.get('dates').then(function (stored) {
      if (!stored.dates) {
        stored.dates = {};
      }
      stored.dates[dateStr] = tabs.length;
      browser.storage.local.set({ dates: stored.dates });
    });
  });
}

browser.tabs.onCreated.addListener(updateCount);
browser.tabs.onRemoved.addListener(updateCount);
updateCount();
