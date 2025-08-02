const timeoutPerGiliran = {};

function setTurnTimeout(jid, timeoutId) {
  if (timeoutPerGiliran[jid]) clearTimeout(timeoutPerGiliran[jid]);
  timeoutPerGiliran[jid] = timeoutId;
}

function clearTurnTimeout(jid) {
  if (timeoutPerGiliran[jid]) {
    clearTimeout(timeoutPerGiliran[jid]);
    delete timeoutPerGiliran[jid];
  }
}

function getTurnTimeout(jid) {
  return timeoutPerGiliran[jid] || null;
}

module.exports = {
  setTurnTimeout,
  clearTurnTimeout,
  getTurnTimeout,
  timeoutPerGiliran // opsional, jika mau akses langsung
};