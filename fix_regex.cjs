const fs = require('fs');
let txt = fs.readFileSync('sistema_cliente.jsx', 'utf8');

txt = txt.replace(/const matchTotal = [^\n]+;/, 'const matchTotal = txt.match(/TOTAL.*?([0-9]+[.,][0-9]{2})/i);');
txt = txt.replace(/const matchesValor = [^\n]+;/, 'const matchesValor = [...txt.matchAll(/(?:VALOR|R\\$|RS).*?([0-9]+[.,][0-9]{2})/ig)];');
txt = txt.replace(/const blocos = txt.split\([^\n]+\);/, 'const blocos = txt.split(/JOGO\\/?SERVI[CÇS]O|SERVI[CÇS]O|JOGO/i);');
txt = txt.replace(/const matchVal = b.match\([^\n]+\);/, 'const matchVal = b.match(/(?:VALOR|R\\$|RS).*?([0-9]+[.,][0-9]{2})/i);');

fs.writeFileSync('sistema_cliente.jsx', txt);
