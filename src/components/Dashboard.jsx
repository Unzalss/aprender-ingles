import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Dashboard({ user, onGoSession, onGoAdmin }) {
  const [learning, setLearning] = useState([]);
  const [mastered, setMastered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('item_id, state')
          .eq('user_id', user);

        if (error) throw error;

        const lrn = [];
        const mst = [];
        data.forEach(row => {
          if (row.state === 'learning') lrn.push(row.item_id);
          if (row.state === 'mastered') mst.push(row.item_id);
        });
        setLearning(lrn);
        setMastered(mst);
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  return (
    <>
      <h2 style={{textAlign: 'center'}}>Gestor de Progreso - {user}</h2>
      <button className="btn-large" onClick={onGoSession}>▶ Comenzar Sesión Diaria</button>
      
      <div style={{background: 'white', padding: '20px', borderRadius: '12px', marginTop: '20px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
        <h3 style={{color: '#388E3C', borderBottom:'2px solid #E8F5E9', paddingBottom:'10px'}}>📈 En Progreso Activo</h3>
        <div>
          {loading ? <span>Cargando nube...</span> : learning.length > 0 ? learning.map(id => <span key={id} className="content-pill">{id}</span>) : <span style={{color:'#aaa', fontStyle:'italic'}}>Nada en progreso</span>}
        </div>
        
        <h3 style={{color: '#388E3C', borderBottom:'2px solid #E8F5E9', paddingBottom:'10px', marginTop:'30px'}}>⭐ Estructuras Dominadas</h3>
        <div>
          {loading ? <span>Cargando nube...</span> : mastered.length > 0 ? mastered.map(id => <span key={id} className="content-pill">{id}</span>) : <span style={{color:'#aaa', fontStyle:'italic'}}>Tu viaje comienza ahora</span>}
        </div>
      </div>

      <div style={{marginTop: '40px', textAlign: 'center'}}>
        <button className="btn-secondary" style={{background:'#607D8B'}} onClick={onGoAdmin}>⚙️ Panel de Producción Admin</button>
      </div>
    </>
  );
}
