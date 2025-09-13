function parseData(raw) {
    const qs = new URLSearchParams(raw || '');
    return Object.fromEntries(qs.entries());
  }

  module.exports = { parseData };