// pinch-type analytics — localStorage-based
(function() {
  var S = 'pt_analytics';
  function load() {
    try { return JSON.parse(localStorage.getItem(S)) || init(); } catch(e) { return init(); }
  }
  function init() {
    return { totalViews: 0, sessions: 0, events: [], firstVisit: new Date().toISOString() };
  }
  function save(d) { try { localStorage.setItem(S, JSON.stringify(d)); } catch(e) {} }
  function track(type, detail) {
    var d = load();
    d.events.push({ t: type, d: detail || null, ts: new Date().toISOString() });
    // Keep last 500 events max
    if (d.events.length > 500) d.events = d.events.slice(-500);
    save(d);
  }

  // Page view
  var d = load();
  d.totalViews++;
  // Session: new if >30min since last event
  var last = d.events.length ? new Date(d.events[d.events.length-1].ts).getTime() : 0;
  if (!last || (Date.now() - last > 30*60*1000)) d.sessions++;
  save(d);
  track('pageview');

  // GitHub link clicks
  document.querySelectorAll('a[href*="github.com/lucascrespo23/pinch-type"]').forEach(function(a) {
    a.addEventListener('click', function() { track('github-click'); });
  });

  // Mode tab switches
  document.querySelectorAll('.mode-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      track('mode-switch', btn.getAttribute('data-mode'));
    });
  });
})();
