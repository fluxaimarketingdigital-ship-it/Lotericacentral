const fs = require('fs');

const pathClient = 'sistema_cliente.jsx';
let content = fs.readFileSync(pathClient, 'utf8');

const targetOld = `      // Buscar CONTROLE: XXXXXX -> "TERM 062635" ou "CONTROLE: 545118"
      let matchControle = txt.match(/(?:CONTROLE|TERM)[:\\s\\.-]*([0-9]{5,10})/);`;

const newLogic = `      // Extrair total e blocos
      let totalAchado = 0;
      const matchTotal = txt.match(/TOTAL\\s*(?:DOS ITENS|RECEBIDO|PAGO)?[\\s:\\.]*R\\$?\\s*([0-9\\.,]+)/);
      if(matchTotal) {
          totalAchado = parseFloat(matchTotal[1].replace('.','').replace(',','.'));
      } else {
          // caso não ache a palavra TOTAL explícita e clara, soma as partes "VALOR: R$"
          const matchesValor = [...txt.matchAll(/VALOR[\\s:\\.]*R\\$?\\s*([0-9\\.,]+)/g)];
          matchesValor.forEach(m => {
              totalAchado += parseFloat(m[1].replace('.','').replace(',','.'));
          });
      }

      if (totalAchado < 300) {
          setValidando(false);
          setCamAtiva(false);
          setErrQR(\`Rejeitado. O cupom atingiu apenas R$ \${totalAchado.toFixed(2).replace('.',',')} (Mínimo R$ 300,00)\`);
          return;
      }

      // Buscar CONTROLE: XXXXXX -> "TERM 062635" ou "CONTROLE: 545118"
      let matchControle = txt.match(/(?:CONTROLE|TERM)[:\\s\\.-]*([0-9]{5,10})/);`;

content = content.replace(targetOld, newLogic);


const targetSelOld = `      // Auto-preenchimento
      const newSel = {};
      if(txt.includes("SANEAMENTO") || txt.includes("PGTO") || txt.includes("DIN.") || txt.includes("BOLETO")) newSel["boleto"] = true;
      if(txt.includes("DEPOSITO") || txt.includes("DEPÓSITO")) newSel["deposito"] = true;
      if(txt.includes("SAQUE")) newSel["saque"] = true;
      if(txt.includes("PIX")) newSel["pix"] = true;
      if(txt.includes("LOTOF") || txt.includes("LOTO")) newSel["lotofacil"] = true;
      if(txt.includes("MEGA")) newSel["megasena"] = true;
      if(txt.includes("QUINA")) newSel["quina"] = true;
      if(txt.includes("BOLÃO") || txt.includes("BOLAO")) newSel["bolao"] = true;

      setSel(newSel);`;

const targetSelNew = `      // Auto-preenchimento inteligente de transações separadas
      let newSel = {};
      const blocos = txt.split(/JOGO\\/SERVI[CÇ]O|SERVI[CÇ]O|JOGO/);
      if(blocos.length > 1) {
         blocos.slice(1).forEach(b => {
             const matchVal = b.match(/VALOR[\\s\\.:]*R\\$?[\\s]*([0-9\\.,]+)/);
             let val = true;
             if(matchVal) {
                 val = parseFloat(matchVal[1].replace('.','').replace(',','.')).toFixed(2);
             }
             
             if(b.includes("SANEAMENTO") || b.includes("PGTO") || b.includes("DIN.") || b.includes("BOLETO")) {
                if (newSel["boleto"] && newSel["boleto"] !== true && typeof val === "string") {
                     // Somar caso tenha vários
                     newSel["boleto"] = (parseFloat(newSel["boleto"]) + parseFloat(val)).toFixed(2);
                } else {
                     newSel["boleto"] = val; 
                }
             }
             else if(b.includes("DEPOSITO") || b.includes("DEPÓSITO")) newSel["deposito"] = val;
             else if(b.includes("SAQUE")) newSel["saque"] = val;
             else if(b.includes("PIX")) newSel["pix"] = val;
             else if(b.includes("LOTOF") || b.includes("LOTO")) newSel["lotofacil"] = val;
             else if(b.includes("MEGA")) newSel["megasena"] = val;
             else if(b.includes("QUINA")) newSel["quina"] = val;
             else if(b.includes("BOLÃO") || b.includes("BOLAO")) newSel["bolao"] = val;
         });
      } else {
         // fallback puro se não achar divisor
         if(txt.includes("SANEAMENTO") || txt.includes("PGTO") || txt.includes("BOLETO")) newSel["boleto"] = totalAchado.toFixed(2);
         if(txt.includes("LOTOF") || txt.includes("LOTO")) newSel["lotofacil"] = true;
      }
      
      setSel(newSel);`;

content = content.replace(targetSelOld, targetSelNew);

fs.writeFileSync(pathClient, content, 'utf8');
console.log("update_ocr_values finished applying rules");
