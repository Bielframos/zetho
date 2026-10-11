/* One contract shared by the blocking pre-paint script and Angular. No user state on the server. */
(function (root) {
  var key = 'zetho.color-mode';
  function normalize(value) { return value === 'light' || value === 'dark' ? value : 'system'; }
  function resolve(preference, dark) { return normalize(preference) === 'system' ? (dark ? 'dark' : 'light') : preference; }
  function apply(document, mode) {
    document.documentElement.setAttribute('data-color-mode', mode);
    document.documentElement.style.colorScheme = mode;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#101113' : '#fcfcfd');
  }
  root.ZethoColorMode = { key: key, normalize: normalize, resolve: resolve, apply: apply };
  if (typeof window !== 'undefined' && root.document) {
    var preference = 'system';
    try { preference = normalize(root.localStorage.getItem(key)); } catch (_) { /* Restricted storage uses system. */ }
    var dark = root.matchMedia ? root.matchMedia('(prefers-color-scheme: dark)').matches : true;
    apply(root.document, resolve(preference, dark));
  }
})(globalThis);
