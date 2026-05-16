const express = require('express');     // Framework Express per il server (usato da node.js)
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');     // Per la comunicazione con il database SQLite

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'db');



// ******* Funzioni per trovare il file del database nella cartella db e per instaurare la connessione *******

function findDbFile() {
  if (!fs.existsSync(DB_DIR)) 
    throw new Error('Cartella db non trovata: ' + DB_DIR);

  const files = fs.readdirSync(DB_DIR);
  const dbFile = files.find(f => f.endsWith('.sqlite') || f.endsWith('.db') || f.endsWith('.sqlite3'));     // Mi appoggio con un file .db

  if (!dbFile) 
    throw new Error('Nessun file SQLite trovato nella cartella db');

  return path.join(DB_DIR, dbFile);
}

let dbPath;
try {
  dbPath = findDbFile();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// Apro il database in modalità lettura. Se c'è un errore, loggo e termino.
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Errore apertura DB:', err.message);
    process.exit(1);
  }

  console.log('Connesso al DB:', dbPath);
});

app.use(express.static(__dirname));



// ******* Chiamate per immagini: /image/:id e /image/name/:name *******

function detectMime(buffer) {
  if (!buffer || buffer.length < 4) return 'application/octet-stream';
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  // GIF
  if (buffer.slice(0,3).toString() === 'GIF') return 'image/gif';
  return 'application/octet-stream';
}

app.get('/image/:id', (req, res) => {
  const id = req.params.id;
    db.get('SELECT FILE_IMMAGINE FROM IMMAGINI WHERE IMMAGINE_ID = ?', [id], (err, row) => {
    if (err) {
      console.error('DB error on /image/:id', err);
      return res.status(500).send('Errore DB: ' + (err.message || 'unknown'));
    }
    if (!row || !row.FILE_IMMAGINE) return res.status(404).send('Immagine non trovata');
      handleFileField(row.FILE_IMMAGINE, res);
  });
});

app.get('/image/name/:name', (req, res) => {
  const name = req.params.name;
    db.get('SELECT FILE_IMMAGINE FROM IMMAGINI WHERE NOME = ?', [name], (err, row) => {
    if (err) {
      console.error('DB error on /image/name/:name', err);
      return res.status(500).send('Errore DB: ' + (err.message || 'unknown'));
    }
    if (!row || !row.FILE_IMMAGINE) return res.status(404).send('Immagine non trovata');
      handleFileField(row.FILE_IMMAGINE, res);
  });
});

// Debug endpoint: lista immagini (id, nome, size)
app.get('/images', (req, res) => {
  db.all('SELECT IMMAGINE_ID, NOME, length(FILE_IMMAGINE) AS size FROM IMMAGINI', (err, rows) => {
    if (err) {
      console.error('DB error on /images', err);
      return res.status(500).json({ error: 'Errore DB', message: err.message });
    }
    return res.json(rows || []);
  });
});

function handleFileField(fileField, res) {
  // If it's already a Buffer (BLOB), send directly.
  if (Buffer.isBuffer(fileField)) {
    res.set('Content-Type', detectMime(fileField));
    return res.send(fileField);
  }

  // If the field is stored as a base64 string, decode and send it.
  const str = String(fileField).trim();
  const base64re = /^[A-Za-z0-9+/\r\n]+={0,2}$/;
  const cleaned = str.replace(/\r|\n|\s/g, '');
  const isMaybeBase64 = base64re.test(cleaned) && cleaned.length % 4 === 0 && cleaned.length > 100;
  if (isMaybeBase64) {
    try {
      const buf = Buffer.from(cleaned, 'base64');
      res.set('Content-Type', detectMime(buf));
      return res.send(buf);
    } catch (e) {
      console.error('Errore decoding base64', e);
      return res.status(500).send('Errore immagine DB');
    }
  }

  console.error('Campo immagine DB non è BLOB né base64', typeof fileField);
  return res.status(500).send('Immagine non valida nel DB');
}

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  console.log('Servendo file statici e endpoint /image/:id e /image/name/:name');
});
