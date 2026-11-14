const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const dist = path.join(__dirname, '../dist');

test('connected household routes an underwriting referral and restores the seed', async () => {
  const storage = new Map();
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(dist, 'connected-workflow.js'), 'utf8'), {
    window, crypto, structuredClone, confirm: () => true, alert: assert.fail,
    localStorage: {getItem: key => storage.get(key), setItem: (key, val) => storage.set(key, val), removeItem: key => storage.delete(key)},
    fetch: async file => ({ok: true, text: async () => fs.readFileSync(path.join(dist,file),'utf8')})
  });
  const container = {dataset: {}, innerHTML: ''};
  async function open(role) {
    container.dataset.connectedRole = role;
    await window.cedarConnected.mount(container, role);
  }
  function step(label, record) {
    const action = Array.from(container.innerHTML.matchAll(/data-connected-step="(\d+)" data-record="([^"]+)">([^<]+)/g))
      .find(match => match[2] === record && match[3] === label);
    assert.ok(action, label);
    container.onclick({target:{closest:()=>({dataset:{connectedStep:action[1],record},hasAttribute:()=>false})}});
  }
  await open('Customer');
  assert.match(container.innerHTML, /PNI/);
  assert.match(container.innerHTML, /Subaru Crosstrek/);
  await open('Underwriter');
  step('Request roof evidence', 'HOME-3');
  await open('Customer');
  assert.match(container.innerHTML, /Evidence requested/);
  step('Provide sample roof evidence', 'HOME-3');
  await open('Underwriter');
  step('Clear seasonal home referral', 'HOME-3');
  await open('Producer');
  assert.match(container.innerHTML, /Present the seasonal home quote/);
  await open('Product Admin');
  assert.match(container.innerHTML, /Portfolio monitoring/);
  assert.doesNotMatch(container.innerHTML, /Dwelling limit/);
  await open('Customer');
  container.onclick({target:{closest:()=>({hasAttribute:name=>name==='data-connected-reset'})}});
  await open('Underwriter');
  assert.match(container.innerHTML, /Request roof evidence/);
});
