# Guida Deploy Backend Node.js

## ✅ Migrazione Completata

Il backend è stato completamente migrato da Python/FastAPI a Node.js/Express con le seguenti caratteristiche:

### Tecnologie Utilizzate

- **Runtime**: Node.js 18+
- **Framework**: Express + TypeScript
- **Database**: SQLite (compatibile con frontend)
- **ORM**: Sequelize
- **Validazione**: Zod schemas
- **Autenticazione**: JWT + bcrypt
- **AI**: OpenAI GPT-3.5-turbo
- **Search**: Tavily API

### Compatibilità Frontend

✅ **Tutti gli endpoint sono identici** al backend Python:

- `POST /api/v1/auth/login` - Login OAuth2
- `POST /api/v1/auth/register` - Registrazione
- `GET /api/v1/auth/me` - User corrente
- `GET /api/v1/blog/articles` - Lista articoli
- `GET /api/v1/blog/articles/:slug` - Dettaglio articolo
- `POST /api/v1/blog/articles` - Crea articolo (admin)
- `PUT /api/v1/blog/articles/:id` - Aggiorna articolo (admin)
- `DELETE /api/v1/blog/articles/:id` - Elimina articolo (admin)
- `POST /api/v1/blog/upload-image` - Upload immagine (admin)
- `POST /api/v1/blog/articles/:id/save` - Salva articolo
- `DELETE /api/v1/blog/articles/:id/save` - Rimuovi bookmark
- `GET /api/v1/blog/saved-articles` - Articoli salvati
- `GET /api/v1/blog/categories` - Categorie
- `POST /api/v1/search` - AI search

✅ **Stesso formato risposte JSON**
✅ **Stessa porta**: 8000
✅ **Stesso database**: SQLite (sql_app.db)
✅ **Stessi token JWT**: compatibili

---

## 🚀 Deploy Locale (Development)

### 1. Prerequisiti

```bash
# Node.js 18+
node --version

# npm installato
npm --version
```

### 2. Configurazione

```bash
cd backend

# Installa dipendenze (già fatto)
npm install

# Verifica file .env
# - PORT=8000
# - SECRET_KEY (stesso del Python)
# - DATABASE_URI=sqlite:///./data/sql_app.db
# - OPENAI_API_KEY (opzionale per AI)
# - TAVILY_API_KEY (opzionale per search)
```

### 3. Avvio Sviluppo

```bash
# Development con hot-reload
npm run dev

# Il server parte su http://localhost:8000
# API disponibili su http://localhost:8000/api/v1
```

### 4. Build Production

```bash
# Compila TypeScript
npm run build

# Avvia production
npm start
```

### 5. Verifica Funzionamento

```bash
# Test health check
curl http://localhost:8000/health

# Test registrazione
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User","language":"en"}'

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"Test123!"}'

# Test articoli (pubblico)
curl http://localhost:8000/api/v1/blog/articles
```

---

## 🐳 Deploy con Docker

### 1. Build Immagine

```bash
cd backend

# Build Docker image
docker build -t tenerife-backend:latest .
```

### 2. Run Container

```bash
# Singolo container
docker run -d \
  -p 8000:8000 \
  -e SECRET_KEY="your-secret-key" \
  -e OPENAI_API_KEY="your-openai-key" \
  -e TAVILY_API_KEY="your-tavily-key" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/../frontend/public/images/blog:/app/public/images/blog \
  --name tenerife-backend \
  tenerife-backend:latest
```

### 3. Docker Compose (Raccomandato)

```bash
# STEP 1 — Build del frontend (obbligatorio)
cd frontend
npm install
npm run build
cd ..

# STEP 2 — Avvia backend + nginx
docker-compose up --build -d

# Verifica logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Il `docker-compose.yml` avvia **2 servizi**:

- **backend**: Node.js API su porta 8000
- **nginx**: Reverse proxy su porta 80 — serve il frontend React (da `./frontend/dist`) e proxa `/api/` al backend

Accedi all'app: **http://localhost**

---

## ☁️ Deploy Cloud (Production)

### Opzione 1: Heroku

```bash
# 1. Login Heroku
heroku login

# 2. Crea app
heroku create tenerife-backend

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SECRET_KEY="your-secret-key"
heroku config:set OPENAI_API_KEY="your-key"
heroku config:set TAVILY_API_KEY="your-key"

# 4. Deploy
git push heroku main

# 5. Verifica
heroku logs --tail
heroku open
```

### Opzione 2: Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Init progetto
cd backend
railway init

# 4. Deploy
railway up

# 5. Set variabili
railway variables set SECRET_KEY="your-key"
railway variables set OPENAI_API_KEY="your-key"
```

### Opzione 3: Render

