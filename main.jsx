import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Infografico from './infografico_fidelizado.jsx'
import SistemaCliente from './sistema_cliente.jsx'
import SistemaOperador from './sistema_operador.jsx'

function AppMenu() {
  return (
    <div style={{ padding: '40px', fontFamily: '"Nunito", sans-serif', maxWidth: '800px', margin: '0 auto', background: '#f0f4fb', minHeight: '100vh', color: '#0d2137' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>🏆 Lotérica Central - Módulos</h1>
      <p style={{ color: '#5a7a96', marginBottom: '30px' }}>Acesse abaixo cada módulo da aplicação para vê-los rodando na prática:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Link to="/infografico" style={{ textDecoration: 'none' }}>
           <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #dde6f5', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
             <h2 style={{ color: '#003478', margin: '0 0 5px 0' }}>1. Infográfico Fidelizado</h2>
             <p style={{ margin: 0, color: '#5a7a96', fontSize: '14px' }}>A landing page do programa, com a explicação da jornada e prêmios.</p>
           </div>
        </Link>
        
        <Link to="/cliente" style={{ textDecoration: 'none' }}>
           <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #dde6f5', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
             <h2 style={{ color: '#003478', margin: '0 0 5px 0' }}>2. App Cliente</h2>
             <p style={{ margin: 0, color: '#5a7a96', fontSize: '14px' }}>Tela do cliente para registro, visualização de metas e prêmios.</p>
           </div>
        </Link>
        
        <Link to="/operador" style={{ textDecoration: 'none' }}>
           <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #dde6f5', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
             <h2 style={{ color: '#003478', margin: '0 0 5px 0' }}>3. App Operador / Admin</h2>
             <p style={{ margin: 0, color: '#5a7a96', fontSize: '14px' }}>Tela de uso do operador de caixa para código do operador, e dashboard do gestor.</p>
           </div>
        </Link>
      </div>
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: '#5a7a96', opacity: 0.8 }}>
        Desenvolvido por <strong>FluxAI Marketing Digital</strong>
      </div>
    </div>
  )
}

const PASSWORD = 'central2026';

function AccessGate({ children }) {
  const [auth, setAuth] = React.useState(localStorage.getItem('access_granted') === 'true');
  const [pass, setPass] = React.useState('');
  const [error, setError] = React.useState('');

  const handleLogin = () => {
    if (pass === PASSWORD) {
      localStorage.setItem('access_granted', 'true');
      setAuth(true);
    } else {
      setError('Acesso negado. Senha incorreta.');
    }
  };

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#003478', padding: '20px', fontFamily: '"Nunito", sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔐</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0d2137', marginBottom: '10px' }}>Acesso Restrito</h1>
          <p style={{ fontSize: '14px', color: '#5a7a96', marginBottom: '30px' }}>Este é um ambiente de testes da Lotérica Central. Por favor, insira a senha de acesso.</p>
          <input 
            type="password" 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Digite a senha..." 
            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #dde6f5', marginBottom: '15px', fontSize: '16px', textAlign: 'center', outline: 'none' }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 700, marginBottom: '15px' }}>⚠️ {error}</div>}
          <button 
            onClick={handleLogin}
            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#003478', color: '#fff', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}
          >
            Entrar no Sistema
          </button>
          <div style={{ marginTop: '20px', fontSize: '11px', color: '#003478', fontWeight: 900 }}>
            Desenvolvido por <strong>FluxAI Marketing Digital</strong>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AccessGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppMenu />} />
          <Route path="/infografico" element={<Infografico />} />
          <Route path="/cliente" element={<SistemaCliente />} />
          <Route path="/operador" element={<SistemaOperador />} />
        </Routes>
      </BrowserRouter>
    </AccessGate>
  </React.StrictMode>,
)
