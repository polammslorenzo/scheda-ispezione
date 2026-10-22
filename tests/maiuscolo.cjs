// Tutto ciò che si scrive nella scheda diventa MAIUSCOLO nel valore, non solo
// a schermo; le schede sigillate si riaprono invece come sono state salvate.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const context = vm.createContext({});
vm.runInContext(html.slice(html.indexOf('function maiuscolo('),html.indexOf('/* ── legatura maschera')),context);
const {maiuscolo,inMaiuscolo,campiInMaiuscolo} = context;

assert.equal(maiuscolo('via dei tribunali, 12 — città'),'VIA DEI TRIBUNALI, 12 — CITTÀ');
assert.equal(maiuscolo('perché è già lì: però sì'),'PERCHÉ È GIÀ LÌ: PERÒ SÌ');
assert.equal(maiuscolo('mario.rossi@pec.it'),'MARIO.ROSSI@PEC.IT');
assert.equal(maiuscolo(true),true);
assert.equal(maiuscolo(undefined),undefined);

// Il cursore resta dove si stava scrivendo, anche in mezzo al testo
// e anche quando una lettera diventa due (ß → SS).
function campo(valore,inizio,fine=inizio){
  const el = {value:valore,selectionStart:inizio,selectionEnd:fine,
    setSelectionRange(a,b){ this.selectionStart=a; this.selectionEnd=b; }};
  el.ownerDocument = {activeElement:el};
  return el;
}
let el = campo('VIA ROMa 12',8);
inMaiuscolo(el);
assert.deepEqual([el.value,el.selectionStart,el.selectionEnd],['VIA ROMA 12',8,8]);
el = campo('straße x',6);
inMaiuscolo(el);
assert.deepEqual([el.value,el.selectionStart],['STRASSE X',7]);
el = campo('abc def',0,3);
inMaiuscolo(el);
assert.deepEqual([el.value,el.selectionStart,el.selectionEnd],['ABC DEF',0,3]);
el = campo('fuori',2); el.ownerDocument = {activeElement:null};
inMaiuscolo(el);
assert.equal(el.value,'FUORI');

// JSON salvato prima di questa modifica: testi in maiuscolo, dati interni intatti.
const vecchio = {
  denominazione:'Bar Sport', ex_pec:'bar.sport@pec.it', provvedimenti:'diffida\nverbale n. 12',
  t_somm:true, ta_no:false,
  __allegato_visura:'data:image/jpeg;base64,abcDEF', __allegato_visura_nome:'visura.pdf',
  __foto:[{id:'f1',nome:'scontrino.jpg',quando:'22/10/2026 10:15',didascalia:'scontrino fiscale',impronta:'ab12',img:'data:image/jpeg;base64,xyZ'}]
};
const nuovo = campiInMaiuscolo(vecchio);
assert.equal(nuovo.denominazione,'BAR SPORT');
assert.equal(nuovo.ex_pec,'BAR.SPORT@PEC.IT');
assert.equal(nuovo.provvedimenti,'DIFFIDA\nVERBALE N. 12');
assert.equal(nuovo.t_somm,true);
assert.equal(nuovo.ta_no,false);
assert.equal(nuovo.__allegato_visura,vecchio.__allegato_visura);
assert.equal(nuovo.__allegato_visura_nome,'visura.pdf');
assert.equal(nuovo.__foto[0].didascalia,'SCONTRINO FISCALE');
assert.equal(nuovo.__foto[0].img,vecchio.__foto[0].img);
assert.equal(nuovo.__foto[0].nome,'scontrino.jpg');
assert.equal(vecchio.denominazione,'Bar Sport','l\'originale non viene modificato');

// Le strade da cui arriva il testo passano tutte dal maiuscolo.
const corpo = nome => { const i = html.indexOf(nome); return html.slice(i,html.indexOf('\n}',i)); };
assert.match(corpo('function applica('),/const campi = p\.sigillo \? \(p\.campi \|\| \{\}\) : campiInMaiuscolo\(p\.campi\);/);
assert.match(corpo('function applica('),/ripristinaSigillo\(p\.sigillo,\{\.\.\.dati\}\)/);
assert.match(corpo('function pacchetto('),/sigillato \? \{\.\.\.dati\} : campiInMaiuscolo\(dati\)/);
assert.match(corpo('function bozzaCorrente('),/campi\[k\] = maiuscolo\(dati\[k\]\)/);
assert.match(html,/if\(!e\.isComposing\) inMaiuscolo\(e\.target\);\n  dati\[k\] = maiuscolo\(e\.target\.value\);/);
assert.match(html,/f\.didascalia = maiuscolo\(dida\.value\);/);
assert.match(html,/addEventListener\("compositionend"/);
assert.match(html,/valore\.value = r\.value === true \? "SÌ" : maiuscolo\(r\.value\)/);
assert.equal((html.match(/autocapitalize="characters"/g)||[]).length,2);
console.log('29 casi di stampatello verificati');
