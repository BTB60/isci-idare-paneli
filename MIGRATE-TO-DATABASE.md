# LocalStorage'dan Real Database'ə Keçid

## 1. Backend'i Başlat

```bash
cd backend
npm install
npm run dev
```

## 2. MongoDB Bağlantısı

`.env` faylında MongoDB URI-ni təyin et:

```env
MONGODB_URI=mongodb://localhost:27017/555_insaat
# Və ya MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/555_insaat
```

## 3. Frontend'də API Service'i Əlavə Et

Bütün HTML səhifələrdə `auth.js` əvəzinə `api-service.js` istifadə et:

```html
<!-- Əvvəlki -->
<script src="auth.js"></script>

<!-- Yeni -->
<script src="api-service.js"></script>
```

## 4. API Base URL-ni Dəyiş

`api-service.js` faylında:

```javascript
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api'
        : 'https://SIZIN-BACKEND-URL.vercel.app/api', // DEPLOYDAN SONRA DƏYİŞ
};
```

## 5. Funksiyaları Yenilə

### Əvvəlki (localStorage):
```javascript
function loadWorkers() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    // ...
}
```

### Yeni (Database):
```javascript
async function loadWorkers() {
    try {
        const workers = await WorkersAPI.getAll();
        // ...
    } catch (error) {
        console.error('Xəta:', error);
    }
}
```

## 6. Mühüm Dəyişikliklər

| Əməliyyat | localStorage | Database |
|-----------|-------------|----------|
| Oxuma | `getWorkers()` | `await WorkersAPI.getAll()` |
| Yazma | `saveData('workers', data)` | `await WorkersAPI.create(data)` |
| Yeniləmə | `localStorage.setItem()` | `await WorkersAPI.update(id, data)` |
| Silmə | `localStorage.removeItem()` | `await WorkersAPI.delete(id)` |

## 7. Deploy Əməliyyatları

### Backend Deploy (Vercel):
```bash
cd backend
vercel --prod
```

### URL-ni Yenilə:
Deploydan sonra alınan URL-ni `api-service.js`-də dəyiş:

```javascript
BASE_URL: 'https://555insaat-backend.vercel.app/api'
```

## 8. Test Et

1. Yeni işçi əlavə et
2. Səhifəni yenilə
3. Məlumatlar qaldı mı? (localStorage yox, database)

## 9. Üstünlüklər

✅ **Real Database (MongoDB)**
- Məlumatlar silinmir
- Çox istifadəçi dəstəyi
- Global giriş (hər yerdən)
- Təhlükəsizlik (JWT)

❌ **localStorage (Köhnə)**
- Brauzerdə saxlanılır
- Silinə bilər
- Yalnız 1 istifadəçi
- Lokal işləyir

## 10. Problemlər və Həlləri

### Problem: CORS Xətası
**Həll:** Backend `server.js`-də CORS origin əlavə et:

```javascript
app.use(cors({
    origin: ['http://localhost:5500', 'https://your-frontend.vercel.app']
}));
```

### Problem: Token Xətası
**Həll:** Login olub token aldığından əmin ol:

```javascript
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}
```

### Problem: Məlumat Gəlmir
**Həll:** Backend işlədiyini yoxla:

```bash
curl http://localhost:5000/api/health
```

## Hazır! 🎉

Artıq sistemin real database ilə işləyir!
