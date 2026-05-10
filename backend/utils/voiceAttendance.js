/**
 * İşçi səs ilə işdə olduğunu təsdiqləyəndə ekranda göstərilən ifadə ilə
 * tanınmış mətnin uyğunluğunu yoxlayır (Web Speech API mətni göndərir).
 */

const PHRASES = [
  '555 inşaat işdəəm',
  'bu gün işə gəlmişəm',
  'işdə olduğumu təsdiq edirəm'
];

function normalizeAz(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ə/g, 'e')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** İstifadəçi və tarix üçün sabit qrupdan bir cümlə seçilir */
function phraseForUserDay(userId, dateStr) {
  const seed = String(userId) + String(dateStr);
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % PHRASES.length;
  return PHRASES[idx];
}

/** Tanınan mətn gözlənilən ifadənin əsas sözlərini ehtiva edirmi */
function transcriptMatchesPhrase(transcript, expectedPhrase) {
  const t = normalizeAz(transcript);
  const words = normalizeAz(expectedPhrase)
    .split(' ')
    .filter((w) => w.length >= 2);
  if (!words.length) return false;
  return words.every((w) => t.includes(w));
}

module.exports = {
  PHRASES,
  phraseForUserDay,
  transcriptMatchesPhrase,
  normalizeAz
};
