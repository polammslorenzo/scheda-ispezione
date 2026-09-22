// Una scheda commerciale non deve diventare ricettiva per una parola sparsa
// nel documento, e le ricevute successive devono restare assegnabili ai titoli.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const context = vm.createContext({tipoScheda:'commerciale',dati:{},mdaProtocollo:null,mdaPratica:null});
vm.runInContext(html.slice(html.indexOf('const TITOLI_PROTOCOLLO'),html.indexOf('let mdaProtocollo')),context);
vm.runInContext('this.titoliNelTesto = t => TITOLI_PROTOCOLLO.filter(x=>x.re.test(String(t||""))).map(x=>x.id);',context);
vm.runInContext(html.slice(html.indexOf('function mdaPulisci('),html.indexOf('function analizzaFotoScia(')),context);
const chiavi = rows => Array.from(rows,r=>r.k);
const ric = rows => chiavi(rows).filter(k=>/^ric_/.test(k));

// Ricevuta di un bar senza sezione 8 leggibile, con "hotel" nell'indirizzo e
// "struttura ricettiva" nell'elenco generico dei procedimenti SUAP.
const bar = `Ricevuta di presentazione
Somministrazione di alimenti e bevande — Via Grande Hotel 12
Procedimenti gestiti: commercio, struttura ricettiva, artigianato
Protocollo SUAP 111111 del 01/09/2026`;
assert.deepEqual(ric(context.analizzaRicevuta(bar)),[],'nessun campo ricettivo dalla ricevuta di un bar');
assert.equal(context.mdaProtocollo.numero,'111111');

// Seconda ricevuta della stessa pratica: occupazione di suolo pubblico.
const suolo = `Ricevuta di presentazione
8 - Interventi attivati
Occupazione di suolo pubblico con dehors
9 - Elenco dei documenti
Protocollo SUAP 222222 del 05/09/2026`;
assert.deepEqual(ric(context.analizzaRicevuta(suolo)),[]);
assert.equal(context.mdaProtocollo.numero,'222222');
assert.ok(context.mdaProtocollo.rilevati.includes('os'),'occupazione suolo riconosciuta come titolo');

// Una ricevuta che attiva davvero una ricettiva resta riconosciuta come tale.
const affitta = `8 - Interventi attivati
Affittacamere — avvio
9 - Elenco dei documenti
Protocollo SUAP 333333 del 06/09/2026`;
context.mdaProtocollo = null;
assert.deepEqual(ric(context.analizzaRicevuta(affitta)),['ric_scia_prot','ric_scia_del','ric_tip_aff']);
assert.equal(context.mdaProtocollo,null,'la ricettiva non propone i titoli commerciali');

// MDA di un esercizio commerciale con superficie e dati catastali.
const mdaBar = `Somministrazione di alimenti e bevande
Superficie totale immobile (mq)
120
Bagni 2\nfoglio particella / mappale subalterno\n12 345 6`;
assert.deepEqual(ric(context.analizzaMda(mdaBar)),[],'nessun campo ricettivo da un MDA commerciale');
assert.ok(ric(context.analizzaMda('Struttura ricettiva extralberghiera\n'+mdaBar)).includes('ric_superficie'));
assert.ok(ric(context.analizzaMda('Posti letto 4\n'+mdaBar)).includes('ric_superficie'),'i posti letto bastano come prova');

// Scheda già ricettiva: la tipologia si cerca ancora in tutto il testo.
context.tipoScheda = 'ricettive';
assert.ok(chiavi(context.analizzaRicevuta('Bed and breakfast\nProtocollo 444444 del 07/09/2026')).includes('ric_tip_bb'));
console.log('8 casi di scelta del tipo di scheda verificati');
