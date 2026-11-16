const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const createNavigation = require('../dist/responsive-nav.js');

function fixture(width, headerHeight = 196) {
  const classes = new Set();
  const styles = new Map();
  const attributes = new Map([['aria-expanded', 'false'], ['aria-label', 'Open navigation']]);
  const sidebar = {
    classList: {
      toggle(name, force) {
        if (force) classes.add(name); else classes.delete(name);
      },
      contains: name => classes.has(name)
    },
    style: { setProperty: (key, value) => styles.set(key, value) }
  };
  const button = { setAttribute: (key, value) => attributes.set(key, value) };
  const topbar = { getBoundingClientRect: () => ({ bottom: headerHeight }) };
  const documentRef = { querySelector: selector => ({ '.sidebar': sidebar, '[data-action="menu"]': button, '.topbar': topbar })[selector] };
  let currentWidth = width;
  const windowRef = { matchMedia: () => ({ matches: currentWidth <= 720 }) };
  return { navigation: createNavigation(documentRef, windowRef), classes, styles, attributes, sidebar, topbar, setWidth: value => { currentWidth = value; } };
}

test('mobile menu starts below the measured header at narrow phone widths', () => {
  for (const width of [320, 360, 375, 390, 430]) {
    const headerHeight = width <= 360 ? 214 : width <= 390 ? 198 : 176;
    const ui = fixture(width, headerHeight);
    ui.navigation.toggle();
    assert.equal(ui.sidebar.classList.contains('mobile-open'), true, `${width}px drawer opens`);
    assert.equal(ui.styles.get('--mobile-nav-top'), `${headerHeight}px`, `${width}px drawer clears the wrapped header`);
    assert.equal(ui.attributes.get('aria-expanded'), 'true');
    assert.equal(ui.attributes.get('aria-label'), 'Close navigation');
  }
});

test('menu close syncs accessible state and resize recalculates or closes the drawer', () => {
  const ui = fixture(390, 200);
  ui.navigation.toggle();
  ui.topbar.getBoundingClientRect = () => ({ bottom: 224 });
  ui.navigation.updateOffset();
  assert.equal(ui.styles.get('--mobile-nav-top'), '224px');
  ui.navigation.close();
  assert.equal(ui.sidebar.classList.contains('mobile-open'), false);
  assert.equal(ui.attributes.get('aria-expanded'), 'false');
  assert.equal(ui.attributes.get('aria-label'), 'Open navigation');
  ui.navigation.toggle();
  ui.setWidth(768);
  ui.navigation.updateOffset();
  assert.equal(ui.sidebar.classList.contains('mobile-open'), false, 'crossing the mobile breakpoint closes the drawer');
  assert.equal(ui.attributes.get('aria-expanded'), 'false');
});

test('desktop and tablet widths do not open the mobile drawer', () => {
  for (const width of [768, 900, 1024, 1280]) {
    const ui = fixture(width);
    ui.navigation.toggle();
    assert.equal(ui.sidebar.classList.contains('mobile-open'), true);
    assert.equal(ui.styles.has('--mobile-nav-top'), false, `${width}px does not apply a mobile offset`);
  }
});

test('responsive navigation has viewport rules and accessible controls', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
  assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.match(html, /id="primary-navigation"/);
  assert.match(html, /aria-controls="primary-navigation" aria-expanded="false"/);
  assert.match(html, /\.sidebar\.mobile-open\{[^}]*top:var\(--mobile-nav-top,0px\)/);
  assert.doesNotMatch(html, /\.sidebar\.mobile-open\{[^}]*top:calc\(162px/);
  assert.match(html, /@media \(max-width:720px\)/);
  assert.match(html, /@media \(min-width:721px\) and \(max-width:900px\)/);
});
