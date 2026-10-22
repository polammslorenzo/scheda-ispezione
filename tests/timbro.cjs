// Versione digitale: la parte firma con il timbro (o l'intestazione dello
// scontrino) e i verbalizzanti sono indicati per nome.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

// Sbiancatura del fondo: funzione pura sui pixel RGBA.
const inizio = html.indexOf('function sbiancaPixel(');
const sorgente = html.slice(inizio, html.indexOf('\n}\n', inizio)+2);
const ctx = vm.createContext({Uint32Array});
vm.runInContext(sorgente, ctx);
const pixel = (...colori)=>Uint8ClampedArray.from(colori.flatMap(c=>[...c,255]));

// Carta grigia (foto sotto luce artificiale) con poco inchiostro nero e blu.
const carta = [190,186,180], nero = [30,30,32], blu = [40,60,170];
const foto = pixel(...Array(80).fill(carta), ...Array(15).fill(nero), ...Array(5).fill(blu));
assert.equal(ctx.sbiancaPixel(foto), true);
assert.deepEqual([...foto.slice(0,3)], [255,255,255], 'la carta diventa bianca');
assert.ok(foto[80*4] < 20, "l'inchiostro nero resta nero");
const b = 95*4;
assert.ok(foto[b+2] > foto[b] + 60, 'un timbro blu resta blu');
assert.ok([...foto].every((v,i)=>i%4!==3 || v===255), 'la trasparenza non cambia');

// Foto senza contrasto: non si tocca.
const piatta = pixel(...Array(50).fill([120,120,120]));
assert.equal(ctx.sbiancaPixel(piatta), false);
assert.equal(piatta[0], 120);

// Struttura: comando nel pannello di entrambe le schede, finestra di ritaglio,
// riquadri della versione digitale.
assert.equal((html.match(/\{tipo:"timbro", l:"Timbro o scontrino della parte"\}/g)||[]).length, 2);
assert.match(html, /id="timbroModal"/);
assert.match(html, /\.firme\.digitale \.slot\[data-op\]\{border-color:transparent/);
assert.match(html, /etichetta\.textContent = versioneStampa \? "Firma della parte" : "Timbro della parte"/);

// Il timbro entra nel sigillo ma non nella bozza principale, che si riscrive
// a ogni tasto: ha una chiave sua, come le foto.
assert.match(html, /\^__\(\?:allegato_\|foto\$\|timbro\$\)/);
assert.match(html, /CHIAVE_BOZZA_TIMBRO = "isp_bozza_timbro_v1"/);
const campiCanonici = html.slice(html.indexOf('function campiCanonici('), html.indexOf('async function improntaCampi('));
assert.doesNotMatch(campiCanonici, /__timbro|startsWith\("__"\)/, 'il sigillo copre anche il timbro');

// Dopo il sigillo il timbro non si cambia.
assert.match(html, /\[data-timbro-scatta\],\[data-timbro-carica\],\[data-timbro-rimuovi\]"\)\.forEach\(el=>\{ el\.disabled = true; \}\)/);
assert.match(html, /if\(e\.target\.closest\("\[data-timbro-rimuovi\]"\)\)\{\n    if\(sigillato\) return;/);
console.log('12 casi del timbro della parte verificati');
