import { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Nunito:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#060d1e;font-family:'Nunito',sans-serif;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.94)}}
  .reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease;}
  .reveal.vis{opacity:1;transform:translateY(0);}
`;

const P={navy:"#060d1e",navy2:"#0a1628",az:"#003478",az2:"#0052cc",ou:"#f5a800",vd:"#00a651",rx:"#7c3aed",br:"#ffffff",ci:"#94a3b8",ge:"#e2eaf8"};

function useReveal(){
  const ref=useRef(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){el.classList.add("vis");obs.disconnect();}},{threshold:.1});
    obs.observe(el);return()=>obs.disconnect();
  },[]);
  return ref;
}
function Reveal({children,delay=0,style={}}){
  const ref=useReveal();
  return <div ref={ref} className="reveal" style={{transitionDelay:`${delay}ms`,...style}}>{children}</div>;
}
function SecTit({tag,titulo,icon}){
  const ref=useReveal();
  return(
    <div ref={ref} className="reveal" style={{textAlign:"center"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,168,0,.1)",border:"1px solid rgba(245,168,0,.3)",borderRadius:30,padding:"5px 16px",marginBottom:12}}>
        <span style={{fontSize:14}}>{icon}</span>
        <span style={{fontSize:10,fontWeight:800,color:P.ou,textTransform:"uppercase",letterSpacing:2}}>{tag}</span>
      </div>
      <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:26,color:P.br,lineHeight:1.2}}>{titulo}</div>
    </div>
  );
}

export default function Infografico(){
  return(
    <>
      <style>{CSS}</style>
      <div style={{fontFamily:"'Nunito',sans-serif",background:P.navy,color:P.br,maxWidth:820,margin:"0 auto",overflowX:"hidden"}}>
        <Hero/>
        <Ecossistema/>
        <GestaoSection/>
        <FluxoCompleto/>
        <QRSection/>
        <FormularioSection/>
        <AvaliacaoSection/>
        <PremiosSection/>
        <AppsSection/>
        <NumerosSection/>
        <Rodape/>
      </div>
    </>
  );
}

function Hero(){
  return(
    <div style={{position:"relative",overflow:"hidden",background:`linear-gradient(160deg,${P.navy} 0%,${P.az} 60%,${P.navy2} 100%)`,padding:"56px 28px 64px",textAlign:"center"}}>
      {[280,420,560].map((s,i)=>(
        <div key={i} style={{position:"absolute",top:"50%",left:"50%",width:s,height:s,borderRadius:"50%",border:`1px solid rgba(245,168,0,${.06-i*.015})`,transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
      ))}
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(245,168,0,.12)",border:"1px solid rgba(245,168,0,.4)",borderRadius:30,padding:"5px 16px",marginBottom:20,animation:"fadeUp .6s ease both"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:P.vd,animation:"pulse 1.5s infinite"}}/>
        <span style={{fontSize:11,fontWeight:700,color:P.ou,letterSpacing:2,textTransform:"uppercase"}}>Lotérica Central · Alagoinhas-BA</span>
      </div>
      <div style={{fontSize:80,marginBottom:18,lineHeight:1,animation:"float 3s ease-in-out infinite",filter:"drop-shadow(0 8px 24px rgba(245,168,0,.5))"}}>🏆</div>
      <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:34,lineHeight:1.1,marginBottom:10,letterSpacing:-1,animation:"fadeUp .7s .1s ease both",opacity:0,animationFillMode:"forwards"}}>
        <span style={{color:P.br}}>Cliente</span> <span style={{color:P.ou}}>Fidelizado</span> <span style={{color:P.br}}>Premiado</span>
      </h1>
      <p style={{fontSize:14,color:P.ci,lineHeight:1.8,maxWidth:480,margin:"0 auto 26px",animation:"fadeUp .7s .2s ease both",opacity:0,animationFillMode:"forwards"}}>
        Programa digital de fidelidade com identificação simplificada, formulário com foto, avaliação do atendimento e auditoria em tempo real.
      </p>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",animation:"fadeUp .7s .3s ease both",opacity:0,animationFillMode:"forwards"}}>
        {[["🎟️","Prêmio a cada 15 visitas"],["⚡","Prêmio Relâmpago"],["⭐","Avaliação 1–10"],["📱","Plataforma Multi-Acesso"]].map(([em,txt])=>(
          <div key={txt} style={{display:"flex",gap:7,alignItems:"center",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:24,padding:"7px 14px",fontSize:12,fontWeight:700}}>
            <span>{em}</span><span style={{color:P.ge}}>{txt}</span>
          </div>
        ))}
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${P.ou},transparent)`}}/>
    </div>
  );
}

