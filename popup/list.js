/* global browser */

/**
 * Namespace for SVG elements
 */
const svgns = 'http://www.w3.org/2000/svg';

/**
 * Creates SVG <circle> element on given coordinates with given text visible
 * when hovering over the object with mouse.
 *
 * @param {number} x - X value
 * @param {number} y - Y value
 * @param {string} text - text that will be visible when hovering over
 * @returns Element
 */
function createCircle (x, y, text) {
  const circle = document.createElementNS(svgns, 'circle');
  circle.setAttribute('r', 2);
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('fill', '#0074d9');
  circle.setAttribute('stroke', '#000');

  const title = document.createElementNS(svgns, 'title');
  title.appendChild(document.createTextNode(text));
  circle.appendChild(title);

  return circle;
}

function activateTabsTab () {
  const list = document.getElementById('tab-tabs-content');

  if (list.childNodes.length > 3) {
    displayContent('tabs');
    return;
  }

  browser.tabs.query({}).then(function (tabs) {
    document.getElementById('total-count').innerHTML = '';
    document.getElementById('total-count').appendChild(document.createTextNode(tabs.length));

    for (const tab of tabs) {
      list.appendChild(createListItem(tab));
    }
    displayContent('tabs');
  });
}

function createListItem (tab) {
  const item = document.createElement('div');
  item.classList.add('panel-list-item');
  item.dataset.tabId = tab.id;

  const icon = document.createElement('img');
  icon.setAttribute('src', tab.favIconUrl);

  const text = document.createElement('div');
  text.classList.add('text');
  text.appendChild(icon);
  text.appendChild(document.createTextNode(tab.title));
  text.setAttribute('title', tab.title);
  item.appendChild(text);

  const date = document.createElement('div');
  date.classList.add('text-shortcut');
  date.innerHTML = '';
  date.setAttribute('title', `Last accessed on ${new Date(tab.lastAccessed).toString()}`);
  date.appendChild(document.createTextNode(dateDiff(tab.lastAccessed)));
  item.appendChild(date);

  item.addEventListener('click', activateTab);

  return item;
}

function activateTab () {
  const tabId = Number(this.dataset.tabId);
  if (isNaN(tabId)) {
    return;
  }
  browser.tabs.update(tabId, { active: true });
}

function dateDiff (date) {
  const seconds = ((Date.now() - date) / 1000).toFixed(0);
  const values = [];

  [
    ['wk', 604800],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1]
  ].reduce(function (secs, cur) {
    const counted = Math.floor(secs / cur[1]);
    if (counted > 0) {
      values.push(`${counted}${cur[0]}`);
      secs = secs % cur[1];
    }
    return secs;
  }, seconds);

  const metrics = 2;
  let text = values.slice(0, metrics).join(' ');
  if (values.length > metrics) {
    text += '+';
  }
  return text;
}

// days tab
function activateDaysTab () {
  browser.storage.local.get('dates').then(function (dates) {
    listDays(dates.dates);
  });
}

function listDays (dates) {
  const content = document.getElementById('tab-days-content');

  if (content.childNodes.length > 1) {
    displayContent('days');
    return;
  }

  Object.keys(dates).forEach(function (date) {
    content.appendChild(createDateItem(date, dates[date]));
  });

  paintTrendGraph(dates);
  displayContent('days');
}

// TODO?: space out all values
// TODO: add all values as scrollable (if some points do not fit)
function paintTrendGraph (dates) {
  const height = 100;
  const width = 500;
  const spacer = 5;
  const maxPoints = Math.ceil(width / spacer);

  const linePoints = [];
  let skip = 0;
  let values = Object.values(dates);
  if (values.length > maxPoints) {
    skip = values.length - maxPoints;
    values = values.slice(maxPoints * -1);
  }

  const maxValue = Math.max(...values);
  const ratio = height / maxValue;
  const trendPoints = document.getElementById('trend-points');
  let i = 0;
  for (const date in dates) {
    if (skip > 0) {
      skip--;
      continue;
    }

    const value = dates[date];
    const x = i * spacer;
    const y = height - Math.round(value * ratio);

    linePoints.push([x, y].join(','));
    trendPoints.appendChild(createCircle(x, y, `${date}: ${value}`));

    i++;
  }

  // for testing
  // for (let x = 0; x <= width; x += spacer) {
  //   linePoints.push(`${x},${(Math.random() * 1000 % height).toFixed()}`);
  // }

  document.getElementById('trend-line')
    .setAttribute('points', linePoints.join(' '));
}

function createDateItem (date, count) {
  const item = document.createElement('div');
  item.classList.add('panel-list-item');

  const text = document.createElement('div');
  text.classList.add('text');
  text.appendChild(document.createTextNode(date));
  item.appendChild(text);

  const counter = document.createElement('div');
  counter.classList.add('text-shortcut');
  counter.appendChild(document.createTextNode(count));
  item.appendChild(counter);

  return item;
}

function displayContent (type) {
  if (!['tabs', 'days'].includes(type)) {
    return;
  }

  // buttons
  for (const item of document.querySelectorAll('.panel-section-tabs-button')) {
    item.classList.remove('selected');
  }
  document.getElementById(`tab-${type}-button`).classList.add('selected');

  // content
  for (const item of document.querySelectorAll('.panel-section-list')) {
    item.classList.add('hidden');
  }
  document.getElementById(`tab-${type}-content`).classList.remove('hidden');
}

// event listeners
document.getElementById('tab-tabs-button').addEventListener('click', activateTabsTab);
document.getElementById('tab-days-button').addEventListener('click', activateDaysTab);

activateTabsTab();
