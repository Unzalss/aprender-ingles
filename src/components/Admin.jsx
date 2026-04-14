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
  const [searchPages, setSearchPages] = useState({}); // { itemId: pagina_actual }

  // Estados Formulario de Nueva Palabra
  const [newWordLabel, setNewWordLabel] = useState('');
  const [newWordType, setNewWordType] = useState('object');
  const [newWordCategory, setNewWordCategory] = useState('OBJETOS CASA');
  const [newWordTranslationES, setNewWordTranslationES] = useState('');
  const [creatingWord, setCreatingWord] = useState(false);

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

  const handleCreateWord = async () => {
    const cleanLabel = newWordLabel.trim().toLowerCase();
    if (!cleanLabel) return alert("El nombre en inglés no puede estar vacío.");

    if (items.some(i => i.label.toLowerCase() === cleanLabel)) {
       return alert("Esa palabra ya existe en el catálogo. ¡No duplicados!");
    }

    setCreatingWord(true);
    try {
      const payload = {
        id: crypto.randomUUID(),
        label: cleanLabel,
        type: newWordType,
        category: newWordCategory,
        translation_es: newWordTranslationES.trim() || null,
        ambiguity_level: 'low'
      };

      const { data, error } = await supabase.from('items').insert([payload]).select();
      if (error) throw error;
      
      setNewWordLabel('');
      setNewWordTranslationES('');
      
      if (data && data.length > 0) {
         setItems(prev => [...prev, data[0]]);
      } else {
         fetchItems();
      }

    } catch(e) {
      console.error(e);
      alert("Fallo al crear la palabra: " + e.message);
    } finally {
      setCreatingWord(false);
    }
  };

  const handleSeedCatalog = async () => {
    const confirm = window.confirm("¿Volcar catálogo inicial de 300+ palabras saltando los ya existentes?");
    if (!confirm) return;

    setLoading(true);

    const catalog = [
      {label: "bed", type: "object", category: "OBJETOS CASA"}, {label: "pillow", type: "object", category: "OBJETOS CASA"}, {label: "blanket", type: "object", category: "OBJETOS CASA"}, {label: "chair", type: "object", category: "OBJETOS CASA"}, {label: "table", type: "object", category: "OBJETOS CASA"}, {label: "sofa", type: "object", category: "OBJETOS CASA"}, {label: "door", type: "object", category: "OBJETOS CASA"}, {label: "window", type: "object", category: "OBJETOS CASA"}, {label: "wall", type: "object", category: "OBJETOS CASA"}, {label: "floor", type: "object", category: "OBJETOS CASA"}, {label: "lamp", type: "object", category: "OBJETOS CASA"}, {label: "light", type: "object", category: "OBJETOS CASA"}, {label: "TV", type: "object", category: "OBJETOS CASA"}, {label: "remote", type: "object", category: "OBJETOS CASA"}, {label: "phone", type: "object", category: "OBJETOS CASA"}, {label: "charger", type: "object", category: "OBJETOS CASA"}, {label: "clock", type: "object", category: "OBJETOS CASA"}, {label: "mirror", type: "object", category: "OBJETOS CASA"}, {label: "picture", type: "object", category: "OBJETOS CASA"}, {label: "shelf", type: "object", category: "OBJETOS CASA"}, {label: "box", type: "object", category: "OBJETOS CASA"}, {label: "bag", type: "object", category: "OBJETOS CASA"}, {label: "backpack", type: "object", category: "OBJETOS CASA"}, {label: "toy", type: "object", category: "OBJETOS CASA"}, {label: "book", type: "object", category: "OBJETOS CASA"}, {label: "pencil", type: "object", category: "OBJETOS CASA"}, {label: "pen", type: "object", category: "OBJETOS CASA"}, {label: "paper", type: "object", category: "OBJETOS CASA"}, {label: "scissors", type: "object", category: "OBJETOS CASA"}, {label: "glue", type: "object", category: "OBJETOS CASA"}, {label: "cup", type: "object", category: "OBJETOS CASA"}, {label: "glass", type: "object", category: "OBJETOS CASA"}, {label: "plate", type: "object", category: "OBJETOS CASA"}, {label: "bowl", type: "object", category: "OBJETOS CASA"}, {label: "spoon", type: "object", category: "OBJETOS CASA"}, {label: "fork", type: "object", category: "OBJETOS CASA"}, {label: "knife", type: "object", category: "OBJETOS CASA"}, {label: "bottle", type: "object", category: "OBJETOS CASA"}, {label: "napkin", type: "object", category: "OBJETOS CASA"}, {label: "fridge", type: "object", category: "OBJETOS CASA"}, {label: "oven", type: "object", category: "OBJETOS CASA"}, {label: "microwave", type: "object", category: "OBJETOS CASA"}, {label: "sink", type: "object", category: "OBJETOS CASA"}, {label: "tap", type: "object", category: "OBJETOS CASA"}, {label: "water", type: "object", category: "OBJETOS CASA"}, {label: "food", type: "object", category: "OBJETOS CASA"}, {label: "bread", type: "object", category: "OBJETOS CASA"}, {label: "milk", type: "object", category: "OBJETOS CASA"}, {label: "juice", type: "object", category: "OBJETOS CASA"}, {label: "apple", type: "object", category: "OBJETOS CASA"}, {label: "banana", type: "object", category: "OBJETOS CASA"}, {label: "orange", type: "object", category: "OBJETOS CASA"}, {label: "egg", type: "object", category: "OBJETOS CASA"}, {label: "cheese", type: "object", category: "OBJETOS CASA"}, {label: "chicken", type: "object", category: "OBJETOS CASA"}, {label: "rice", type: "object", category: "OBJETOS CASA"}, {label: "pasta", type: "object", category: "OBJETOS CASA"},
      {label: "mom", type: "word", category: "PERSONAS / FAMILIA"}, {label: "dad", type: "word", category: "PERSONAS / FAMILIA"}, {label: "brother", type: "word", category: "PERSONAS / FAMILIA"}, {label: "sister", type: "word", category: "PERSONAS / FAMILIA"}, {label: "baby", type: "word", category: "PERSONAS / FAMILIA"}, {label: "grandma", type: "word", category: "PERSONAS / FAMILIA"}, {label: "grandpa", type: "word", category: "PERSONAS / FAMILIA"}, {label: "boy", type: "word", category: "PERSONAS / FAMILIA"}, {label: "girl", type: "word", category: "PERSONAS / FAMILIA"}, {label: "friend", type: "word", category: "PERSONAS / FAMILIA"}, {label: "teacher", type: "word", category: "PERSONAS / FAMILIA"}, {label: "man", type: "word", category: "PERSONAS / FAMILIA"}, {label: "woman", type: "word", category: "PERSONAS / FAMILIA"}, {label: "child", type: "word", category: "PERSONAS / FAMILIA"}, {label: "I", type: "word", category: "PERSONAS / FAMILIA"}, {label: "you", type: "word", category: "PERSONAS / FAMILIA"}, {label: "he", type: "word", category: "PERSONAS / FAMILIA"}, {label: "she", type: "word", category: "PERSONAS / FAMILIA"}, {label: "we", type: "word", category: "PERSONAS / FAMILIA"}, {label: "they", type: "word", category: "PERSONAS / FAMILIA"},
      {label: "dog", type: "object", category: "ANIMALES"}, {label: "cat", type: "object", category: "ANIMALES"}, {label: "bird", type: "object", category: "ANIMALES"}, {label: "fish", type: "object", category: "ANIMALES"}, {label: "rabbit", type: "object", category: "ANIMALES"}, {label: "horse", type: "object", category: "ANIMALES"}, {label: "cow", type: "object", category: "ANIMALES"}, {label: "pig", type: "object", category: "ANIMALES"}, {label: "sheep", type: "object", category: "ANIMALES"}, {label: "duck", type: "object", category: "ANIMALES"}, {label: "elephant", type: "object", category: "ANIMALES"}, {label: "lion", type: "object", category: "ANIMALES"}, {label: "tiger", type: "object", category: "ANIMALES"}, {label: "monkey", type: "object", category: "ANIMALES"}, {label: "bear", type: "object", category: "ANIMALES"}, {label: "giraffe", type: "object", category: "ANIMALES"}, {label: "zebra", type: "object", category: "ANIMALES"}, {label: "snake", type: "object", category: "ANIMALES"}, {label: "frog", type: "object", category: "ANIMALES"}, {label: "turtle", type: "object", category: "ANIMALES"}, {label: "mouse", type: "object", category: "ANIMALES"}, {label: "spider", type: "object", category: "ANIMALES"}, {label: "bee", type: "object", category: "ANIMALES"}, {label: "butterfly", type: "object", category: "ANIMALES"}, {label: "ant", type: "object", category: "ANIMALES"},
      {label: "red", type: "word", category: "COLORES"}, {label: "blue", type: "word", category: "COLORES"}, {label: "green", type: "word", category: "COLORES"}, {label: "yellow", type: "word", category: "COLORES"}, {label: "pink", type: "word", category: "COLORES"}, {label: "purple", type: "word", category: "COLORES"}, {label: "brown", type: "word", category: "COLORES"}, {label: "black", type: "word", category: "COLORES"}, {label: "white", type: "word", category: "COLORES"}, {label: "grey", type: "word", category: "COLORES"},
      {label: "one", type: "word", category: "NÚMEROS"}, {label: "two", type: "word", category: "NÚMEROS"}, {label: "three", type: "word", category: "NÚMEROS"}, {label: "four", type: "word", category: "NÚMEROS"}, {label: "five", type: "word", category: "NÚMEROS"}, {label: "six", type: "word", category: "NÚMEROS"}, {label: "seven", type: "word", category: "NÚMEROS"}, {label: "eight", type: "word", category: "NÚMEROS"}, {label: "nine", type: "word", category: "NÚMEROS"}, {label: "ten", type: "word", category: "NÚMEROS"}, {label: "more", type: "word", category: "NÚMEROS"}, {label: "less", type: "word", category: "NÚMEROS"}, {label: "many", type: "word", category: "NÚMEROS"}, {label: "few", type: "word", category: "NÚMEROS"}, {label: "all", type: "word", category: "NÚMEROS"},
      {label: "big", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "small", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "tall", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "short", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "long", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "round", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "square", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "circle", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "line", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "full", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "empty", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "same", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "different", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "open", type: "word", category: "FORMAS / TAMAÑOS"}, {label: "closed", type: "word", category: "FORMAS / TAMAÑOS"},
      {label: "eat", type: "command", category: "VERBOS BÁSICOS"}, {label: "drink", type: "command", category: "VERBOS BÁSICOS"}, {label: "sleep", type: "command", category: "VERBOS BÁSICOS"}, {label: "sit", type: "command", category: "VERBOS BÁSICOS"}, {label: "stand", type: "command", category: "VERBOS BÁSICOS"}, {label: "walk", type: "command", category: "VERBOS BÁSICOS"}, {label: "run", type: "command", category: "VERBOS BÁSICOS"}, {label: "jump", type: "command", category: "VERBOS BÁSICOS"}, {label: "stop", type: "command", category: "VERBOS BÁSICOS"}, {label: "go", type: "command", category: "VERBOS BÁSICOS"}, {label: "come", type: "command", category: "VERBOS BÁSICOS"}, {label: "look", type: "command", category: "VERBOS BÁSICOS"}, {label: "see", type: "command", category: "VERBOS BÁSICOS"}, {label: "watch", type: "command", category: "VERBOS BÁSICOS"}, {label: "hear", type: "command", category: "VERBOS BÁSICOS"}, {label: "listen", type: "command", category: "VERBOS BÁSICOS"}, {label: "touch", type: "command", category: "VERBOS BÁSICOS"}, {label: "take", type: "command", category: "VERBOS BÁSICOS"}, {label: "give", type: "command", category: "VERBOS BÁSICOS"}, {label: "put", type: "command", category: "VERBOS BÁSICOS"}, {label: "close", type: "command", category: "VERBOS BÁSICOS"}, {label: "turn", type: "command", category: "VERBOS BÁSICOS"}, {label: "push", type: "command", category: "VERBOS BÁSICOS"}, {label: "pull", type: "command", category: "VERBOS BÁSICOS"}, {label: "carry", type: "command", category: "VERBOS BÁSICOS"}, {label: "drop", type: "command", category: "VERBOS BÁSICOS"}, {label: "throw", type: "command", category: "VERBOS BÁSICOS"}, {label: "catch", type: "command", category: "VERBOS BÁSICOS"}, {label: "play", type: "command", category: "VERBOS BÁSICOS"}, {label: "work", type: "command", category: "VERBOS BÁSICOS"}, {label: "help", type: "command", category: "VERBOS BÁSICOS"}, {label: "clean", type: "command", category: "VERBOS BÁSICOS"}, {label: "wash", type: "command", category: "VERBOS BÁSICOS"}, {label: "cut", type: "command", category: "VERBOS BÁSICOS"}, {label: "cook", type: "command", category: "VERBOS BÁSICOS"}, {label: "read", type: "command", category: "VERBOS BÁSICOS"}, {label: "write", type: "command", category: "VERBOS BÁSICOS"}, {label: "draw", type: "command", category: "VERBOS BÁSICOS"}, {label: "talk", type: "command", category: "VERBOS BÁSICOS"}, {label: "say", type: "command", category: "VERBOS BÁSICOS"}, {label: "ask", type: "command", category: "VERBOS BÁSICOS"}, {label: "answer", type: "command", category: "VERBOS BÁSICOS"}, {label: "call", type: "command", category: "VERBOS BÁSICOS"}, {label: "wait", type: "command", category: "VERBOS BÁSICOS"}, {label: "start", type: "command", category: "VERBOS BÁSICOS"}, {label: "finish", type: "command", category: "VERBOS BÁSICOS"}, {label: "like", type: "command", category: "VERBOS BÁSICOS"}, {label: "want", type: "command", category: "VERBOS BÁSICOS"}, {label: "need", type: "command", category: "VERBOS BÁSICOS"}, {label: "have", type: "command", category: "VERBOS BÁSICOS"}, {label: "get", type: "command", category: "VERBOS BÁSICOS"}, {label: "make", type: "command", category: "VERBOS BÁSICOS"}, {label: "use", type: "command", category: "VERBOS BÁSICOS"}, {label: "find", type: "command", category: "VERBOS BÁSICOS"}, {label: "come back", type: "command", category: "VERBOS BÁSICOS"}, {label: "go out", type: "command", category: "VERBOS BÁSICOS"}, {label: "wake up", type: "command", category: "VERBOS BÁSICOS"}, {label: "lie down", type: "command", category: "VERBOS BÁSICOS"}, {label: "sit down", type: "command", category: "VERBOS BÁSICOS"}, {label: "stand up", type: "command", category: "VERBOS BÁSICOS"},
      {label: "brush teeth", type: "command", category: "ACCIONES DE CASA"}, {label: "shower", type: "command", category: "ACCIONES DE CASA"}, {label: "dress", type: "command", category: "ACCIONES DE CASA"}, {label: "undress", type: "command", category: "ACCIONES DE CASA"}, {label: "eat breakfast", type: "command", category: "ACCIONES DE CASA"}, {label: "go to bed", type: "command", category: "ACCIONES DE CASA"}, {label: "wash hands", type: "command", category: "ACCIONES DE CASA"}, {label: "dry hands", type: "command", category: "ACCIONES DE CASA"}, {label: "open door", type: "command", category: "ACCIONES DE CASA"}, {label: "close door", type: "command", category: "ACCIONES DE CASA"}, {label: "turn on", type: "command", category: "ACCIONES DE CASA"}, {label: "turn off", type: "command", category: "ACCIONES DE CASA"}, {label: "pick up", type: "command", category: "ACCIONES DE CASA"}, {label: "put away", type: "command", category: "ACCIONES DE CASA"}, {label: "tidy up", type: "command", category: "ACCIONES DE CASA"}, {label: "make bed", type: "command", category: "ACCIONES DE CASA"}, {label: "sit here", type: "command", category: "ACCIONES DE CASA"}, {label: "come here", type: "command", category: "ACCIONES DE CASA"}, {label: "go there", type: "command", category: "ACCIONES DE CASA"},
      {label: "in", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "on", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "under", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "behind", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "in front", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "next to", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "inside", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "outside", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "up", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "down", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "here", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "there", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "near", type: "word", category: "POSICIONES / PREPOSICIONES"}, {label: "far", type: "word", category: "POSICIONES / PREPOSICIONES"},
      {label: "happy", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "sad", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "angry", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "tired", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "hungry", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "thirsty", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "hot", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "cold", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "good", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "bad", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "fast", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "slow", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "easy", type: "word", category: "ADJETIVOS / ESTADOS"}, {label: "hard", type: "word", category: "ADJETIVOS / ESTADOS"}
    ];

    try {
      const { data: currentItems, error: fetchError } = await supabase.from('items').select('label');
      if (fetchError) throw fetchError;

      const existingLabels = new Set(currentItems.map(i => i.label.toLowerCase()));
      const rawPayload = [];
      const seen = new Set();

      for (let item of catalog) {
         const cleanLabel = item.label.toLowerCase();
         if (!existingLabels.has(cleanLabel) && !seen.has(cleanLabel)) {
            // Añadir ID generado explicitamente porque la base heredada no tiene auto-incremento nativo
            const payloadItem = {
              ...item,
              id: crypto.randomUUID()
            };
            rawPayload.push(payloadItem);
            seen.add(cleanLabel);
         }
      }

      if (rawPayload.length === 0) {
         alert("El catálogo ya está 100% volcado. No hay items faltantes.");
         setLoading(false);
         return;
      }

      console.log(`[Seed] Inyectando ${rawPayload.length} filas. Payload crudo:`, rawPayload);
      
      const { error: insertError } = await supabase.from('items').insert(rawPayload);
      if (insertError) throw insertError;

      alert(`✅ Carga finalizada: Añadidas ${rawPayload.length} palabras nuevas.`);
      fetchItems();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const buildSearchQuery = (item) => {
    const label = item.label.toLowerCase();

    // Casos especiales mapeados (Verbos difíciles y rutinarios)
    const verbMap = {
      'sit': 'person sitting on chair indoors simple',
      'eat': 'person eating food simple',
      'sleep': 'person sleeping in bed simple',
      'run': 'person running outdoors simple',
      'open': 'person opening door simple',
      'close': 'person closing door simple',
      'wash hands': 'person washing hands sink simple',
      'brush teeth': 'person brushing teeth bathroom simple',
      'jump': 'person jumping simple',
      'walk': 'person walking outdoors simple',
      'talk': 'people talking simple',
      'say': 'person speaking simple',
      'drink': 'person drinking water simple',
      'look': 'person looking simple'
    };

    if (verbMap[label]) {
      return verbMap[label];
    }

    if (item.category === 'COLORES') {
      return `${label} color background solid minimal no objects`;
    }

    if (item.category === 'ANIMALES') {
      return `${label} animal full body simple background`;
    }

    if (item.type === 'object') {
      return `single ${label}, isolated, centered, no background clutter, plain background, studio photo, minimal`;
    }

    if (item.type === 'command') {
      return `single person ${label}, centered, plain background, no objects, clear action, minimal`;
    }

    return `single ${label}, centered, plain background, minimal, no extra objects`;
  };

  // MOCKS Y LÓGICA DE IMÁGENES (Fase 4: Búsqueda Semántica Pexels Activa)
  const handleSearchImages = async (item, forceReset = false) => {
    setBusyItems(prev => ({ ...prev, [item.id]: true }));
    try {
      const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
      
      if (!apiKey || apiKey.includes("tu_pexels_key") || apiKey.trim() === "") {
        console.error("❌ Falta VITE_PEXELS_API_KEY. Debes configurar la clave en las Environment Variables de Vercel (y regenerar el despliegue) o en tu .env.local local.");
        alert("Falta configurar la API Key real de Pexels. Revisa la consola.");
        return;
      }

      let currentPage = forceReset ? 1 : (searchPages[item.id] || 0) + 1;
      setSearchPages(prev => ({ ...prev, [item.id]: currentPage }));

      const q = buildSearchQuery(item);

      const params = new URLSearchParams({
        query: q,
        per_page: 20, // Pedir buffer grande para aplicar filtrado geométrico local
        page: currentPage.toString(),
      });

      console.log(`[Admin Pexels] 🔍 Buscando en Pexels con query enriquecida: "${q}"...`);
      const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
         headers: { Authorization: apiKey }
      });
      
      if (!response.ok) {
         const errText = await response.text();
         console.error(`[Admin Pexels] 💥 Fallo de API: ${response.status}`, errText);
         throw new Error(`Pexels devolvió ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[Admin Pexels] ✅ Pexels devolvió ${data.photos?.length || 0} fotos en bruto.`);
      
      if (!data.photos || data.photos.length === 0) {
         alert("No se encontraron imágenes en Pexels para esta palabra (prueba Pág 1 u otra vía).");
         setBusyItems(prev => ({ ...prev, [item.id]: false }));
         return;
      }

      // Filtrado Básico: Descartamos apaisadas anchas agresivas. Buscamos ratio equilibrado.
      const validPhotos = data.photos.filter(p => p.width / p.height < 1.6 && p.width / p.height > 0.5);
      console.log(`[Admin Pexels] 🧹 Ratio depurado. Quedan ${validPhotos.length} utilitarias de ${data.photos.length}`);

      // Usamos el fallback a la lista sucia original si el ratio-filter ahogó todo
      const fallback = validPhotos.length >= 5 ? validPhotos : data.photos;
      const urls = fallback.slice(0, 5).map(hit => hit.src.medium || hit.src.original);

      setCandidates(prev => ({ ...prev, [item.id]: urls }));
      setSelectedCandidate(prev => ({ ...prev, [item.id]: urls[0] }));

    } catch (e) {
      console.error("[Admin Buscar] Error crítico:", e);
      alert("Fallo al buscar en Pexels. Revisa la consola.");
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

  const handleFileUpload = async (event, itemId) => {
    const file = event.target.files[0];
    if (!file) return;

    // Resetear input localmente para permitir subir el mismo archivo si hay error
    event.target.value = null;

    if (file.size > 5 * 1024 * 1024) { // límite de 5MB
       alert("El archivo es demasiado pesado (máximo 5MB).");
       return;
    }

    setBusyItems(prev => ({ ...prev, [itemId]: true }));

    try {
      const extension = file.name.split('.').pop().toLowerCase();
      const contentType = file.type;

      // Convertir a base64 localmente
      const reader = new FileReader();
      reader.onloadend = async () => {
         try {
            const result = reader.result;
            const base64String = result.split(',')[1];
            
            console.log(`[Admin Upload] 📤 Subiendo archivo manual: ${file.name}`);
            const response = await fetch('/api/save-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId, base64Data: base64String, contentType, extension })
            });
            
            // Check HTML vite proxy bug fallback
            const respContentType = response.headers.get("content-type");
            if (respContentType && respContentType.includes("text/html")) {
               throw new Error("Dev Local Issue: /api devolvió HTML.");
            }

            if (!response.ok) {
               const errData = await response.json();
               throw new Error(errData.error || "Error subiendo archivo");
            }

            const data = await response.json();
            const publicUrl = data.publicUrl;
            console.log(`[Admin Upload] ✅ Subida terminada. URL: ${publicUrl}`);

            const { error: dbError } = await supabase
              .from('items')
              .update({ image_url: publicUrl })
              .eq('id', itemId);

            if (dbError) throw dbError;

            // Actualizar vista local
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, image_url: publicUrl } : i));
            setImageErrors(prev => { const n = { ...prev }; delete n[itemId]; return n; });
            
         } catch (e) {
            console.error(e);
            alert("Error procesando imagen: " + e.message);
         } finally {
            setBusyItems(prev => ({ ...prev, [itemId]: false }));
         }
      };
      
      reader.onerror = () => {
         throw new Error("No se pudo leer el archivo localmente.");
      };

      reader.readAsDataURL(file);

    } catch (e) {
      console.error(e);
      alert("Error al subir archivo: " + e.message);
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

  // TAREA DE AUTO-BÚSQUEDA SILENCIOSA ESPACIADA
  const [autoSearchDone, setAutoSearchDone] = useState(false);

  useEffect(() => {
     if (items.length > 0 && !autoSearchDone) {
        setAutoSearchDone(true);
        const missing = items.filter(i => isBadImageUrl(i.image_url));
        
        // Disparamos con retraso en cascada para no colapsar la cuota API (1000ms / req)
        missing.forEach((item, index) => {
            setTimeout(() => {
                // Solo si el usuario no ha pinchado ya buscar manualmente
                if (!candidates[item.id]) { 
                   handleSearchImages(item);
                }
            }, index * 1000); 
        });
     }
  }, [items, autoSearchDone]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{margin:0}}>🛠️ Admin de Imágenes (V2)</h2>
          <button onClick={handleSeedCatalog} disabled={loading} style={{ background: '#f57c00', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
             {loading ? 'Cargando DB...' : '🔧 Cargar Catálogo (Seguro)'}
          </button>
        </div>
        <div style={{fontSize:'14px', color:'#388E3C', fontWeight:'bold'}}>Integración Supabase Storage Activa ✅</div>
      </div>

      {/* BLOQUE DE CREAR NUEVA PALABRA */}
      <div style={{ background: '#f5f7fa', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e0e5ec', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Palabra (Inglés) *</label>
          <input type="text" value={newWordLabel} onChange={e => setNewWordLabel(e.target.value)} placeholder="Ej. pencil" style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc', boxSizing:'border-box'}} />
        </div>
        
        <div style={{ flex: '1 1 120px' }}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Tipo *</label>
          <select value={newWordType} onChange={e => setNewWordType(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}>
            <option value="object">object</option>
            <option value="word">word</option>
            <option value="command">command</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Categoría *</label>
          <select value={newWordCategory} onChange={e => setNewWordCategory(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}}>
            <option value="OBJETOS CASA">OBJETOS CASA</option>
            <option value="PERSONAS / FAMILIA">PERSONAS / FAMILIA</option>
            <option value="ANIMALES">ANIMALES</option>
            <option value="COLORES">COLORES</option>
            <option value="NÚMEROS">NÚMEROS</option>
            <option value="FORMAS / TAMAÑOS">FORMAS / TAMAÑOS</option>
            <option value="VERBOS BÁSICOS">VERBOS BÁSICOS</option>
            <option value="ACCIONES DE CASA">ACCIONES DE CASA</option>
            <option value="POSICIONES / PREPOSICIONES">POSICIONES / PREPOSICIONES</option>
            <option value="ADJETIVOS / ESTADOS">ADJETIVOS / ESTADOS</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Traducción (Opcional)</label>
          <input type="text" value={newWordTranslationES} onChange={e => setNewWordTranslationES(e.target.value)} placeholder="Ej. lápiz" style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc', boxSizing:'border-box'}} />
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <button onClick={handleCreateWord} disabled={creatingWord} style={{ background: '#388E3C', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: creatingWord ? 'wait' : 'pointer', fontWeight: 'bold' }}>
             {creatingWord ? 'Creando...' : '➕ Añadir Palabra'}
          </button>
        </div>
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
                      🔍 Buscar 5 {searchPages[i.id] > 1 ? `(Pág ${searchPages[i.id] + 1})` : ''}
                    </button>
                    {searchPages[i.id] > 1 && (
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
                    <label style={{ display:'inline-block', padding: '8px 12px', background: '#ec407a', color: 'white', border: 'none', borderRadius: '6px', cursor: busyItems[i.id] ? 'wait' : 'pointer', fontSize:'13px', fontWeight:'bold' }}>
                      📁 Subir Local
                      <input 
                        type="file" 
                        accept=".png,.jpg,.jpeg,.webp,.gif" 
                        style={{ display: 'none' }} 
                        disabled={busyItems[i.id]}
                        onChange={(e) => handleFileUpload(e, i.id)} 
                      />
                    </label>
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
