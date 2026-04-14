import React, { useState, useEffect } from 'react';

export default function Abacus({ onFinish }) {
  // Estado del Soroban: 5 columnas (Decenas Millar, Unidades Millar, Centenas, Decenas, Unidades)
  // Cada columna guarda su valor decimal (0 - 9)
  const [board, setBoard] = useState([0, 0, 0, 0, 0]);
  
  // Estado del Ejercicio
  const [phase, setPhase] = useState(1);
  const [exerciseText, setExerciseText] = useState("");
  const [targetAnswer, setTargetAnswer] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'incorrect'

  // Generador de ejercicios
  const generateExercise = (p) => {
    let a, b, answer, text;
    switch(p) {
      case 1:
        answer = Math.floor(Math.random() * 10) + 1;
        text = `${answer}`;
        break;
      case 2:
        answer = Math.floor(Math.random() * 100) + 1;
        text = `${answer}`;
        break;
      case 3:
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a + b;
        text = `${a} + ${b}`;
        break;
      case 4:
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        answer = a + b;
        text = `${a} + ${b}`;
        break;
      case 5:
        a = Math.floor(Math.random() * 100) + 1;
        b = Math.floor(Math.random() * 100) + 1;
        answer = a + b;
        text = `${a} + ${b}`;
        break;
      default:
        answer = 1; text = "1";
    }
    setTargetAnswer(answer);
    setExerciseText(text);
    setFeedback(null);
    setBoard([0, 0, 0, 0, 0]);
  };

  // Iniciar al montar
  useEffect(() => {
    generateExercise(phase);
  }, [phase]);

  // Lógica de Abaco Físico
  const handleHeavenClick = (colIndex) => {
    setBoard(prev => {
       const newBoard = [...prev];
       const val = newBoard[colIndex];
       if (val >= 5) {
           newBoard[colIndex] = val - 5;
       } else {
           newBoard[colIndex] = val + 5;
       }
       return newBoard;
    });
  };

  const handleEarthClick = (colIndex, beadIndex) => {
    // beadIndex va de 1 a 4 (1 es la más cercana a la barra central)
    setBoard(prev => {
       const newBoard = [...prev];
       const colVal = newBoard[colIndex];
       const heavenVal = colVal >= 5 ? 5 : 0;
       const earthVal = colVal % 5;
       
       let newEarthVal;
       // Si pulso exactamente la bola que representa el valor actual de la tierra, la bajo a ella sola.
       if (beadIndex === earthVal) {
           newEarthVal = beadIndex - 1;
       } else {
           // Si pulso otra bola, subo todas hasta ese nivel (inclusive)
           newEarthVal = beadIndex;
       }
       
       newBoard[colIndex] = heavenVal + newEarthVal;
       return newBoard;
    });
  };

  // Cálculo a tiempo real
  const getCurrentTotal = () => {
     let total = 0;
     total += board[0] * 10000;
     total += board[1] * 1000;
     total += board[2] * 100;
     total += board[3] * 10;
     total += board[4] * 1;
     return total;
  };

  const currentTotal = getCurrentTotal();

  const handleCheck = () => {
     if (currentTotal === targetAnswer) {
         setFeedback('correct');
     } else {
         setFeedback('incorrect');
     }
  };

  return (
    <div style={{fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', textAlign: 'center'}}>
      
      {/* Controles de Fase */}
      <div style={{display:'flex', justifyContent:'center', gap:'10px', marginBottom:'20px', flexWrap:'wrap'}}>
         {[1,2,3,4,5].map(p => (
            <button 
              key={p} 
              onClick={() => setPhase(p)}
              style={{
                 padding:'10px 20px', 
                 borderRadius:'30px', 
                 border:'none', 
                 cursor:'pointer', 
                 background: phase === p ? '#E91E63' : '#eee', 
                 color: phase === p ? 'white' : '#333',
                 fontWeight: 'bold'
              }}
            >
              Fase {p}
            </button>
         ))}
      </div>

      {/* Zona Ejercicio */}
      <div style={{background: '#fcfcfc', border: '2px dashed #ccc', padding: '20px', borderRadius: '16px', marginBottom: '30px'}}>
         <h2 style={{margin: '0 0 10px 0', color: '#555', fontSize: '24px'}}>Representa este valor:</h2>
         <div style={{fontSize: '64px', fontWeight: 'bold', color: '#2196F3', letterSpacing: '2px'}}>{exerciseText}</div>
      </div>

      {/* Cabecera Soroban */}
      <div style={{marginBottom: '15px'}}>
         <span style={{fontSize: '24px', fontWeight:'bold', color: '#333'}}>Valor en ábaco: <span style={{color: '#E91E63'}}>{currentTotal}</span></span>
      </div>

      {/* SOROBAN VISUAL */}
      <div style={{
          background: '#d7ccc8', 
          border: '12px solid #5d4037', 
          borderRadius: '8px', 
          padding: '20px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '30px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          position: 'relative'
      }}>
         {/* Barra divisoria central (Reckoning bar) */}
         <div style={{
             position: 'absolute', 
             top: '110px', 
             left: 0, 
             right: 0, 
             height: '8px', 
             background: '#3e2723',
             zIndex: 5,
             boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
         }}></div>

         {board.map((colVal, i) => {
             const heavenActive = colVal >= 5;
             const earthVal = colVal % 5;

             return (
               <div key={i} style={{position: 'relative', width: '60px', height: '360px'}}>
                  {/* Vara de la columna */}
                  <div style={{
                      position: 'absolute', 
                      left: '50%', 
                      transform: 'translateX(-50%)', 
                      width: '6px', 
                      height: '100%', 
                      background: '#a1887f',
                      zIndex: 1
                  }}></div>

                  {/* Heaven Bead (Índice 0) */}
                  <div 
                     onClick={() => handleHeavenClick(i)}
                     style={{
                        position: 'absolute',
                        left: '5px',
                        top: heavenActive ? '60px' : '10px',
                        width: '50px',
                        height: '35px',
                        background: heavenActive ? '#ffb300' : '#8d6e63',
                        borderRadius: '25px',
                        border: '2px solid #3e2723',
                        boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'top 0.15s ease-out, background 0.2s'
                     }}
                  ></div>

                  {/* Earth Beads (Índices 1 a 4) */}
                  {[1, 2, 3, 4].map(beadIndex => {
                      // beadIndex = 1 (top earth), 2, 3, 4 (bottom earth)
                      // Activa si earthVal >= beadIndex
                      const isActive = earthVal >= beadIndex;
                      
                      // Posiciones: 
                      // Altura base de todas abajo del todo: 200px + (beadIndex * 35)
                      // Si están activas suben: 140px + (beadIndex * 35)
                      
                      const baseTop = 200 + (beadIndex * 35);
                      const activeTop = 110 + (beadIndex * 35);

                      return (
                         <div 
                           key={beadIndex}
                           onClick={() => handleEarthClick(i, beadIndex)}
                           style={{
                              position: 'absolute',
                              left: '5px',
                              top: isActive ? `${activeTop}px` : `${baseTop}px`,
                              width: '50px',
                              height: '35px',
                              background: isActive ? '#4CAF50' : '#8d6e63',
                              borderRadius: '25px',
                              border: '2px solid #3e2723',
                              boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.3)',
                              cursor: 'pointer',
                              zIndex: 10,
                              transition: 'top 0.15s ease-out, background 0.2s'
                           }}
                         />
                      );
                  })}
               </div>
             );
         })}
      </div>

      {/* Controles y Feedback */}
      <div style={{marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center'}}>
         {feedback === null && (
            <button 
              onClick={handleCheck}
              style={{background:'#4CAF50', color:'white', padding:'20px 40px', borderRadius:'12px', border:'none', cursor:'pointer', fontSize:'24px', fontWeight:'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}
            >
              ✅ Comprobar
            </button>
         )}

         {feedback === 'correct' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
               <div style={{color: '#4CAF50', fontSize: '36px', fontWeight: 'bold'}}>¡Correcto! 🎉</div>
               <button 
                 onClick={() => generateExercise(phase)}
                 style={{background:'#2196F3', color:'white', padding:'15px 30px', borderRadius:'12px', border:'none', cursor:'pointer', fontSize:'20px', fontWeight:'bold'}}
               >
                 Siguiente
               </button>
            </div>
         )}

         {feedback === 'incorrect' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
               <div style={{color: '#f44336', fontSize: '36px', fontWeight: 'bold'}}>Ups, revisa bien ❌</div>
               <button 
                 onClick={() => setFeedback(null)}
                 style={{background:'#FF9800', color:'white', padding:'15px 30px', borderRadius:'12px', border:'none', cursor:'pointer', fontSize:'20px', fontWeight:'bold'}}
               >
                 Reintentar
               </button>
            </div>
         )}
      </div>

    </div>
  );
}
