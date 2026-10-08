// Warcraft Logs extraction helpers. Paste this whole file as the `text` of one
// javascript_tool call on any warcraftlogs.com/reports/<code> tab. It defines window.WCL;
// later calls use it, e.g. `await WCL.load('aLVFk3Bfjvtp1w8M')`.
// Everything is lost when the tab navigates, so stay on one page and re-paste after any navigation.
// These are the site's own undocumented endpoints (found from the page's network requests); if one
// starts returning nothing, open that view in the tab and list
// performance.getEntriesByType('resource') names (split off '?') to find the new path.
window.WCL = (() => {
  const W = {};
  const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const html = async url => new DOMParser().parseFromString(await (await fetch(url)).text(), 'text/html');
  const rows = d => [...d.querySelectorAll('#main-table-0 > tbody > tr')];
  // Amount cells look like "35313443$3.61%35.31m": the raw number is before the '$'.
  const amount = r => parseInt(txt(r.querySelector('.report-table-amount')).split('$')[0]);
  W.sec = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };

  // Run fn over items with limited concurrency (420 requests at 8 wide takes ~30s).
  W.pool = async (items, fn, width = 8) => {
    let i = 0;
    await Promise.all(Array.from({ length: width }, async () => { while (i < items.length) { const it = items[i++]; await fn(it); } }));
  };

  // Fights, players and abilities. fights[].boss is the encounter id (0 = trash),
  // fightPercentage is boss HP x100, start/end_time are ms into the report.
  // friendlies[].fights is a string like ".1.2.17." and icon is "Class-Spec".
  W.load = async code => {
    W.code = code;
    W.fp = await (await fetch(`/reports/fights-and-participants/${code}/0`)).json();
    W.fights = W.fp.fights;
    W.bosses = W.fights.filter(f => f.boss);
    W.players = W.fp.friendlies.filter(p => p.type !== 'Pet' && p.type !== 'NPC');
    W.byId = Object.fromEntries(W.fights.map(f => [f.id, f]));
    return W.bosses.map(f => `${f.id}:${f.name.slice(0, 12)}:${f.kill ? 'K' : (f.fightPercentage / 100).toFixed(1)}:${Math.round((f.end_time - f.start_time) / 1000)}s`).join(' ');
  };
  W.inFight = (p, id) => p.fights.includes('.' + id + '.');

  // Deaths for one fight, in time order: {t:'m:ss', n:name, kb:killing blow, last:last hits text}.
  W.deaths = async f => {
    const d = await html(`/reports/deaths/${W.code}/${f.id}/${f.start_time}/${f.end_time}/0/0/0/-1.0.-1.-1/0/Any/0/${f.start_time}`);
    return [...d.querySelectorAll('#deaths-table-0 > tbody > tr')].map(r => {
      const c = [...r.children].map(txt);
      return { t: c[0], n: c[1], kb: c[2], last: c[4] };
    });
  };

  // Damage done / healing per player for one fight: {n, p: parse ('' if unranked), a: total}.
  // type: 'damage-done' | 'healing' | 'damage-taken'. Parses on wipes are rough.
  W.table = async (f, type) => {
    const d = await html(`/reports/table/${type}/${W.code}/${f.id}/${f.start_time}/${f.end_time}/source/0/0/0/0/0/0/-1.0.-1.-1/0/Any/Any/0/${f.boss}`);
    return rows(d).map(r => ({ n: txt(r.querySelector('.main-table-name')), p: txt(r.querySelector('.main-table-performance')), a: amount(r) }));
  };

  // One player's table broken down by ability: {abilityName: total}.
  // type: 'casts' (counts) | 'damage-taken' | 'damage-done' | 'healing'.
  W.byAbility = async (f, type, sourceId) => {
    const d = await html(`/reports/table/${type}/${W.code}/${f.id}/${f.start_time}/${f.end_time}/ability/0/${sourceId}/0/0/0/0/-1.0.-1.-1/0/Any/Any/${type === 'casts' ? 2 : 0}/${f.boss}`);
    return Object.fromEntries(rows(d).map(r => [txt(r.querySelector('.main-table-name')), amount(r)]));
  };

  // One player's cast events for a fight: [[seconds into pull, ability name], ...]. Returns JSON.
  W.casts = async (f, sourceId) => {
    const j = await (await fetch(`/reports/casts-events/${W.code}/${f.id}/${f.start_time}/${f.end_time}/${sourceId}/0/Any/0/0/Any/0/0/-1.0.-1.-1/0/2`)).json();
    return j.events.filter(e => e.type === 'cast').map(e => [Math.round((e.timestamp - f.start_time) / 1000), e.ability.name]);
  };

  // Load deaths + damage + healing for every boss pull into W.data[fightId].
  W.loadAll = async () => {
    W.data = {};
    await W.pool(W.bosses, async f => {
      const [deaths, dmg, heal] = await Promise.all([W.deaths(f), W.table(f, 'damage-done'), W.table(f, 'healing')]);
      W.data[f.id] = { deaths, dmg, heal };
    });
    return Object.keys(W.data).length + ' pulls loaded';
  };

  // Results come back truncated at about 1000 characters, and text containing '=' or '&'
  // can be blocked as "cookie/query string data". Build output with W.put(value), then
  // read it with W.page(0), W.page(1), ... until it says END.
  W.put = v => { W.out = typeof v === 'string' ? v : JSON.stringify(v); return W.out.length + ' chars, ' + Math.ceil(W.out.length / 950) + ' pages'; };
  W.page = i => { const s = W.out.slice(i * 950, (i + 1) * 950); return s + ((i + 1) * 950 >= W.out.length ? '\nEND' : ''); };
  return W;
})();
'WCL ready';
