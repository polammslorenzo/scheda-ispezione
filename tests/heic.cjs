// Le foto dell'iPhone (HEIC) devono essere selezionabili e convertite.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cartella = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(cartella,'index.html'),'utf8');

// Il selettore di file non deve lasciarle spente.
const campi = html.match(/<input type="file"[^>]*>/g) || [];
const immagini = campi.filter(c=>/accept="[^"]*image\//.test(c));
assert.ok(immagini.length >= 6, 'campi immagine trovati: '+immagini.length);
for(const campo of immagini){
  assert.match(campo, /\.heic/, 'campo senza HEIC: '+campo.slice(0,80));
}

// Entrambe le strade che aprono un'immagine passano dalla conversione.
const rasterizza = html.slice(html.indexOf('async function rasterizzaAllegatoCatastale'));
assert.match(rasterizza.slice(0,rasterizza.indexOf('\n}')), /preparaFileImmagine/);
const prepara = html.slice(html.indexOf('async function mdaPreparaFoto'));
assert.match(prepara.slice(0,prepara.indexOf('\n}')), /preparaFileImmagine/);

// Il decodificatore sta accanto alla scheda e viene chiesto per nome.
assert.match(html, /new URL\("heic\.js", document\.baseURI\)/);
const heic = fs.statSync(path.join(cartella,'heic.js'));
assert.ok(heic.size > 1_000_000, 'heic.js troppo piccolo: '+heic.size);
assert.match(fs.readFileSync(path.join(cartella,'heic.js'),'utf8').slice(0,900), /libheif-js 1\.23\.2[\s\S]*LGPL-3\.0/);
assert.ok(fs.statSync(path.join(cartella,'heic-LICENSE.txt')).size > 1000, 'licenza mancante');

// Su Safari e iPhone il file da 2 MB non deve essere scaricato.
assert.match(html, /if\(await browserApreHeic\(file\)\) return file;/);
console.log('7 casi HEIC verificati');
