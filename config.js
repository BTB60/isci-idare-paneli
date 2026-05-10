/**
 * Frontend API base URL.
 * Production: set <meta name="555-api-base" content="https://api.example.com/api"> in HTML,
 * or deploy frontend behind same origin as API so `${origin}/api` works.
 */
(function () {
  const meta = document.querySelector('meta[name="555-api-base"]');
  const fromMeta = meta && meta.content && meta.content.trim();
  const host = window.location.hostname;
  const isLocalHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]';
  const isFileProtocol = window.location.protocol === 'file:';

  if (fromMeta) {
    window.API_BASE_URL = fromMeta.replace(/\/$/, '');
  } else if (isLocalHost || isFileProtocol) {
    // file:// və ya Live Server: backend demək olar ki, həmişə bu portdadır
    window.API_BASE_URL = 'http://localhost:5000/api';
  } else {
    window.API_BASE_URL = `${window.location.origin.replace(/\/$/, '')}/api`;
  }
})();