1. Vai su [render.com](https://render.com)
2. **New** → **Web Service**
3. Connetti repository GitHub
4. Configurazione:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `SECRET_KEY=your-key`
     - `OPENAI_API_KEY=your-key`
     - `TAVILY_API_KEY=your-key`
     - `PORT=8000`
5. Deploy automatico ad ogni push

### Opzione 4: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# 1. SSH nel server
ssh user@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/maxange-developer/master_start2impact.git
cd master_start2impact/backend

# 4. Install dependencies
npm install

# 5. Build
npm run build

# 6. Setup PM2 (process manager)
sudo npm install -g pm2
pm2 start dist/index.js --name tenerife-backend

# 7. Auto-restart on reboot
pm2 startup
pm2 save

# 8. Setup Nginx reverse proxy
sudo apt install nginx
# Configura nginx.conf per proxy_pass a localhost:8000
```

---

## 🔒 Configurazione Produzione

### Variabili d'Ambiente Obbligatorie

```env
# .env per production
NODE_ENV=production
PORT=8000

# Sicurezza (IMPORTANTE: genera nuovo SECRET_KEY)
SECRET_KEY=genera-una-chiave-sicura-lunga-almeno-32-caratteri
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URI=sqlite:///./data/sql_app.db

# CORS (domini frontend autorizzati)
CORS_ORIGINS=https://tuo-dominio.com,https://www.tuo-dominio.com

# API Keys (opzionali ma raccomandati)
OPENAI_API_KEY=sk-proj-...
TAVILY_API_KEY=tvly-...
```

### Generare SECRET_KEY Sicuro

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Python
python -c "import secrets; print(secrets.token_hex(64))"
```

---

## 📊 Monitoraggio

### Logs

```bash
# Development
# I logs appaiono nel terminale con npm run dev

# Production con PM2
pm2 logs tenerife-backend

# Docker
docker logs -f tenerife-backend

# Docker Compose
docker-compose logs -f backend
```

### Health Check

```bash
# Endpoint sempre disponibile
curl http://localhost:8000/health

# Risposta attesa:
# {"status":"ok","database":"connected"}
```

---

## 🔄 Aggiornamento da Python

### Database Migration

**NON serve migrazione!** Il database SQLite è compatibile:

- Stesse tabelle (users, articles, saved_articles)
- Stessi campi e tipi
- Sequelize usa gli stessi nomi tabelle del SQLAlchemy

### Token JWT

**Compatibili!** Se usi lo stesso `SECRET_KEY`:

- Token generati dal backend Python funzionano con Node.js
- Token generati da Node.js funzionano con Python
- Gli utenti NON devono rifare login

### API Endpoints

**Identici al 100%!** Il frontend NON richiede modifiche:

- Stessi path (`/api/v1/...`)
- Stesso formato richieste
- Stesso formato risposte JSON
- Stessi status code
- Stessa gestione errori

---

## 🐛 Troubleshooting

### Errore: "Port 8000 already in use"

```bash
# Trova processo che usa porta 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Errore: "Database connection failed"

```bash
# Verifica che la cartella data esista
mkdir -p backend/data

# Verifica permessi
chmod 755 backend/data
```

### Errore: "JWT token invalid"

```bash
# Verifica che SECRET_KEY sia lo stesso del Python backend
# Controlla file .env
cat backend/.env | grep SECRET_KEY
```

### Frontend non si connette

```bash
# Verifica CORS_ORIGINS nel .env
# Deve includere l'URL del frontend
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Riavvia backend dopo modifica
```

---

## ✅ Checklist Deploy

### Prima del Deploy

- [ ] `npm install` completato
- [ ] `npm run build` compila senza errori
- [ ] File `.env` configurato correttamente
- [ ] `SECRET_KEY` generata e sicura (production)
- [ ] `CORS_ORIGINS` configurato per dominio production
- [ ] API keys (OpenAI, Tavily) configurate
- [ ] Cartella `data/` esiste per SQLite
- [ ] Cartella `public/images/blog` accessibile

### Dopo il Deploy

- [ ] Server risponde su `/health`
- [ ] Login funziona (`POST /api/v1/auth/login`)
- [ ] Registrazione funziona
- [ ] Articoli sono visibili
- [ ] Upload immagini funziona (admin)
- [ ] AI search funziona (se API key configurata)
- [ ] Frontend si connette correttamente
- [ ] Token JWT persistono tra richieste
- [ ] Logs non mostrano errori critici

---

## 📝 Note Finali

### Vantaggi della Migrazione Node.js

✅ **Performance**: Express è più veloce di FastAPI per operazioni I/O
✅ **Ecosystem**: npm ha più package di Python
✅ **Deployment**: Più opzioni cloud native (Vercel, Netlify Edge)
✅ **TypeScript**: Type safety migliore di Python typing
✅ **Job market**: Node.js più richiesto per backend junior/mid

### Cosa Verificare

1. **Database**: Usa lo stesso file `sql_app.db` del Python backend
2. **Secret Key**: DEVE essere identica per compatibilità token
3. **Port 8000**: Frontend è configurato per questa porta
4. **CORS**: Deve permettere l'origine del frontend
5. **Upload path**: `../frontend/public/images/blog` deve esistere

### Support

Per problemi o domande:

1. Controlla i logs: `npm run dev` mostra tutti gli errori
2. Verifica .env: tutti i valori necessari sono presenti?
3. Test API: usa Postman/Insomnia per testare endpoint
4. GitHub Issues: apri issue nel repository se serve aiuto

---

## 🎉 Backend Pronto!

Il backend Node.js è **completamente funzionante** e **100% compatibile** con il frontend React.
Puoi fare il deploy in qualsiasi piattaforma che supporta Node.js!

**Good luck! 🚀**
