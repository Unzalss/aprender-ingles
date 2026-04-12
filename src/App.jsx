import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Session from './components/Session';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); // login | dashboard | admin | session

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  if (view === 'login') {
    return (
      <div className="container" style={{textAlign:'center', marginTop:'100px'}}>
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
