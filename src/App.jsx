import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Session from './components/Session';
import Abacus from './components/Abacus';

function App() {
  const [targetApp, setTargetApp] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); // login | dashboard | admin | session

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  const resetAllApps = () => {
    setTargetApp(null);
    setCurrentUser(null);
    setView('login');
  };

  if (!targetApp) {
    return (
      <div className="container" style={{textAlign:'center', marginTop:'100px'}}>
        <h2 style={{fontSize:'36px', color:'#333'}}>¿A qué vas a jugar hoy?</h2>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'30px', marginTop:'40px'}}>
          <div onClick={() => setTargetApp('english')} style={{background:'#4CAF50', color:'white', padding:'40px', borderRadius:'24px', cursor:'pointer', width: '100%', maxWidth: '400px', boxShadow: '0 8px 16px rgba(76, 175, 80, 0.4)'}}>
            <h1 style={{margin:0, fontSize:'36px'}}>Aprender inglés</h1>
          </div>
          <div onClick={() => setTargetApp('abacus')} style={{background:'#E91E63', color:'white', padding:'40px', borderRadius:'24px', cursor:'pointer', width: '100%', maxWidth: '400px', boxShadow: '0 8px 16px rgba(233, 30, 99, 0.4)'}}>
            <h1 style={{margin:0, fontSize:'36px'}}>Ábaco japonés</h1>
          </div>
        </div>
      </div>
    );
  }

  // ==== ZONA ÁBACO JAPONÉS ====
  if (targetApp === 'abacus') {
     return (
        <div>
          <div className="header" style={{display:'flex', justifyContent:'space-between'}}>
            <span>🧮 Entrenador de Ábaco (Soroban)</span>
            <div>
               <button className="btn-secondary" onClick={resetAllApps}>🔙 Cambiar Juego</button>
            </div>
          </div>
          <div className="container" style={{paddingTop: '20px'}}>
             <Abacus onFinish={resetAllApps} />
          </div>
        </div>
     );
  }

  // ==== ZONA INGLÉS ====
  if (view === 'login') {
    return (
      <div className="container" style={{textAlign:'center', marginTop:'100px'}}>
        <div style={{marginBottom: '30px', textAlign: 'left'}}>
          <button className="btn-secondary" style={{padding:'10px 20px', fontSize:'18px'}} onClick={resetAllApps}>← Volver atrás</button>
        </div>
        <h2>¿Quién va a jugar hoy?</h2>
        <div style={{display:'flex', justifyContent:'center', gap:'20px', marginTop:'30px'}}>
          <div onClick={() => {setCurrentUser('Izan'); setView('dashboard')}} style={{background:'white', padding:'40px', borderRadius:'16px', cursor:'pointer'}}>
            <h1 style={{color:'#2196F3', margin:0, fontSize:'40px'}}>Izan</h1>
          </div>
          <div onClick={() => {setCurrentUser('Valeria'); setView('dashboard')}} style={{background:'white', padding:'40px', borderRadius:'16px', cursor:'pointer'}}>
            <h1 style={{color:'#E91E63', margin:0, fontSize:'40px'}}>Valeria</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header" style={{display:'flex', justifyContent:'space-between'}}>
        <span>Aprendiendo Inglés (Base64 System)</span>
        <div>
           {view !== 'dashboard' && <button className="btn-secondary" onClick={()=>setView('dashboard')}>Volver al Panel</button>}
           <button style={{marginLeft:'10px'}} className="btn-secondary" onClick={handleLogout}>Cambiar Niño</button>
        </div>
      </div>
      
      <div className="container">
        {view === 'dashboard' && <Dashboard user={currentUser} onGoSession={()=>setView('session')} onGoAdmin={()=>setView('admin')} />}
        {view === 'admin' && <Admin />}
        {view === 'session' && <Session user={currentUser} onFinish={()=>setView('dashboard')} />}
      </div>
    </div>
  );
}

export default App;
