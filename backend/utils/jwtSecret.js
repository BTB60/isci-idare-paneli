/**
 * Tək mənbə: JWT imzalama və yoxlama üçün sirr (production-da sıx validasiya).
 */

const WEAK_PLACEHOLDER =
  /your_super_secret|your-secret-key|change_in_production|jwt_secret_here|your_refresh_secret/i;

/** Yerli inkişaf üçün uzun fallback — PRODUCTION-da istifadə olunmur */
const DEV_DEFAULT_SECRET =
  '555-insaat-local-dev-only-do-not-use-in-production-min-32!!';

function getJwtSecret() {
  const isProd = process.env.NODE_ENV === 'production';
  const raw = process.env.JWT_SECRET;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';

  if (isProd) {
    if (!trimmed || trimmed.length < 32) {
      throw new Error(
        'JWT_SECRET production-da təyin olunmalıdır (≥32 simvol). Əlavə edin: backend/.env və ya ' +
          'bulud sırları (Fly: fly secrets set JWT_SECRET=təsadüfi_uzun_string). ' +
          'Yaratmaq: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    if (WEAK_PLACEHOLDER.test(trimmed)) {
      throw new Error(
        'JWT_SECRET nümunə/placeholder dəyər ola bilməz — təhlükəsiz təsadüfi sətir yazın.'
      );
    }
    return trimmed;
  }

  if (trimmed.length >= 16) return trimmed;
  if (trimmed && trimmed.length < 16 && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[555-insaat] JWT_SECRET qısadır; yerli tokenlər üçün .env-də ən azı 16 simvol tövsiyə olunur.'
    );
  }
  if (!trimmed && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[555-insaat] JWT_SECRET boşdur — yerli inkişaf üçün daxili fallback istifadə olunur.'
    );
  }
  return trimmed || DEV_DEFAULT_SECRET;
}

function getJwtRefreshSecret() {
  const primary = getJwtSecret();
  const r = typeof process.env.JWT_REFRESH_SECRET === 'string'
    ? process.env.JWT_REFRESH_SECRET.trim()
    : '';

  if (r.length >= 32 && !WEAK_PLACEHOLDER.test(r)) return r;

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[555-insaat] JWT_REFRESH_SECRET ayrıca uzun təhlükəsiz dəyər tövsiyə olunur; müvəqqəti olaraq JWT_SECRET istifadə olunur.'
    );
  }

  return primary;
}

module.exports = { getJwtSecret, getJwtRefreshSecret, DEV_DEFAULT_SECRET };
