const { getJwtSecret } = require('./jwtSecret');

/**
 * Server işə düşməzdən əvvəl kritik mühit yoxlaması (production).
 */
function validateEnv(logger) {
  const logInfo = logger && logger.info ? (m) => logger.info(m) : console.log;
  const logWarn = logger && logger.warn ? (m) => logger.warn(m) : console.warn;

  if (process.env.NODE_ENV === 'production') {
    getJwtSecret();

    const rr = process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.trim();
    if (!rr || rr.length < 32) {
      logWarn(
        '[555-insaat] Production: JWT_REFRESH_SECRET (≥32 simvol, JWT_SECRET-dən fərqli) təyin etmək tövsiyə olunur.'
      );
    }

    if (!process.env.CORS_ORIGINS || !process.env.CORS_ORIGINS.trim()) {
      logWarn(
        '[555-insaat] Production: CORS_ORIGINS boşdur — default whitelist işləyir; öz domenlərinizi explicit yazın.'
      );
    }
  } else {
    getJwtSecret();
    logInfo('[555-insaat] JWT konfiqurasiyası yoxlandı (development).');
  }
}

module.exports = { validateEnv };
