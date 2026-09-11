const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const context = vm.createContext({tipoScheda:'ricettive',dati:{},mdaProtocollo:null,mdaPratica:null,titoliNelTesto:()=>[]});
vm.runInContext(html.slice(html.indexOf('function mdaPulisci('),html.indexOf('function analizzaFotoScia(')),context);
const fields = rows => Object.fromEntries(rows.map(r=>[r.k,r.value]));
const cases = [
 ['N. camere N. bagni N. posti letto complessivi\n3 2 6', ['3','2','6']],
 ['N° stanze\nN° posti letto\nN° bagni\n3\n6\n2', ['3','2','6']],
 ['Numero camere: 3\nNumero bagni: 2\nNumero posti letto: 6', ['3','2','6']],
 ['Stanze 3 Bagni 0 Posti letto 6', ['3','0','6']],
 ['Camere | Posti letto | Servizi igienici\n3 | 6 | 2', ['3','2','6']],
 ['N. camere N. bagni N. posti letto complessivi\n3 2', [undefined,undefined,undefined]],
 ['Camere: \nBagni: \nPosti letto: ', [undefined,undefined,undefined]],
 ['Camere\nSuperficie 120\nBagni\nFoglio 12', [undefined,undefined,undefined]],
];
for(const [text,expected] of cases){
 const out=fields(context.analizzaMda(text));
 assert.deepEqual([out.ric_cam_dich,out.ric_bagni,out.ric_letti_dich],expected,text);
 assert.equal(out.ric_cam_acc,undefined);
}
for(const text of [
 'Protocollo SUAP c_f839/Comune_di_Napoli/123456 del 11/09/2026',
 'Protocollo: 123456 del 11/09/2026',
 'Prot. n. 123456 data: 11-09-2026',
 'Protocollo generale numero 123456\nin data 11.09.2026',
]){
 const out=fields(context.analizzaRicevuta(text));
 assert.equal(out.ric_scia_prot,'123456',text);
 assert.equal(out.ric_scia_del,'11/09/2026');
}
assert.equal(fields(context.analizzaRicevuta('Codice Pratica ABCDEFGH12345')).ric_scia_prot,undefined);
context.tipoScheda='commerciale';
assert.equal(fields(context.analizzaRicevuta('Protocollo SUAP 123456 del 11/09/2026')).ric_scia_prot,undefined);
assert.equal(context.mdaProtocollo.numero,'123456');
console.log('14 casi di importazione verificati');