function Ecossistema(){
  return(
    <div style={{padding:"52px 24px",background:P.navy2}}>
      <SecTit tag="Visão Geral" titulo="Ecossistema Digital" icon="🌐"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:14,marginTop:32}}>
        {[
          {emoji:"👑",titulo:"Nível Master",sub:"Dono / Estratégico",cor:P.vd,items:["Configuração de Metas","Relatórios PDF Finais","Central de Notícias","Gestão de Segurança","Controle de Prêmios"]},
          {emoji:"⚖️",titulo:"Nível Gerência",sub:"Auditoria e Controle",cor:P.ou,items:["Validação de Fotos","Auditoria de Valores","Aprovação de Visitas","Gestão de Clientes","Fidelização Ativa"]},
          {emoji:"👩‍💼",titulo:"Nível Operador",sub:"Caixa / Atendimento",cor:P.az2,items:["Identificação (Token)","Liberação de Vouchers","Ranking da Equipe","Atendimento Ágil","Resgate no Balcão"]},
          {emoji:"🏆",titulo:"App Cliente",sub:"Fidelidade Digital",cor:P.rx,items:["Tutorial interativo","Cadastro via WhatsApp","Envio de comprovante","Acompanha auditoria","Avaliação 1 a 10","Voucher Digital"]},
        ].map((c,i)=>(
          <Reveal key={i} delay={i*100}>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:18,border:`1px solid ${c.cor}30`,padding:18,height:"100%",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:c.cor}}/>
              <div style={{fontSize:32,marginBottom:10}}>{c.emoji}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:14,color:P.br,marginBottom:3}}>{c.titulo}</div>
              <div style={{fontSize:10,color:c.cor,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{c.sub}</div>
              {c.items.map(it=><div key={it} style={{display:"flex",gap:7,marginBottom:6,fontSize:11,color:P.ge}}><span style={{color:c.cor,flexShrink:0}}>•</span><span>{it}</span></div>)}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function FluxoCompleto(){
  const passos=[
    {n:"01",emoji:"📢",titulo:"Início da Promoção",desc:"Acesse o App pelo link ou QR Code no balcão para iniciar.",cor:P.az2,link:"Acesso Rápido"},
    {n:"02",emoji:"👤",titulo:"Login Inteligente",desc:"Cadastro simplificado ou Login via WhatsApp para manter seu histórico.",cor:"#0891b2",link:"App Cliente"},
    {n:"03",emoji:"🏪",titulo:"Atendimento",desc:"Realize seus serviços no caixa: boletos, depósitos, jogos ou saques.",cor:"#d97706",link:"Balcão Lotérica"},
    {n:"04",emoji:"👩‍💼",titulo:"Identificação da Operadora",desc:"Selecione o nome ou digite o código da operadora que te atendeu.",cor:P.vd,link:"Identificação"},
    {n:"05",emoji:"📸",titulo:"Registro com Foto",desc:"Informe a data, nº do controle e anexe a foto do seu comprovante.",cor:P.rx,link:"App Cliente"},
    {n:"06",emoji:"⭐",titulo:"Avaliação do Atendimento",desc:"Dê sua nota de 1 a 10. Sua opinião é fundamental para nossa qualidade.",cor:"#059669",link:"Obrigatório"},
    {n:"07",emoji:"⚖️",titulo:"Auditoria Real",desc:"O operador valida sua foto e valores para garantir sua pontuação.",cor:"#db2777",link:"Operador/Admin"},
    {n:"08",emoji:"🎫",titulo:"Voucher Digital",desc:"Ganhou? Receba um cupom premium via WhatsApp para retirar seu prêmio.",cor:P.ou,link:"WhatsApp"},
  ];
  return(
    <div style={{padding:"52px 24px",background:P.navy}}>
      <SecTit tag="Jornada" titulo="Fluxo Completo do Cliente" icon="🔄"/>
      <div style={{position:"relative",marginTop:36}}>
        <div style={{position:"absolute",left:22,top:20,bottom:20,width:2,background:`linear-gradient(180deg,${P.az2},${P.rx},${P.vd},${P.ou},#db2777)`,opacity:.25,borderRadius:2}}/>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {passos.map((p,i)=>(
            <Reveal key={i} delay={i*55}>
              <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:44}}>
                  <div style={{width:44,height:44,borderRadius:14,background:`${p.cor}22`,border:`2px solid ${p.cor}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,zIndex:1}}>{p.emoji}</div>
                  <div style={{fontSize:9,color:p.cor,fontWeight:800,marginTop:3}}>{p.n}</div>
                </div>
                <div style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:14,padding:"13px 15px",border:"1px solid rgba(255,255,255,.07)",borderLeft:`3px solid ${p.cor}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:14,color:P.br}}>{p.titulo}</div>
                    <span style={{background:`${p.cor}18`,border:`1px solid ${p.cor}40`,borderRadius:20,padding:"2px 9px",fontSize:9,fontWeight:700,color:p.cor,flexShrink:0,marginLeft:8,whiteSpace:"nowrap"}}>{p.link}</span>
                  </div>
                  <div style={{fontSize:11,color:P.ci,lineHeight:1.6}}>{p.desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

function QRSection(){
  return(
    <div style={{padding:"52px 24px",background:`linear-gradient(135deg,#0a1a3a,#0f2850)`}}>
      <SecTit tag="Tecnologia" titulo="Identificação Digital" icon="📱"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:32}}>
        {[
          {emoji:"🎯",titulo:"Acesso à Promoção",sub:"Painel da lotérica — permanente",cor:P.ou,desc:"Acessado via link ou identificação fixa. Exposto no balcão e materiais de divulgação. Abre o regulamento e inicia o cadastro do cliente.",passos:["Cliente acessa o app","Lê o regulamento","Faz o cadastro","Começa a participar"]},
          {emoji:"📲",titulo:"Identificação da Operadora",sub:"Atendimento Personalizado",cor:P.vd,desc:"O cliente seleciona quem o atendeu. Isso gera transparência e permite o ranking de produtividade e qualidade das operadoras.",passos:["Seleciona operadora","Digita código (se necessário)","Formulário liberado","Vincula ao atendimento"]},
        ].map((q,i)=>(
          <Reveal key={i} delay={i*120}>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:20,border:`1px solid ${q.cor}33`,padding:20,height:"100%",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:q.cor}}/>
              <div style={{fontSize:34,marginBottom:10}}>{q.emoji}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:15,color:P.br,marginBottom:3}}>{q.titulo}</div>
              <div style={{fontSize:10,color:q.cor,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:11}}>{q.sub}</div>
              <div style={{fontSize:11,color:P.ci,lineHeight:1.7,marginBottom:14}}>{q.desc}</div>
              {q.passos.map((p,j)=>(
                <div key={j} style={{display:"flex",gap:9,alignItems:"center",marginBottom:7}}>
                  <div style={{width:20,height:20,borderRadius:6,background:`${q.cor}22`,border:`1px solid ${q.cor}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:q.cor,flexShrink:0}}>{j+1}</div>
                  <div style={{fontSize:11,color:P.ge}}>{p}</div>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function FormularioSection(){
  return(
    <div style={{padding:"52px 24px",background:P.navy}}>
      <SecTit tag="Formulário" titulo="Produtos e Serviços" icon="🛍️"/>
      <Reveal delay={100}>
        <div style={{marginTop:28,background:"rgba(255,255,255,.04)",borderRadius:18,padding:"20px",border:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{marginBottom:18,fontSize:11,color:P.ci,lineHeight:1.7,textAlign:"center"}}>Campos configurados pelo admin · Registro manual com foto · Auditoria humana para garantir integridade</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[
              {cat:"Bancário",cor:"#003478",itens:[{e:"📄",n:"Boleto",v:true},{e:"💰",n:"Depósito",v:true},{e:"💵",n:"Saque",v:true},{e:"📲",n:"PIX",v:true}]},
              {cat:"Jogos",cor:"#7c3aed",rx:true,itens:[{e:"🍀",n:"Lotofácil",v:true},{e:"🎰",n:"Mega-Sena",v:true},{e:"🎲",n:"Quina",v:true},{e:"🎯",n:"Bolão",v:true},{e:"🎮",n:"Outros Jogos"}]},
            ].map((g,gi)=>(
              <div key={gi}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
                  <div style={{width:3,height:15,borderRadius:4,background:g.cor}}/>
                  <div style={{fontWeight:800,fontSize:11,color:g.cor,textTransform:"uppercase",letterSpacing:.5}}>{g.cat}</div>
                  {g.rx&&<div style={{fontSize:9,color:P.rx,fontWeight:700,background:"rgba(124,58,237,.15)",padding:"1px 7px",borderRadius:20}}>⚡ Relâmpago</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {g.itens.map((it,j)=>(
                    <div key={j} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",borderRadius:11,background:"rgba(255,255,255,.06)",border:`1px solid ${g.cor}20`}}>
                      <span style={{fontSize:16}}>{it.e}</span>
                      <span style={{fontSize:11,fontWeight:700,color:P.ge,flex:1}}>{it.n}</span>
                      {g.rx&&<span style={{fontSize:10}}>⚡</span>}
                      {it.v&&<span style={{background:`${g.cor}20`,border:`1px solid ${g.cor}44`,borderRadius:8,padding:"2px 6px",fontSize:9,fontWeight:700,color:g.cor}}>R$</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function AvaliacaoSection(){
  const [nota,setNota]=useState(0);
  return(
    <div style={{padding:"52px 24px",background:P.navy2}}>
      <SecTit tag="Novidade" titulo="Avaliação do Atendimento" icon="⭐"/>
      <Reveal delay={100}>
        <div style={{marginTop:28,background:"rgba(255,255,255,.04)",borderRadius:20,padding:"22px 20px",border:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{textAlign:"center",marginBottom:20,fontSize:12,color:P.ci,lineHeight:1.7}}>
            <strong style={{color:P.br}}>Obrigatória</strong> para confirmar a autenticação. O cliente avalia de <strong style={{color:P.br}}>1 (péssimo)</strong> a <strong style={{color:P.br}}>10 (excelente)</strong>. Nota salva em cada registro de visita.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=>{
              const cor=n>=8?P.vd:n>=5?P.ou:"#e5001e";
              const on=nota===n;
              return(
                <button key={n} onClick={()=>setNota(n)}
                  style={{padding:"14px 0",borderRadius:12,border:`2px solid ${on?cor:"rgba(255,255,255,.12)"}`,background:on?`${cor}22`:"rgba(255,255,255,.04)",cursor:"pointer",fontFamily:"inherit",transition:"all .18s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontWeight:900,fontSize:18,color:on?cor:P.ci}}>{n}</span>
                  <span style={{fontSize:13}}>{n===1?"😞":n<=3?"😕":n<=5?"😐":n<=7?"🙂":n<=9?"😊":"🤩"}</span>
                </button>
              );
            })}
          </div>
          {nota>0&&(
            <div style={{padding:"12px 14px",borderRadius:12,background:nota>=8?"rgba(0,166,81,.15)":nota>=5?"rgba(245,168,0,.12)":"rgba(229,0,30,.12)",border:`1px solid ${nota>=8?"rgba(0,166,81,.3)":nota>=5?"rgba(245,168,0,.3)":"rgba(229,0,30,.3)"}`,fontSize:12,fontWeight:700,color:nota>=8?P.vd:nota>=5?P.ou:"#e5001e",textAlign:"center"}}>
              {nota>=9?"🤩 Excelente! Muito obrigado pelo feedback!":nota>=7?"😊 Ótimo! Agradecemos a avaliação.":nota>=5?"🙂 Obrigado. Continuaremos melhorando.":nota>=3?"😕 Entendemos. Vamos trabalhar nisso!":"😞 Sentimos muito. Sua opinião nos ajuda!"}
            </div>
          )}
          {nota===0&&<div style={{textAlign:"center",color:P.ci,fontSize:11}}>← Toque em uma nota para testar</div>}
          <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
            {[["1–4","Crítico","rgba(229,0,30,.2)","rgba(229,0,30,.4)"],["5–7","Regular","rgba(245,168,0,.12)","rgba(245,168,0,.4)"],["8–10","Excelente","rgba(0,166,81,.12)","rgba(0,166,81,.4)"]].map(([faixa,label,bg,borda])=>(
              <div key={label} style={{background:bg,borderRadius:11,padding:"12px 8px",border:`1px solid ${borda}`}}>
                <div style={{fontWeight:800,fontSize:16,color:P.br,marginBottom:4}}>{faixa}</div>
                <div style={{fontWeight:700,fontSize:11,color:P.ge}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function PremiosSection(){
  return(
    <div style={{padding:"52px 24px",background:`linear-gradient(160deg,#0f1f0a,#0a1628)`}}>
      <SecTit tag="Recompensas" titulo="Sistema de Prêmios" icon="🎁"/>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:32}}>
        <Reveal delay={0}>
          <div style={{borderRadius:22,overflow:"hidden",background:"linear-gradient(135deg,#1a3a0a,#0d2a05)",border:"2px solid rgba(0,166,81,.4)",boxShadow:"0 6px 30px rgba(0,166,81,.15)"}}>
            <div style={{padding:"22px 24px"}}>
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{fontSize:56,lineHeight:1,filter:"drop-shadow(0 4px 12px rgba(0,166,81,.5))"}}>🎟️</div>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:22,color:P.br}}>Raspadinha CAIXA</div>
                    <span style={{background:"rgba(0,166,81,.2)",border:"1px solid rgba(0,166,81,.4)",borderRadius:20,padding:"3px 10px",fontSize:9,fontWeight:800,color:P.vd}}>PRÊMIO PRINCIPAL</span>
                  </div>
                  <div style={{fontSize:13,color:"#86efac",lineHeight:1.7}}>A cada <strong style={{color:P.br}}>15 autenticações</strong> validadas pela auditoria da gerência, o cliente ganha automaticamente 1 Raspadinha CAIXA. Notificação via WhatsApp para retirada no balcão.</div>
                </div>
              </div>
              <div style={{display:"flex",gap:5,marginTop:16,flexWrap:"wrap"}}>
                {Array.from({length:15}).map((_,i)=>(
                  <div key={i} style={{width:28,height:28,borderRadius:8,background:i<10?"rgba(0,166,81,.25)":"rgba(255,255,255,.05)",border:`1.5px solid ${i<10?"rgba(0,166,81,.6)":"rgba(255,255,255,.12)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,boxShadow:i<10?"0 0 8px rgba(0,166,81,.4)":"none"}}>
                    {i<10?"✓":<span style={{color:"rgba(255,255,255,.25)",fontSize:8}}>{i+1}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{borderRadius:22,overflow:"hidden",background:"linear-gradient(135deg,#1a0e35,#0f0922)",border:"2px solid rgba(124,58,237,.4)",boxShadow:"0 6px 30px rgba(124,58,237,.15)"}}>
            <div style={{padding:"20px 24px"}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                <span style={{fontSize:32}}>⚡</span>
                <div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:18,color:P.br}}>Prêmio Relâmpago</div>
                  <div style={{fontSize:11,color:"#c4b5fd",marginTop:2}}>Sorteio automático ao incluir Jogos na visita</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {[["🎟️","Raspadinha","8%"],["🏷️","Cupom","15%"],["🎁","Brinde","10%"],["⚡","2x Pontos","12%"],["🌟","Sorteio","5%"]].map(([em,n,p])=>(
                  <div key={n} style={{background:"rgba(124,58,237,.12)",border:"1px solid rgba(124,58,237,.25)",borderRadius:13,padding:"11px 8px",textAlign:"center"}}>
                    <div style={{fontSize:22,marginBottom:5}}>{em}</div>
                    <div style={{fontWeight:800,fontSize:10,color:P.br,marginBottom:4,lineHeight:1.2}}>{n}</div>
                    <div style={{background:"rgba(124,58,237,.3)",borderRadius:10,padding:"2px 5px",fontSize:10,fontWeight:900,color:"#a78bfa"}}>{p}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div style={{borderRadius:18,background:"linear-gradient(135deg,#1a0a00,#280f00)",border:"2px solid rgba(245,168,0,.3)",padding:"18px 22px",display:"flex",gap:16,alignItems:"center"}}>
            <div style={{fontSize:32}}>🏅</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:16,color:P.ou,marginBottom:5}}>Ranking das Operadoras</div>
              <div style={{fontSize:12,color:"#fcd34d",lineHeight:1.6}}>Todo dia <strong>05</strong>: as 2 operadoras com mais autenticações do mês ganham prêmio especial. Incentivo para toda a equipe de caixa!</div>
            </div>
            <div style={{textAlign:"center",flexShrink:0}}>
              <div style={{fontSize:11,color:P.ou,fontWeight:800}}>🥇 1ª lugar</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontWeight:800}}>🥈 2ª lugar</div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function AppsSection(){
  return(
    <div style={{padding:"52px 24px",background:P.navy2}}>
      <SecTit tag="Aplicativos" titulo="Ecossistema de Apps e Perfis" icon="📱"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:32}}>
        {[
          {titulo:"Master & Gerência",sub:"Controle e Auditoria",emoji:"🖥️",cor:P.vd,features:["📊 Relatórios Gerenciais PDF","⚖️ Validação de Auditoria","🏅 Ranking de qualidade","📢 Central de Notícias","⚙️ Configura formulário","🛡️ Senhas de Segurança","👤 Gestão de Operadores","💾 Logs de Atividade"]},
          {titulo:"Equipe de Operadores",sub:"Atendimento e Resgate",emoji:"👩‍💼",cor:P.az2,features:["🎟️ Liberação de Vouchers","🆔 Token de identificação","📈 Ranking pessoal/geral","📋 Histórico de registros","⚡ Sorteios Relâmpago","🏆 Metas de atendimento"]},
        ].map((a,i)=>(
          <Reveal key={i} delay={i*120}>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:20,border:`1px solid ${a.cor}30`,padding:20,height:"100%",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:a.cor}}/>
              <div style={{fontSize:34,marginBottom:10}}>{a.emoji}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:15,color:P.br,marginBottom:2}}>{a.titulo}</div>
              <div style={{fontSize:10,color:a.cor,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>{a.sub}</div>
              {a.features.map(f=>(
                <div key={f} style={{display:"flex",gap:8,marginBottom:7,fontSize:11,color:P.ge}}>
                  <span style={{flexShrink:0}}>{f.slice(0,2)}</span>
                  <span>{f.slice(2)}</span>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function GestaoSection(){
  return(
    <div style={{padding:"52px 24px",background:P.navy2}}>
      <SecTit tag="Administração" titulo="Gestão e Inteligência" icon="⚙️"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:32}}>
        <Reveal delay={100}>
          <div style={{background:"rgba(255,255,255,.04)",borderRadius:20,border:`1px solid ${P.az2}44`,padding:22,height:"100%"}}>
            <div style={{fontSize:32,marginBottom:12}}>📊</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:16,color:P.br,marginBottom:8}}>Relatórios e Big Data</div>
            <div style={{fontSize:11,color:P.ci,lineHeight:1.7,marginBottom:15}}>O sistema transforma cada atendimento em um ativo de marketing valioso para a lotérica.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["📄","Relatórios Gerenciais em PDF"],["📈","Gráficos de produtividade"],["🎂","Fidelização: Mimo no Aniversário"],["🔄","Relatórios de fechamento de ciclo"]].map(([em,txt])=>(
                <div key={txt} style={{display:"flex",gap:8,fontSize:11,color:P.ge}}>
                  <span style={{color:P.az2}}>{em}</span><span>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div style={{background:"rgba(255,255,255,.04)",borderRadius:20,border:`1px solid ${P.vd}44`,padding:22,height:"100%"}}>
            <div style={{fontSize:32,marginBottom:12}}>🛡️</div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:16,color:P.br,marginBottom:8}}>Segurança e LGPD</div>
            <div style={{fontSize:11,color:P.ci,lineHeight:1.7,marginBottom:15}}>Arquitetura robusta para proteção de dados sensíveis e conformidade legal.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["🔐","Criptografia de dados"],["📑","Termos de uso e privacidade"],["🚫","Prevenção contra Fraudes"],["👤","Acesso restrito por hierarquia"]].map(([em,txt])=>(
                <div key={txt} style={{display:"flex",gap:8,fontSize:11,color:P.ge}}>
                  <span style={{color:P.vd}}>{em}</span><span>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function NumerosSection(){
  return(
    <div style={{padding:"52px 24px",background:P.navy}}>
      <SecTit tag="Impacto" titulo="Números do Programa" icon="📊"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:32}}>
        {[["15","Visitas para 1 prêmio","🎟️",P.vd],["5","Tipos de Relâmpago","⚡",P.rx],["2","Apps digitais","📱",P.az2],["10","Pontos de avaliação","⭐",P.ou]].map(([n,l,em,cor])=>(
          <Reveal key={l}>
            <div style={{textAlign:"center",background:"rgba(255,255,255,.04)",borderRadius:18,padding:"20px 10px",border:`1px solid ${cor}25`}}>
              <div style={{fontSize:24,marginBottom:8}}>{em}</div>
              <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:36,color:cor,lineHeight:1,marginBottom:8,textShadow:`0 0 20px ${cor}55`}}>{n}</div>
              <div style={{fontSize:9,color:P.ci,lineHeight:1.5,textTransform:"uppercase",letterSpacing:.5,fontWeight:700}}>{l}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <div style={{marginTop:22,background:"rgba(255,255,255,.03)",borderRadius:18,border:"1px solid rgba(255,255,255,.07)",padding:"20px 22px"}}>
          <div style={{fontWeight:800,fontSize:12,color:P.ci,textTransform:"uppercase",letterSpacing:1,marginBottom:18}}>📅 Eventos automáticos do sistema</div>
          <div style={{display:"flex",position:"relative"}}>
            <div style={{position:"absolute",top:22,left:22,right:22,height:2,background:`linear-gradient(90deg,${P.vd},${P.ou},${P.rx},${P.az2})`,opacity:.25}}/>
            {[
              {q:"A cada visita",em:"🏪",cor:P.az2,d:"Código → autenticação"},
              {q:"Instantâneo",em:"⚡",cor:P.rx,d:"Sorteio Relâmpago"},
              {q:"15ª visita",em:"🎟️",cor:P.vd,d:"Raspadinha!"},
              {q:"Todo dia 05",em:"🏅",cor:P.ou,d:"Prêmio operadoras"},
            ].map((e,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8,textAlign:"center",padding:"0 4px"}}>
                <div style={{width:44,height:44,borderRadius:"50%",zIndex:1,background:`${e.cor}22`,border:`2px solid ${e.cor}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{e.em}</div>
                <div style={{fontSize:10,fontWeight:800,color:e.cor}}>{e.q}</div>
                <div style={{fontSize:9,color:P.ci,lineHeight:1.4}}>{e.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Rodape(){
  return(
    <div style={{background:"#030810",padding:"36px 24px 28px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${P.az},${P.ou},${P.vd})`}}/>
      <div style={{display:"flex",gap:24,justifyContent:"space-between",flexWrap:"wrap",marginBottom:20}}>
        <div>
          <div style={{fontSize:22,marginBottom:6}}>🏆</div>
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:900,fontSize:17,color:P.br,marginBottom:2}}>Lotérica Central</div>
          <div style={{fontSize:11,color:P.ci}}>CNPJ 20.845.956/0001-00</div>
          <div style={{fontSize:11,color:P.ci,marginTop:2}}>Alagoinhas · Bahia</div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:P.ci,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Inovação e Suporte</div>
          <div style={{fontSize:11,color:P.ge,lineHeight:2}}>Fidelização Inteligente<br/>Suporte FluxAI Digital<br/>Auditoria Multi-nível<br/>WhatsApp Voucher Engine</div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:P.ci,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>CAIXA</div>
          <div style={{fontSize:11,color:P.ge,lineHeight:2}}>Conexão Parceiros<br/>Casa Lotérica<br/>Classificação: TOPÁZIO</div>
        </div>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:16,display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
        <div style={{fontSize:10,color:P.ci,lineHeight:1.6,maxWidth:500}}>Programa sujeito ao regulamento editável. A cada 15 autenticações validadas via auditoria da gerência, o cliente recebe 1 Raspadinha CAIXA. Avaliação do atendimento obrigatória a cada registro. Imagens e comprovantes protegidos.</div>
        <div style={{display:"flex",gap:8}}>{[P.az2,P.vd,P.ou,P.rx].map((cor,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:cor}}/>)}</div>
      </div>
    </div>
  );
}
