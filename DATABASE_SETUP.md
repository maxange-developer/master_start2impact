# Setup Database - Istruzioni Rapide

## Per lo Sviluppatore (Te)

### Esportare i dati quando modifichi il database:

```bash
cd backend
python export_data.py
git add initial_data.json
git commit -m "Update database data"
git push
```

## Per il Professore (Deploy)

### Setup completo in un comando:

```bash
git clone <repository-url>
cd tenerife-ai-finder
docker-compose up --build
```

Questo automaticamente:

1. ✅ Scarica il progetto
2. ✅ Crea il database SQLite
3. ✅ Carica tutti i dati da `initial_data.json`
4. ✅ Avvia backend + frontend
5. ✅ Tutto pronto su http://localhost:5173

## Come Funziona

- Il file `backend/initial_data.json` contiene tutti i dati del database (utenti, articoli, ecc.)
- Il Dockerfile esegue automaticamente `import_data.py` all'avvio
- Il database viene popolato prima che il server parta
- Nessuna configurazione manuale richiesta!

## Utenti Pre-caricati

Dal file `initial_data.json`, il database include:

- 3 utenti registrati
- 20 articoli del blog
- Tutti i saved articles

## Sviluppo Locale (Senza Docker)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python import_data.py  # Carica i dati
python -m uvicorn main:app --reload
```

## Note Tecniche

- **Database**: SQLite (`sql_app.db`)
- **File dati**: `backend/initial_data.json` (tracciato su Git)
- **Import automatico**: Script `import_data.py` (eseguito all'avvio Docker)
- **Export dati**: Script `export_data.py` (per aggiornare i dati)
