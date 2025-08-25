module.exports = (name = 'app') => ({
    info:  (m, meta) => console.log(`[INFO] [${name}] ${m}`, meta || ''),
    warn:  (m, meta) => console.warn(`[WARN] [${name}] ${m}`, meta || ''),
    error: (m, meta) => console.error(`[ERR ] [${name}] ${m}`, meta || ''),
  });
  