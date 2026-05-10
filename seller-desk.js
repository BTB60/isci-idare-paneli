/**
 * Satıcı / kassir: günün iş məntəqəsi + kasa mədaxil və məxaric (rəsxod), localStorage.
 */
(function () {
  const STORAGE_DESK = 'seller_daily_desk_v1';
  const STORAGE_TX = 'cash_register_transactions_v1';
  const LEGACY_DEPOSITS = 'cash_register_deposits_v1';

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function migrateLegacyDeposits() {
    try {
      if (localStorage.getItem(STORAGE_TX)) return;
      const raw = localStorage.getItem(LEGACY_DEPOSITS);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      const migrated = arr.map((e) => ({
        ...e,
        direction: 'in',
        txKind: 'medaxil'
      }));
      localStorage.setItem(STORAGE_TX, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_DEPOSITS);
    } catch (_) {}
  }

  function getDeskRecord() {
    try {
      const raw = localStorage.getItem(STORAGE_DESK);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || o.date !== todayStr()) return null;
      return o;
    } catch {
      return null;
    }
  }

  /** @returns {'kassa' | 'diger' | null} */
  function getTodayDesk() {
    const r = getDeskRecord();
    if (!r || !r.desk) return null;
    return r.desk === 'kassa' || r.desk === 'diger' ? r.desk : null;
  }

  /** @param {'kassa' | 'diger'} desk */
  function setTodayDesk(desk) {
    localStorage.setItem(STORAGE_DESK, JSON.stringify({ date: todayStr(), desk }));
  }

  function getTransactions() {
    migrateLegacyDeposits();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_TX) || '[]');
    } catch {
      return [];
    }
  }

  function saveTransactions(list) {
    localStorage.setItem(STORAGE_TX, JSON.stringify(list));
  }

  /** @param {object} entry direction: 'in' | 'out' */
  function addTransaction(entry) {
    const list = getTransactions();
    list.push(entry);
    saveTransactions(list);
    return list;
  }

  /** Köhnə kod uyğunluğu */
  function addDeposit(entry) {
    return addTransaction({ ...entry, direction: 'in', txKind: 'medaxil' });
  }

  window.SellerDesk = {
    STORAGE_DESK,
    STORAGE_TX,
    todayStr,
    getTodayDesk,
    setTodayDesk,
    getTransactions,
    addTransaction,
    addDeposit
  };
})();
