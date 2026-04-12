import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Session({ user, onFinish }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null); 
  const [globalItems, setGlobalItems] = useState([]);
  const [globalProg, setGlobalProg] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const { data: itms, error: itmErr } = await supabase.from('items').select('*');
        if (itmErr) throw itmErr;

        const { data: pList, error: pErr } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user);
        if (pErr) throw pErr;

        let prog = {};
        pList.forEach(p => { 
          prog[p.item_id] = {
            state: p.state,
            valid_success_days_count: p.valid_success_days_count,
            last_success_date: p.last_success_date,
            success_count: p.success_count,
            fail_count: p.fail_count
          }; 
        });
        
        itms.forEach(i => {
            if(!prog[i.id]) prog[i.id] = { state: 'new', valid_success_days_count: 0, last_success_date: null, success_count: 0, fail_count: 0 };
        });
        
        buildSession(itms, prog);
        setGlobalItems(itms);
        setGlobalProg(prog);
        
        if(window.speechSynthesis) window.speechSynthesis.getVoices();
      } catch (e) {
        console.error("Error cargando sesión", e);
      }
    }
    loadData();
  }, [user]);

  const current = queue.length > 0 && index < queue.length ? queue[index] : null;
  const item = current ? current.item : null;

  const playAudio = (text) => {
      if(!window.speechSynthesis) return;
      window.speechSynthesis.cancel(); 
      const u = new SpeechSynthesisUtterance(text.replace(/-/g, ' '));
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
  };

  useEffect(() => {
     if(current && (current.mode === 'learn' || current.mode === 'image') && item) {
         playAudio(item.label);
     }
  }, [index, current, item]);

  const buildSession = (items, prog) => {
    let qLearn = [];
    let qPractice = [];
    
    let elegibles = items.sort(() => 0.5 - Math.random());
    
    let news = elegibles.filter(i => prog[i.id].state === 'new');
    let lrns = elegibles.filter(i => prog[i.id].state === 'learning').slice(0, 5);
    let msts = elegibles.filter(i => prog[i.id].state === 'mastered').slice(0, 2);
    
    let pickedNews = [];
    pickedNews.push(...news.filter(i=>i.type==='word').slice(0,3));
    pickedNews.push(...news.filter(i=>i.type!=='word').slice(0,1));
    
    pickedNews.forEach(i => { 
        qLearn.push({ item: i, mode: 'learn' }); 
        qPractice.push({ item: i, mode: 'text' }); 
    });
    
    [...lrns, ...msts].forEach(i => { 
        qPractice.push({ item: i, mode: i.type==='command' ? 'image' : 'text' }); 
    });
    
    setQueue([...qLearn, ...qPractice.sort(() => 0.5 - Math.random())]);
  };

  const getWikiUrlForTerm = async (term) => {
      try {
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
          if (!res.ok) return null;
          const data = await res.json();
          if (!data.thumbnail) return null;
          
          const url = data.thumbnail.source;
          const urlLower = url.toLowerCase();
          
          // Heurística de depuración: bloquear cuadros, arte, pinturas o dibujos
          const badKeywords = ['painting', 'art', 'drawing', 'illustration', 'sketch', 'portrait', 'museum'];
          if (badKeywords.some(bad => urlLower.includes(bad))) {
              return null; // Descartamos la imagen y forzamos a probar la siguiente
          }
          
          return url;
      } catch (e) { return null; }
  };

  const buildImageSearchQueries = (item) => {
      const raw = (item.label || "").toLowerCase().replace(/-/g, ' ').trim();
      const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'el', 'la', 'los', 'las', 'en', 'un', 'una', 'unos', 'unas', 'por', 'con', 'para'];
      let words = raw.split(' ').filter(w => !stopWords.includes(w));
      
      if (item.type === 'object' || item.type === 'word') {
          const main = words[words.length - 1]; 
          return [
              `${raw} isolated`,
              `${raw} white background`,
              `colorful ${raw}`,
              `kids ${raw}`,
              `${raw} toy`,
              `${raw} object`, 
              `${raw} furniture`, 
              `simple ${raw}`,
              `bedroom ${raw}`, 
              `wooden ${raw}`, 
              `${raw} fruit`, 
              `yellow ${raw}`,
              `red ${raw}`,
              `${main} isolated`,
              raw, 
              main, 
              `${main} animal`
          ].filter(Boolean);
      }

      let gWords = [...words];
      const gerunds = { 
        'eat':'eating', 'comer':'eating',
        'jump':'jumping', 'saltar':'jumping',
        'run':'running', 'correr':'running',
        'sleep':'sleeping', 'dormir':'sleeping',
        'drink':'drinking', 'beber':'drinking',
        'wash':'washing', 'lavar':'washing',
        'brush':'brushing', 'cepillar':'brushing',
        'sit':'sitting', 'sentar':'sitting',
        'put':'putting', 'poner':'putting',
        'open':'opening', 'abrir':'opening',
        'close':'closing', 'cerrar':'closing',
        'stand':'standing', 'estar':'standing'
      };
      
      if(gerunds[gWords[0]]) gWords[0] = gerunds[gWords[0]];
      const joined = gWords.join(' ');
      
      if (words.length > 2) {
         return [
             `person ${joined}`,
             `${joined}`,
             `${words.slice(1).join(' ')}`,
             `${words[words.length - 1]} ${joined.split(' ')[0]}`
         ];
      } else {
         return [
             `person ${joined}`,
             `child ${joined}`,
             `${joined}`,
             `${words[words.length - 1]} ${joined.split(' ')[0]}`,
             raw
         ];
      }
  };

  const findDifferentImage = async (targetItem, currentUrl) => {
      const searches = buildImageSearchQueries(targetItem);
      
      for (const term of searches) {
          if (!term) continue;
          const newUrl = await getWikiUrlForTerm(term);
          if (newUrl && newUrl !== currentUrl) {
              return newUrl;
          }
      }
      return null;
  };

  const manualChangeImage = async (currentItem) => {
    const url = await findDifferentImage(currentItem, currentItem.image_url);
    
    if(url) {
      const { error } = await supabase
        .from('items')
        .update({ image_url: url })
        .eq('id', currentItem.id);
      
      if (error) {
          console.error("Error actualizando imagen", error);
          return;
      }

      setGlobalItems(prev => prev.map(i => i.id === currentItem.id ? {...i, image_url: url} : i));
      if(queue[index] && queue[index].item.id === currentItem.id) {
          let updatedQueue = [...queue];
          updatedQueue[index].item.image_url = url;
          setQueue(updatedQueue);
      }
    } else {
      alert("No se encontró una imagen adecuada.");
    }
  };

  const handleAnswer = async (id, isCorrect, isIntro) => {
      setShowFeedback(isCorrect);
      let entry = { ...globalProg[id] };
      let today = new Date().toISOString().split('T')[0];
      
      if (isIntro) {
          entry.state = 'learning';
      } else {
          if (isCorrect) {
              if(entry.last_success_date !== today) {
                  entry.valid_success_days_count += 1;
                  entry.last_success_date = today;
              }
              let target = globalItems.find(i=>i.id===id).type === 'word' ? 5 : 6;
              if (entry.valid_success_days_count >= target) {
                  entry.state = 'mastered';
              }
              entry.success_count = (entry.success_count || 0) + 1;
          } else {
              if(entry.state === 'mastered') {
                  entry.state = 'learning';
                  entry.valid_success_days_count = 0; 
              }
              entry.fail_count = (entry.fail_count || 0) + 1;
              setQueue(prevQueue => {
                  let pendingQ = [...prevQueue];
                  pendingQ.push({ item: current.item, mode: current.mode });
                  return pendingQ;
              });
          }
      }
      
      try {
          const { error } = await supabase
              .from('user_progress')
              .upsert({
                  user_id: user,
                  item_id: id,
                  state: entry.state,
                  valid_success_days_count: entry.valid_success_days_count,
                  last_success_date: entry.last_success_date || null,
                  success_count: entry.success_count || 0,
                  fail_count: entry.fail_count || 0,
                  last_practiced: new Date().toISOString()
              }, { onConflict: 'user_id,item_id' });
          
          if (error) throw error;
      } catch(e) {
          console.error("Error guardando progreso", e);
      }

      setGlobalProg(prev => ({...prev, [id]: entry}));
      
      setTimeout(() => {
          setShowFeedback(null);
          if (isCorrect || isIntro) {
              setIndex(prev => prev + 1);
          }
      }, 700);
  };

  const SeguroVisual = ({ url, label, onImageClick }) => {
    const [broken, setBroken] = useState(false);
    
    if (broken || !url) {
      return (
        <div style={{ width: '100%', height: '100%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '48px', fontWeight: 'bold', textTransform: 'capitalize', cursor: 'pointer' }} onClick={onImageClick}>
          {label}
        </div>
      );
    }
    
    return <img src={url} alt={label} style={{width:'100%', height:'100%', objectFit:'contain', background:'#f9f9f9', cursor:'pointer'}} onError={() => setBroken(true)} onClick={onImageClick} />;
  };

  if(!queue.length) return <div style={{textAlign:'center', marginTop:'100px'}}><h2 style={{color:'#666'}}>Cargando motor Wiki...</h2></div>;
  if(index >= queue.length) return <div style={{textAlign:'center', marginTop:'100px'}}><h1 style={{fontSize:'80px'}}>🏆</h1><h2>¡Sesión Diaria Superada!</h2><button className="btn-large" onClick={onFinish}>Terminar</button></div>;
  if(!item) return null;

  return (
    <div style={{textAlign:'center', padding:'20px', fontFamily:'sans-serif'}}>
      
      <div style={{display:'flex', flexWrap:'wrap', gap:'5px', padding:'10px', justifyContent:'center', marginBottom:'20px'}}>
         {queue.map((_, i) => (
             <div key={i} style={{flex: '1 0 10%', minWidth:'15px', height:'10px', background: i < index ? '#4CAF50' : '#ddd', borderRadius:'5px'}} />
         ))}
      </div>

      <style>
        {`
          .responsive-img-container {
              position: relative;
              width: 100%;
              margin: 0 auto;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid #ddd;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              background: #f9f9f9;
              display: flex;
              align-items: center;
              justify-content: center;
          }
          @media (min-width: 768px) {
              .responsive-img-container {
                  max-width: 900px;
                  height: 420px;
              }
          }
          @media (max-width: 767px) {
              .responsive-img-container {
                  max-width: 100%;
                  height: 260px;
              }
          }
        `}
      </style>

      {current.mode !== 'image' && (
         <div className="responsive-img-container">
             <div style={{position:'absolute', top:'10px', right:'10px', zIndex: 10, display:'flex', gap:'5px'}}>
               <button style={{padding:'8px 12px', background:'rgba(255, 255, 255, 0.9)', color:'#333', border:'1px solid #aaa', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontWeight:'bold'}} onClick={()=>manualChangeImage(item)}>🔄 Cambiar imagen</button>
             </div>
             
             <SeguroVisual url={item.image_url} label={item.label} onImageClick={() => playAudio(item.label)} />
         </div>
      )}

      {current.mode === 'learn' && (
        <div style={{position:'relative', marginTop:'20px'}}>
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'15px'}}>
              <h2 style={{cursor:'pointer', fontSize:'36px', margin:0, textTransform:'capitalize'}} onClick={()=>playAudio(item.label)}>{item.label}</h2>
              <button style={{padding:'10px 15px', fontSize:'24px', background:'#FF9800', border:'none', borderRadius:'50%', cursor:'pointer'}} onClick={()=>playAudio(item.label)}>🔊</button>
          </div>
          
          <div style={{marginTop:'40px'}}>
              <button style={{padding:'15px 40px', fontSize:'20px', background:'#4CAF50', color:'white', border:'none', borderRadius:'30px', cursor:'pointer'}} onClick={()=>handleAnswer(item.id, true, true)}>¡Entendido!</button>
          </div>
        </div>
      )}

      {current.mode === 'text' && (
        <div style={{maxWidth:'600px', margin:'20px auto'}}>
          <h3 style={{marginBottom:'20px', fontSize:'24px'}}>Selecciona la respuesta:</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
            {
              [item, ...globalItems.filter(i => i.type === item.type && i.id !== item.id).sort(()=>0.5-Math.random()).slice(0, 2)]
              .sort(()=>0.5-Math.random())
              .map(o => (
                 <div key={o.id} style={{display:'flex', gap:'10px'}}>
                    <button style={{flex:1, padding:'15px', fontSize:'20px', border:'2px solid #2196F3', borderRadius:'10px', background:'white', cursor:'pointer', textTransform:'capitalize'}} onClick={() => handleAnswer(item.id, o.id===item.id, false)}>{o.label}</button>
                    <button style={{padding:'15px', fontSize:'20px', border:'none', borderRadius:'10px', background:'#eee', cursor:'pointer'}} onClick={()=>playAudio(o.label)}>🔊</button>
                 </div>
              ))
            }
          </div>
        </div>
      )}

      {current.mode === 'image' && (
         <div style={{maxWidth:'800px', margin:'20px auto'}}>
           <div style={{display:'inline-flex', alignItems:'center', gap:'15px', marginBottom:'30px', background:'#FF9800', padding:'15px 30px', borderRadius:'30px', color:'white', cursor:'pointer', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}} onClick={()=>playAudio(item.label)}>
              <span style={{fontSize:'30px'}}>🔊</span>
              <span style={{fontSize:'24px', fontWeight:'bold', textTransform:'capitalize'}}>¿Dónde está {item.label}?</span>
           </div>
           
           <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'15px'}}>
             {
              [item, ...globalItems.filter(i => i.type === item.type && i.id !== item.id).sort(()=>0.5-Math.random()).slice(0, 1)]
              .sort(()=>0.5-Math.random())
              .map(o => (
                 <div key={o.id} style={{background:'#f0f0f0', borderRadius:'10px', overflow:'hidden', height:'250px', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid transparent', cursor:'pointer'}}>
                     <SeguroVisual url={o.image_url} label={o.label} onImageClick={() => handleAnswer(item.id, o.id===item.id, false)} />
                 </div>
              ))
             }
           </div>
         </div>
      )}

      {showFeedback !== null && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
              <span style={{fontSize:'120px'}}>{showFeedback ? '✅' : '❌'}</span>
          </div>
      )}
    </div>
  );
}
