
const fs = require('fs');
const path = require('path');

const newRegulamento = `REGULAMENTO — PROGRAMA CLIENTE FIDELIZADO
Lotérica Central · CNPJ 20.845.956/0001-00 · Alagoinhas-BA

1. PARTICIPAÇÃO
Destinado a clientes que realizarem transações na unidade. A participação é validada através do App Fidelidade mediante envio da foto legível do comprovante e inserção do código do operador que realizou o atendimento.

2. MECÂNICA DE PONTUAÇÃO
• Visita Válida: Cada visita com Pagamentos ou Depósitos de valor igual ou superior a R$ {minVisita} garante 01 (uma) autenticação para o prêmio principal.
• Auditoria: Todas as visitas registradas passam por análise de auditoria humana. Comprovantes duplicados, ilegíveis, com data fora do prazo ou adulterados serão sumariamente recusados, descontando o ponto do cliente.

3. PRÊMIO PRINCIPAL (META)
• Ao completar {meta} autenticações válidas, o prêmio {premioNome} será desbloqueado para auditoria final.
• Após a aprovação da gerência, o Voucher Digital de Retirada será enviado automaticamente via WhatsApp.
• Prazo de Retirada: O cliente tem um prazo de até 30 dias corridos para retirar o prêmio físico na unidade. Após esse período, o voucher digital irá expirar e perder a validade.

4. PRÊMIO RELÂMPAGO (SURPRESA)
• Clientes que incluírem Bolões ou Jogos em valor igual ou acima de R$ {minRelampago} em sua visita concorrem a um prêmio instantâneo surpresa. 
• O sistema informará na hora se o cliente foi contemplado, mas o voucher só será enviado pelo WhatsApp após a conferência e aprovação do comprovante pela gerência.

5. PREMIAÇÃO DE OPERADORES
• Como incentivo ao bom atendimento, as 2 operadoras com maior volume de autenticações válidas (aprovadas na auditoria) no mês serão premiadas no fechamento do ciclo de atendimento (dia 05).

6. VIGÊNCIA E ENCERRAMENTO DE CAMPANHA
• As campanhas de fidelidade possuem datas de início ({dataInicio}) e encerramento ({dataFim}) rigorosamente controladas pelo sistema.
• Ao fim do prazo da campanha, o ciclo será encerrado. Todas as pontuações e saldos não resgatados serão zerados para dar início a um novo ciclo de prêmios.
• Comprovantes com data de emissão superior a 7 dias ou emitidos fora da vigência da campanha atual não serão aceitos.
• LGPD: Dados protegidos e usados exclusivamente para o programa.`;

function updateFile(filename) {
    const filePath = path.join(__dirname, '..', filename);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Expressão regular para encontrar a propriedade regulamento e substituir todo o conteúdo entre crases
    const regex = /regulamento:\s*`[\s\S]*?`,/g;
    content = content.replace(regex, `regulamento: \`${newRegulamento}\`,`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filename} atualizado com sucesso!`);
}

updateFile('sistema_operador.jsx');
updateFile('sistema_cliente.jsx');

