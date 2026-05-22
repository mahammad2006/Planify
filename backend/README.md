# Planify Backend — Railway Deploy Təlimatı

## 📁 Fayl strukturu
```
planify-backend/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── scheduler.py
├── routers/
│   ├── groups.py
│   ├── teachers.py
│   ├── rooms.py
│   └── subjects.py
├── requirements.txt
├── Procfile
└── railway.toml
```

---

## 🚀 Railway-ə Deploy

### 1. GitHub-a yüklə
```bash
git init
git add .
git commit -m "Initial Planify backend"
git branch -M main
git remote add origin https://github.com/mahammad2006/Planify.git
git push -u origin main
```

### 2. Railway-də yeni proje yarat
- [railway.app](https://railway.app) → **New Project**
- **Deploy from GitHub repo** → Planify repo-sunu seç
- Root directory olaraq `backend` qovluğunu göstər (əgər monorepo varsa)

### 3. PostgreSQL əlavə et (tövsiyə olunur)
- Railway layihəndə: **+ New** → **Database** → **PostgreSQL**
- Railway avtomatik olaraq `DATABASE_URL` env variable-ını əlavə edəcək

### 4. Environment Variables
Railway dashboard-da **Variables** bölməsinə get:

| Dəyişən | Dəyər | Açıqlama |
|---------|-------|----------|
| `DATABASE_URL` | Railway tərəfindən avtomatik | PostgreSQL URL |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Frontend URL (CORS üçün) |

> SQLite istifadə etsən, `DATABASE_URL` əlavə etmə — avtomatik `university.db` yaranar.  
> Lakin Railway-in ephemeral filesystem var, hər deploy-da DB silinir. **PostgreSQL tövsiyə olunur.**

### 5. Deploy yoxla
Deploy tamamlandıqdan sonra:
```
https://your-app.railway.app/         → {"message": "Planify API işləyir ✅"}
https://your-app.railway.app/docs     → Swagger UI
```

---

## 🔧 Local işlətmək
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
API: http://localhost:8000  
Swagger: http://localhost:8000/docs
