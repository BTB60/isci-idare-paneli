/**
 * Admin tərəfindən idarə olunan kassa parametri: satıcı/kassa panelində məxaric (rəsxod) görünsün ya yox.
 * localStorage — tək brauzer; backend əlavə olunanda eyni açarla sinxronlamaq olar.
 */
(function () {
  var KEY = 'kassa_mexaric_enabled_v1';

  function isMexaricEnabled() {
    return localStorage.getItem(KEY) === '1';
  }

  function setMexaricEnabled(on) {
    localStorage.setItem(KEY, on ? '1' : '0');
  }

  window.KassaSettings = {
    STORAGE_KEY: KEY,
    isMexaricEnabled: isMexaricEnabled,
    setMexaricEnabled: setMexaricEnabled
  };
})();
