
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'sistema_operador.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. UPDATE VERSION
content = content.replace(/v2\.9\.1-FINAL-FIX/g, 'v3.0-FINAL');

// 2. REWRITE ADMINISTRATIVE FUNCTIONS CLEANLY
const newFunctions = `  const updateStatusNative = async (newS) => {
    if(newS==="rejected" && !(await customConfirm("Recusar Autenticação", "Deseja realmente RECUSAR esta autenticação?", "❌", "Sim, Recusar"))) return;
    const newAuths = c.auths.map(x=>x.id===a.id?{...x, status:newS, modificado:false, obsAdmin:newS==="rejected"?"Recusado":""}:x);
    setCl(cl.map(x=>x.id===c.id?{...x, auths:newAuths}:x));
    if(newS==="rejected"){
      setPr(pr.map(p=>p.authId===a.id && p.status !== "redeemed" ? {...p,status:"rejected"}:p));
    }
  };
  const excluirAuthNative = async () => {
    if(!(await checkM("Tem certeza que deseja EXCLUIR esta autenticação permanentemente? Digite sua Senha de Alteração e Exclusão:"))) return;
    const associatedPrize = pr.find(p=>p.authId===a.id);
    setCl(cl.map(x=>x.id===c.id?{...x, auths:c.auths.filter(y=>y.id!==a.id)}:x));
    setPr(pr.filter(p=>p.authId!==a.id));
    logAdminAction("EXCLUSAO", "Exclusão de Autenticação", {tipo: 'auth', clientId: c.id, dado: a, prize: associatedPrize});
  };`;

// Use a regex to find the entire block from updateStatusNative to excluirAuthNative and replace it
const blockRegex = /const updateStatusNative = async \(newS\) => \{[\s\S]*?const excluirAuthNative = async \(\) => \{[\s\S]*?logAdminAction\("EXCLUSAO", "Exclusão de Autenticação", \{tipo: 'auth', clientId: c\.id, dado: a, prize: associatedPrize\}\);\s*\};/;

if (blockRegex.test(content)) {
    content = content.replace(blockRegex, newFunctions);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Funções administrativas reescritas com sucesso na v3.0!');
} else {
    console.log('❌ Falha ao localizar o bloco de funções para substituição.');
}
