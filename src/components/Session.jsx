import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { evaluateAnswer } from '../logic/sessionEngine';

export default function Session({ user, onFinish }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(null);
  
  // Opciones falsas precargadas
  const [allLabels, setAllLabels] = useState([]);
  const [frameOptions, setFrameOptions] = useState([]);

  useEffect(() => {
     async function loadSession() {
         try {
             // 1. Cargar vocabulario base para montar las opciones trampa al vuelo
             const { data: itms } = await supabase.from('items').select('label');
             setAllLabels(itms.map(i => i.label));

             // 2. Traer el bloque curado espaciado desde el motor Backend Node
             const res = await fetch('/api/test-session');
             const data = await res.json();
             
             if (!res.ok) throw new Error(data.error || 'Fallo API Test Session');
             
             // Unificamos el bloque final: Primero Exposición pura, luego Evaluación pura
             setQueue([...data.exposure_queue, ...data.evaluation_queue]);
         } catch(e) {
             console.error("Error cargando sesión:", e);
             alert("Error crítico conectando con el motor de sesiones.");
         } finally {
             setLoading(false);
         }
     }
     loadSession();
     
     // Precargar el motor de voces del navegador
     if(window.speechSynthesis) window.speechSynthesis.getVoices();
  }, []);

  const currentFrame = queue[index];

  const playAudio = (text) => {
      if(!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/-/g, ' '));
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
  };

  // Auto-play del audio al pisar un nuevo fotograma
  useEffect(() => {
     if(currentFrame) {
         playAudio(currentFrame.label);
     }
  }, [index, currentFrame]);

  // Mezclador de Opciones para fotogramas de evaluación
  useEffect(() => {
      if (currentFrame && !currentFrame.isExposition && allLabels.length > 0) {
          // Extraemos 2 etiquetas rándom que NO sean la respuesta correcta
          let distractors = allLabels.filter(l => l !== currentFrame.label).sort(() => 0.5 - Math.random()).slice(0, 2);
          let combined = [currentFrame.label, ...distractors].sort(() => 0.5 - Math.random());
          setFrameOptions(combined);
      }
  }, [index, currentFrame, allLabels]);

  const handleExpositionNext = () => {
      setIndex(prev => prev + 1);
  };

  const handleEvaluationAnswer = async (selectedLabel) => {
      const isCorrect = selectedLabel === currentFrame.label;
      const wasNew = currentFrame.status === 'new';

      setShowFeedback(isCorrect);
      
      try {
          // Derivar a la lógica local exportada para guardar transacciones reales en Supabase
          await evaluateAnswer(supabase, currentFrame.id, isCorrect, wasNew);
      } catch (e) {
          console.error("Error guardando progreso", e);
      }

      // Pequeño timeout para aplaudir visualmente antes del siguiente slide
      setTimeout(() => {
           setShowFeedback(null);
           setIndex(prev => prev + 1);
      }, 1000);
  };


  // --- BLOQUES RENDERIZADOS PANTALLA ---
  
  if (loading) return <div style={{textAlign:'center', marginTop:'100px'}}><h2 style={{color:'#666'}}>🤖 Generando tu sesión adaptativa...</h2></div>;

  if (index >= queue.length) {
      return (
         <div style={{textAlign:'center', marginTop:'100px'}}>
             <h1 style={{fontSize:'80px'}}>🏅</h1>
             <h2>Sesión completada</h2>
             <button style={{padding: '15px 30px', fontSize:'20px', background:'#2196F3', color:'white', border:'none', borderRadius:'30px', cursor:'pointer', marginTop:'20px'}} onClick={onFinish}>Volver al inicio</button>
         </div>
      );
  }

  return (
     <div style={{textAlign:'center', padding:'20px', fontFamily:'sans-serif', maxWidth:'800px', margin:'0 auto'}}>
        
        {/* INDICADOR DE FASE: EXPOSICIÓN VS PREGUNTAS */}
        <div style={{marginBottom:'20px', fontSize:'24px', fontWeight:'bold', color: currentFrame.isExposition ? '#FF9800' : '#2196F3'}}>
            {currentFrame.isExposition ? 'Fase 1: Escucha y Memoriza 🧠' : 'Fase 2: ¡A jugar! 🎮'}
        </div>

        {/* PROGRESS BAR MÍNIMA */}
        <div style={{display:'flex', gap:'4px', marginBottom:'40px'}}>
           {queue.map((q, i) => {
               // Diferenciar colores por fase en la barra
               const baseColor = q.isExposition ? '#FFE0B2' : '#BBDEFB';
               const passedColor = q.isExposition ? '#FF9800' : '#2196F3';
               return (
                  <div key={i} style={{flex:1, height:'8px', background: i < index ? passedColor : baseColor, borderRadius:'4px'}} />
               )
           })}
        </div>

        {/* CONTAINER VISUAL DEL ELEMENTO (IMAGEN/GIF) */}
        <div style={{width:'100%', maxWidth:'600px', height:'350px', margin:'0 auto 30px', background:'#f9f9f9', borderRadius:'16px', border:'2px solid #ddd', overflow:'hidden', boxShadow:'0 8px 16px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <img src={currentFrame.image_url} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} alt="Curated Content" />
        </div>

        {/* CONTROL: CARA DE EXPOSICIÓN (MODO ESTUDIO) */}
        {currentFrame.isExposition && (
            <div>
               <div style={{display:'flex', justifyContent:'center', gap:'20px', alignItems:'center'}}>
                   <button style={{padding:'20px', fontSize:'30px', background:'#FF9800', border:'none', borderRadius:'50%', cursor:'pointer', boxShadow:'0 4px 6px rgba(255, 152, 0, 0.4)'}} onClick={() => playAudio(currentFrame.label)}>🔊</button>
                   <button style={{padding:'15px 40px', fontSize:'24px', background:'#4CAF50', color:'white', border:'none', borderRadius:'30px', cursor:'pointer', boxShadow:'0 4px 6px rgba(76, 175, 80, 0.4)'}} onClick={handleExpositionNext}>Siguiente ➔</button>
               </div>
            </div>
        )}

        {/* CONTROL: CARA DE EVALUACIÓN (MODO EXAMEN CIEGO) */}
        {!currentFrame.isExposition && (
            <div>
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
                   {frameOptions.map((optLabel, idx) => (
                       <button 
                         key={idx} 
                         disabled={showFeedback !== null}
                         onClick={() => {
                             // Primero cantamos la etiqueta escogida para reforzar auditivamente siempre
                             playAudio(optLabel);
                             // Disparamos la asimilación real al back
                             handleEvaluationAnswer(optLabel);
                         }} 
                         style={{
                             padding:'30px 20px', 
                             fontSize:'40px', 
                             background:'white', 
                             color: '#333', 
                             border:'3px solid #2196F3', 
                             borderRadius:'16px', 
                             cursor: showFeedback !== null ? 'wait' : 'pointer',
                             boxShadow: '0 4px 6px rgba(33, 150, 243, 0.2)'
                         }}
                       >
                           🔊
                       </button>
                   ))}
               </div>
            </div>
        )}

        {/* FEEDBACK OVERLAY EFECTISTA */}
        {showFeedback !== null && (
           <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background: showFeedback ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
               <span style={{fontSize:'160px'}}>{showFeedback ? '✅' : '❌'}</span>
           </div>
        )}
     </div>
  );
}
