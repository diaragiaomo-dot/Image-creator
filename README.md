
# 🎨 Gemini Vision Studio

Una potente applicazione per la generazione e modifica di immagini basata sui modelli più avanzati di Google Gemini.

## 🚀 Come caricarlo su GitHub e Vercel

### 1. Caricamento su GitHub
1. Crea un nuovo repository su [GitHub](https://github.com/new).
2. Apri il terminale nella cartella del progetto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TUO_UTENTE/NOME_REPO.git
   git push -u origin main
   ```

### 2. Deployment su Vercel
1. Vai su [Vercel](https://vercel.com/new).
2. Importa il repository GitHub appena creato.
3. **Importante**: Nella sezione "Environment Variables", aggiungi la tua chiave API:
   - Key: `API_KEY`
   - Value: `LA_TUA_CHIAVE_API`
4. Clicca su **Deploy**.

## ✨ Caratteristiche
- **Generazione**: Crea immagini da testo usando Gemini 2.5 Flash o Gemini 3 Pro.
- **Editing**: Carica un'immagine e modificala con istruzioni testuali.
- **Supporto 4K**: Risoluzioni ultra-alte con il modello Pro.
- **Search Grounding**: Risultati aggiornati con link alle fonti web.
