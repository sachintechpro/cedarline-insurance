(() => {
  const key = 'cedarline-connected-account-v1';
  const roles = ['Customer', 'Producer', 'Underwriter', 'Claims Adjuster', 'Product Admin'];
  const tables = ['people', 'assets', 'records', 'tasks'];
  const scenarios = [
    ['Customer','AUTO','Renewal offered','Accept auto renewal','Renewal accepted','Producer','Customer accepted the auto renewal. Confirm the new term.'],
    ['Producer','LAND-2','Renewal offered','Send landlord renewal reminder','Reminder sent','Customer','Your landlord renewal is ready. Confirm occupancy details with your producer.'],
    ['Producer','LAND-3','Draft','Submit landlord application','Underwriting review','Underwriter','Review occupancy and rental eligibility.'],
    ['Underwriter','LAND-3','Underwriting review','Clear landlord referral','Quote ready','Producer','Landlord eligibility cleared. Present the quote.'],
    ['Customer','HOME-2','Awaiting signature','Sign quote acceptance','Bind pending','Producer','Signature recorded. Verify effective date and bind requirements.'],
    ['Producer','HOME-2','Bind pending','Complete sample home bind','Active','Customer','Your secondary home policy has been issued in the demo.'],
    ['Underwriter','HOME-3','Underwriting review','Request roof evidence','Evidence requested','Producer','Obtain roof documentation for seasonal home referral.','Customer'],
    ['Customer','HOME-3','Evidence requested','Provide sample roof evidence','Evidence received','Underwriter','Roof evidence is available for review.'],
    ['Underwriter','HOME-3','Evidence received','Clear seasonal home referral','Quote ready','Producer','Referral cleared. Present the seasonal home quote.','Customer'],
    ['Producer','TRAVEL','Bind pending','Verify storage and complete camper bind','Active','Customer','Your camper policy has been issued in the demo.'],
    ['Customer','INV-01','Due','Pay sample installment','Paid','Customer','Payment posted to the demo billing record.'],
    ['Claims Adjuster','CL-01','Assigned','Request repair estimate','Estimate requested','Customer','Please provide a repair estimate for the Highlander claim.'],
    ['Customer','CL-01','Estimate requested','Submit sample estimate','Estimate received','Claims Adjuster','Customer supplied a repair estimate. Review it.'],
    ['Claims Adjuster','CL-01','Estimate received','Record estimate review','In review','Customer','Your repair estimate is in review.'],
    ['Claims Adjuster','*','Reported','Assign claim for review','Assigned','Customer','An adjuster has been assigned to your reported loss.'],
    ['Claims Adjuster','*','Assigned','Request estimate','Estimate requested','Customer','Please provide a repair estimate.'],
    ['Customer','*','Estimate requested','Submit estimate','Estimate received','Claims Adjuster','A sample estimate is ready for review.'],
    ['Claims Adjuster','*','Estimate received','Complete initial review','In review','Customer','Your estimate is in review.'],
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function parseCsv(input) {
    const [header, ...lines] = input.trim().split(/\r?\n/);
    const fields = header.split(',');
    return lines.map(line => {
      const values = line.split(',');
      if (values.length !== fields.length) throw new Error('Invalid seed CSV row');
      return Object.fromEntries(fields.map((field, index) => [field, values[index]]));
    });
  }
  let seedPromise;
  function loadSeed() {
    seedPromise ||= Promise.all(tables.map(async name => {
      const response = await fetch('connected-data/' + name + '.csv');
      if (!response.ok) throw new Error('Could not load ' + name);
      return [name, parseCsv(await response.text())];
    })).then(Object.fromEntries).catch(error => { seedPromise = null; throw error; });
    return seedPromise;
  }
  function saved(seed) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(value?.records) && Array.isArray(value?.tasks)) return value;
    } catch { /* A fresh scenario is available from the seed. */ }
    return structuredClone({records: seed.records, tasks: seed.tasks});
  }
  function notify(data, record, role, message) {
    data.tasks.unshift({id: crypto.randomUUID(), record_id: record, role, message});
  }
  function allowed(rule, record, role) {
    return rule[0] === role && (rule[1] === record.id || (rule[1] === '*' && record.type === 'Claim'))
      && rule[2] === record.status;
  }
  const relevant = {
    Customer: () => true,
    Producer: record => !['Billing','Claim'].includes(record.type),
    Underwriter: record => ['HOME-3','LAND-3'].includes(record.id),
    'Claims Adjuster': record => record.type === 'Claim',
    'Product Admin': () => false,
  };
  function table(headers, rows) {
    return '<div style="overflow-x:auto"><table><thead><tr>' + headers.map(h => '<th>'+esc(h)+'</th>').join('')
      + '</tr></thead><tbody>' + rows.map(row => '<tr>'+row.map(cell => '<td>'+cell+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  let revision = 0;
  async function mount(container, role) {
    const current = ++revision;
    container.innerHTML = '<div class="card">Loading the Morgan household…</div>';
    try {
      const seed = await loadSeed();
      if (current !== revision || container.dataset.connectedRole !== role) return;
      const data = saved(seed);
      const actor = roles.includes(role) ? role : 'Customer';
      const alerts = data.tasks.filter(task => task.role === actor);
      const records = data.records.filter(relevant[actor]);
      const counts = data.records.reduce((totals, row) => {
        totals[row.status] = (totals[row.status] || 0) + 1;
        return totals;
      }, Object.create(null));
      container.innerHTML = `<div class="pagehead"><div><h1>Connected insurance account</h1><p>${esc(actor)} · Morgan household · AC01</p></div></div>
      <div class="card"><h2>${actor === 'Product Admin' ? 'Portfolio monitoring' : 'Notifications and work queue'}</h2>
      ${actor === 'Product Admin' ? table(['Workflow status','Records'],Object.entries(counts).map(row=>row.map(esc))) :
        (alerts.length ? table(['Reference','Action or update'],alerts.map(t=>[esc(t.record_id),esc(t.message)])) : '<p>No notifications for this role.</p>')}
      </div>
      ${actor === 'Customer' ? '<div class="card"><h2>Named insureds and drivers</h2>'+table(['Name','Insurance role','City'],seed.people.map(p=>[p.name,p.role,p.location].map(esc)))+
      '<h2>Insured and quoted assets</h2>'+table(['Asset','Type','Location','Assigned person','Policy or quote'],seed.assets.map(a=>[a.name,a.kind,a.location,seed.people.find(p=>p.id===a.person_id)?.name,a.policy_id].map(esc)))+'</div>' : ''}
      ${records.length ? '<div class="card"><h2>Shared records</h2>'+table(['Record','Status','Quoted premium or amount','Effective or due date','Context','Next action'],records.map(r=>[
        esc(r.name)+'<br>'+esc(r.id),esc(r.status),r.premium ? '$'+esc(r.premium) : '—',esc(r.due),esc(r.detail),
        scenarios.map((rule,i)=>allowed(rule,r,actor)?'<button type="button" class="btn small" data-connected-step="'+i+'" data-record="'+esc(r.id)+'">'+esc(rule[3])+'</button>':'').join('') || '—'
      ]))+'</div>' : ''}
      ${actor === 'Customer' ? '<div class="card"><h2>Report an auto loss</h2><label for="connected-loss-vehicle">Vehicle</label> <select id="connected-loss-vehicle">'+seed.assets.filter(a=>a.kind==='Auto').map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select> <button type="button" class="btn primary" data-connected-report>Report sample collision</button> <button type="button" class="btn" data-connected-reset>Reload sample data</button></div>' : ''}
      <p>Role switching uses shared demo records in this browser. This workflow uses in-app notifications.</p>`;
      container.onclick = event => {
        const button = event.target.closest('[data-connected-step], [data-connected-report], [data-connected-reset]');
        if (!button) return;
        try {
          if (button.hasAttribute('data-connected-reset')) {
            if (confirm('Reload the Morgan household and clear its workflow changes?')) localStorage.removeItem(key);
          } else {
            const latest = saved(seed);
            if (button.hasAttribute('data-connected-report')) {
              const asset = seed.assets.find(a => a.id === container.querySelector('#connected-loss-vehicle').value);
              const id = 'CL-' + crypto.randomUUID().slice(0,8);
              latest.records.unshift({id,type:'Claim',name:asset.name+' collision',status:'Reported',premium:'',due:'',detail:'First notice received for '+asset.policy_id+' · vehicle '+asset.id});
              notify(latest,id,'Claims Adjuster','New first notice of loss. Assign the claim for review.');
              notify(latest,id,'Customer','Your first notice of loss was received.');
            } else {
              const rule = scenarios[Number(button.dataset.connectedStep)];
              const record = latest.records.find(r => r.id === button.dataset.record);
              if (!rule || !record || !allowed(rule,record,actor)) return mount(container,role);
              record.status = rule[4];
              latest.tasks = latest.tasks.filter(t => !(t.record_id === record.id && t.role === actor));
              notify(latest,record.id,rule[5],rule[6]);
              if (rule[7]) notify(latest,record.id,rule[7],record.name+' · '+record.status+'.');
            }
            localStorage.setItem(key,JSON.stringify(latest));
          }
          mount(container,role);
        } catch {
          alert('Cedarline could not save the demo change in this browser.');
        }
      };
    } catch {
      if (current === revision) container.innerHTML = '<p role="alert">The connected sample could not be loaded. Select Connected account to retry.</p>';
    }
  }
  window.cedarConnected = {mount};
})();
