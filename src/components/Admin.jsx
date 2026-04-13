import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Admin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Estados locales para el sistema de imágenes (Fase 1)
  const [candidates, setCandidates] = useState({}); // { itemId: [url1, url2...] }
  const [selectedCandidate, setSelectedCandidate] = useState({}); // { itemId: url }
  const [busyItems, setBusyItems] = useState({}); // { itemId: boolean }
  const [imageErrors, setImageErrors] = useState({}); // { itemId: boolean }
  const [pixabayPages, setPixabayPages] = useState({}); // { itemId: pagina_actual }

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setItems(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  // MOCKS Y LÓGICA DE IMÁGENES (Fase 3: Búsqueda Pixabay Activa)
  const handleSearchImages = async (item, forceReset = false) => {
    setBusyItems(prev => ({ ...prev, [item.id]: true }));
    try {
      const apiKey = import.meta.env.VITE_PIXABAY_API_KEY;
      
      if (!apiKey || apiKey.includes("tu_pixabay_key") || apiKey.trim() === "") {
        console.error("❌ Falta VITE_PIXABAY_API_KEY. Debes configurar la clave real en las Environment Variables de Vercel (y regenerar el despliegue) o en tu .env.local local.");
        alert("Falta configurar la API Key real de Pixabay. Revisa la consola.");
        return;
      }

      let currentPage = forceReset ? 1 : (pixabayPages[item.id] || 0) + 1;
      setPixabayPages(prev => ({ ...prev, [item.id]: currentPage }));

      // Diferenciamos estrategia: objetos directos vs verbos en acción
      let q = "";
      if (item.type === 'word' || item.type === 'object') {
        q = `${item.label} cartoon cute`; // Enfocado al objeto ilustrado
      } else {
        q = `${item.label} kids action cartoon`; // Intentamos buscar acción
      }

      const params = new URLSearchParams({
        key: apiKey,
        q: q,
        image_type: 'illustration',
        safesearch: 'true',
        per_page: 15, // Pedimos un poco extra para poder filtrar localmente
        page: currentPage.toString(),
      });

      console.log(`[Admin Pixabay] 🔍 Buscando en Pixabay con query: "${q}"...`);
      const response = await fetch(`https://pixabay.com/api/?${params.toString()}`);
      console.log(`[Admin Pixabay] 📡 Status respuesta: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Admin Pixabay] ❌ Texto error:", errorText);
        throw new Error(`Error en red Pixabay: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Admin Pixabay] 📊 Resultados brutos obtenidos:`, data.hits?.length || 0);

      let results = data.hits || [];
      
      // Filtrado automático de apoyo (tags no deseados)
      const badTags = ['dark', 'horror', 'abstract', 'icon', 'logo', 'background', 'seamless'];
      results = results.filter(hit => {
         const tags = hit.tags.toLowerCase();
         return !badTags.some(bad => tags.includes(bad));
      });

      // Tomamos solo las mejores 5
      const finalUrls = results.slice(0, 5).map(h => h.webformatURL);

      if (finalUrls.length === 0) {
         if (item.type !== 'word' && item.type !== 'object') {
             alert("Pixabay apenas tiene ilustraciones claras para esta acción. Te recomendamos usar 'Generar 1' cuando esté disponible.");
         } else {
             alert("No se encontraron resultados claros para esta palabra.");
         }
      }

      setCandidates(prev => ({ ...prev, [item.id]: finalUrls }));
      console.log(`[Admin Pixabay] ✅ Proceso terminado. Candidatos válidos guardados:`, finalUrls.length);
    } catch (e) {
      console.error("[Admin Pixabay] 💥 Catch Error:", e.message || e);
      alert("Fallo al buscar en Pixabay. Revisa la consola.");
    } finally {
      setBusyItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleGenerateImage = async (item) => {
    setBusyItems(prev => ({ ...prev, [item.id]: true }));
    try {
      console.log(`[Admin Generar] ✨ Petición a Backend /api/generate-image -> "${item.label}"`);
      // Llamada al backend en lugar de a OpenAI directamente
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          label: item.label,
          type: item.type
        })
      });

      console.log(`[Admin Generar] 📡 HTTP Status del Backend: ${response.status}`);

      // FIX CATCH: Si se ejecuta en Vite local (npm run dev) sin proxy, Vite de forma predeterminada lanza el index.html
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
         console.error("[Admin Generar] 💥 ERROR: El servidor local de Vite devolvió código HTML en vez de la API. Las rutas /api requieren funcionar en Vercel o configurar un proxy local.");
         throw new Error("Dev Local Issue: /api/ devolvió HTML. Abre la consola.");
      }

      if (!response.ok) {
         const errData = await response.json();
         console.error("[Admin Generar] ❌ Backend retornó error JSON:", errData);
         throw new Error(errData.error || "Error del backend al generar");
      }

      const data = await response.json();
      console.log(`[Admin Generar] ✅ ÉXITO. URL obtenida:`, data.url);
      const generatedUrl = data.url;

      // Se añade a la lista de candidatas (acumulativo por si piden generar varias veces)
      setCandidates(prev => ({
        ...prev,
        [item.id]: [...(prev[item.id] || []), generatedUrl]
      }));

    } catch (e) {
      console.error("[Admin Generar] 💥 Catch Global Error:", e);
      alert("Hubo un error de IA visualizado en consola: " + e.message);
    } finally {
      setBusyItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleSelectCandidate = (itemId, url) => {
    setSelectedCandidate(prev => ({ ...prev, [itemId]: url }));
  };

  const handleSaveImage = async (itemId) => {
     const url = selectedCandidate[itemId];
     if (!url) return;
     
     setBusyItems(prev => ({ ...prev, [itemId]: true }));
     try {
        console.log(`[Admin Guardar] 🚀 Pidiendo al backend que salve la URL: ${url}`);
        // 1 & 2 & 3. Descarga remota, Subida a Supabase y Recepción de URL (vía Backend Proxy para evitar CORS)
        const response = await fetch('/api/save-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, itemId })
        });
        
        // Control Vite fallback
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
           throw new Error("Dev Local Issue: /api/save-image devolvió HTML. Usa Vercel o proxy de Vite.");
        }

        const data = await response.json();
        if (!response.ok) {
           console.error("[Admin Guardar] ❌ Backend retornó error:", data);
           throw new Error(data.error || "Error al persistir imagen en el backend");
        }

        const publicUrl = data.publicUrl;
        console.log(`[Admin Guardar] ✅ Nueva URL pública obtenida del Bucket: ${publicUrl}`);

        // 4. Actualizar items.image_url en la BD (Mantenido en el cliente)
        console.log(`[Admin Guardar] 💾 Actualizando DB Frontend...`);
        const { error: dbError } = await supabase
          .from('items')
          .update({ image_url: publicUrl })
          .eq('id', itemId);

        if (dbError) throw dbError;

        console.log(`[Admin Guardar] 🎉 Ítem actualizado en DB correctamente.`);
        // Actualizar UI local limpiando cualquier error cacheado visualmente
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, image_url: publicUrl } : i));
        
        // Limpiar selección de vista
        setCandidates(prev => { const n = { ...prev }; delete n[itemId]; return n; });
        setSelectedCandidate(prev => { const n = { ...prev }; delete n[itemId]; return n; });
        setImageErrors(prev => { const n = { ...prev }; delete n[itemId]; return n; });

     } catch (e) {
        console.error("[Admin Guardar] 💥 Error al guardar imagen:", e);
        alert("Fallo al persistir la imagen en Supabase. Error: " + e.message);
     } finally {
        setBusyItems(prev => ({ ...prev, [itemId]: false }));
     }
  };

  const handleDeleteImage = async (itemId, currentUrl) => {
     if(!window.confirm("¿Eliminar imagen actual de forma permanente?")) return;
     
     setBusyItems(prev => ({ ...prev, [itemId]: true }));
     try {
        // 1. Actualizar DB
        const { error: dbError } = await supabase
          .from('items')
          .update({ image_url: null })
          .eq('id', itemId);

        if (dbError) throw dbError;

        // 2. Intentar borrar archivo físico si es de nuestro storage
        if (currentUrl && currentUrl.includes('.supabase.co')) {
           const path = currentUrl.split('/public/images/')[1];
           if (path) {
              await supabase.storage.from('images').remove([path]);
           }
        }

        setItems(prev => prev.map(i => i.id === itemId ? { ...i, image_url: null } : i));
     } catch (e) {
        console.error("Error al eliminar:", e);
     } finally {
        setBusyItems(prev => ({ ...prev, [itemId]: false }));
     }
  };

  const isBadImageUrl = (url) => {
    if (!url || typeof url !== 'string') return true;
    const value = url.trim().toLowerCase();
    if (!value) return true;
    if (!value.startsWith('http')) return true;
    if (value.includes('loremflickr.com')) return true;
    return false;
  };

  const sortedItems = [...items].sort((a, b) => {
    const aMissing = isBadImageUrl(a.image_url);
    const bMissing = isBadImageUrl(b.image_url);
    const aError = imageErrors[a.id];
    const bError = imageErrors[b.id];
    
    // 0: sin imagen, 1: error, 2: ok
    const aScore = aMissing ? 0 : (aError ? 1 : 2);
    const bScore = bMissing ? 0 : (bError ? 1 : 2);
    
    if (aScore !== bScore) return aScore - bScore;
    return a.id.localeCompare(b.id);
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '20px' }}>
        <h2 style={{margin:0}}>🛠️ Admin de Imágenes (V2)</h2>
        <div style={{fontSize:'14px', color:'#388E3C', fontWeight:'bold'}}>Integración Supabase Storage Activa ✅</div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {sortedItems.map(i => {
          const isMissing = isBadImageUrl(i.image_url);
          const isError = imageErrors[i.id];
          const statusIcon = isMissing ? '🟡' : (isError ? '🔴' : '🟢');

          return (
          <div key={i.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              {/* MINIATURA ACTUAL */}
              <div style={{ width: '120px', height: '120px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border:'1px solid #ddd' }}>
                 {isMissing ? (
                    <span style={{fontSize:'12px', color:'#999', fontWeight:'bold'}}>SIN IMAGEN</span>
                 ) : isError ? (
                    <span style={{fontSize:'14px', color:'#f44336', fontWeight:'bold'}}>ERROR</span>
                 ) : (
                    <img 
                      src={i.image_url} 
                      alt={i.label} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={() => setImageErrors(prev => ({...prev, [i.id]: true}))}
                    />
                 )}
              </div>

              {/* INFO Y BOTONES */}
              <div style={{ flex: 1 }}>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span title={isMissing ? "Sin imagen" : isError ? "Error de carga" : "Carga correcta"}>{statusIcon}</span>
                     <b style={{fontSize:'20px', textTransform:'capitalize'}}>{i.label}</b>
                   </div>
                   <span style={{fontSize:'12px', background:'#eee', padding:'2px 8px', borderRadius:'10px', color:'#666'}}>{i.type}</span>
                 </div>

                 {/* POLITICA DE GENERACION / BUSQUEDA */}
                 <div style={{ marginTop: '15px', marginBottom: '5px', fontSize: '12px', padding: '10px', borderRadius: '6px', backgroundColor: '#fcfcfc', border: '1px solid #eee' }}>
                   {i.type === 'object' || i.type === 'word' ? (
                     <>
                       <div style={{marginBottom: '4px', color: '#388E3C'}}><b>🟢 PRIORIDAD: BUSCAR</b></div>
                       <div style={{color: '#666'}}>Usa primero Buscar 5. Solo generar si no hay opción válida.</div>
                     </>
                   ) : (
                     <>
                       <div style={{marginBottom: '4px', color: '#F57C00'}}><b>🟡 PRIORIDAD: GENERAR</b></div>
                       <div style={{color: '#666'}}>Probablemente necesitarás Generar 1 (acciones son difíciles de encontrar).</div>
                     </>
                   )}
                 </div>
                 
                 <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap:'wrap' }}>
                    <button disabled={busyItems[i.id]} onClick={() => handleSearchImages(i)} style={{ padding: '8px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'13px', fontWeight:'bold' }}>
                      🔍 Buscar 5 {pixabayPages[i.id] > 1 ? `(Pág ${pixabayPages[i.id] + 1})` : ''}
                    </button>
                    {pixabayPages[i.id] > 1 && (
                        <button disabled={busyItems[i.id]} onClick={() => handleSearchImages(i, true)} style={{ padding: '8px 12px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'13px', fontWeight:'bold' }}>
                          🔄 Reset
                        </button>
                    )}
                    <button disabled={busyItems[i.id]} onClick={() => handleGenerateImage(i)} style={{ padding: '8px 12px', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'13px', fontWeight:'bold' }}>
                      ✨ Generar 1
                    </button>
                    {selectedCandidate[i.id] && (
                        <button disabled={busyItems[i.id]} onClick={() => handleSaveImage(i.id)} style={{ padding: '8px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'13px', fontWeight:'bold' }}>
                          💾 Guardar Seleccionada
                        </button>
                    )}
                    {!isBadImageUrl(i.image_url) && (
                        <button disabled={busyItems[i.id]} onClick={() => handleDeleteImage(i.id, i.image_url)} style={{ padding: '8px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize:'13px' }}>
                          🗑️ Eliminar
                        </button>
                    )}
                 </div>
              </div>
            </div>

            {/* GALERÍA DE CANDIDATAS */}
            {candidates[i.id] && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#fafafa', borderRadius: '8px', border:'1px dashed #ccc' }}>
                   <div style={{fontSize:'13px', fontWeight:'bold', marginBottom:'10px', color:'#555'}}>Candidatas encontradas:</div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                      {candidates[i.id].map((url, idx) => (
                         <div 
                           key={idx} 
                           onClick={() => handleSelectCandidate(i.id, url)}
                           style={{ 
                             aspectRatio: '1/1', 
                             borderRadius: '6px', 
                             overflow: 'hidden', 
                             cursor: 'pointer', 
                             border: selectedCandidate[i.id] === url ? '4px solid #4CAF50' : '2px solid transparent',
                             boxSizing: 'border-box'
                           }}
                         >
                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         </div>
                      ))}
                   </div>
                   <div style={{marginTop:'10px', display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                      <span style={{fontSize:'10px', color:'#aaa'}}>Imágenes de <a href="https://pixabay.com/" target="_blank" rel="noreferrer" style={{color:'#aaa', textDecoration:'none'}}>Pixabay</a></span>
                      <button onClick={() => setCandidates(prev => { const n = {...prev}; delete n[i.id]; return n; })} style={{fontSize:'12px', background:'none', border:'none', color:'#999', cursor:'pointer', textDecoration:'underline'}}>Cerrar galería</button>
                   </div>
                </div>
            )}

            {busyItems[i.id] && <div style={{fontSize:'12px', color:'#2196F3', marginTop:'10px', textAlign:'center', fontStyle:'italic'}}>Procesando... 🚀</div>}
          </div>
          );
        })}
      </div>
    </div>
  );
}
