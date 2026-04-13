/**
 * MOTOR DE APRENDIZAJE: REPETICIÓN ESPACIADA (Fase 2)
 * Se ejecuta al iniciar una sesión para calcular el array de 30 elementos óptimos.
 */
export async function getSessionItems(supabaseClient) {
  // 1. Extraer ítems válidos (Filtro base DB)
  const { data, error } = await supabaseClient
    .from('items')
    .select('*')
    .not('image_url', 'is', null);

  if (error) throw error;

  // 1B. Filtro estricto aplicación: Cero palabras sin array_length
  const validData = data.filter(i => i.image_url && i.image_url.trim() !== '');
  if (validData.length === 0) throw new Error("No hay items con imagen asimilada en BD.");

  // 2. Clasificación Base
  const mastereds = validData.filter(i => i.status === 'mastered');
  let learnings = validData.filter(i => i.status === 'learning');
  let news = validData.filter(i => i.status === 'new' || !i.status);

  let priorityLearnings = learnings.sort((a, b) => {
     const countA = a.correct_count || 0;
     const countB = b.correct_count || 0;
     if (countA === 0 && countB !== 0) return -1;
     if (countB === 0 && countA !== 0) return 1;
     const dA = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
     const dB = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
     return dA - dB;
  });

  // TAREA 2: ====== BLOQUE EXPOSICION (30 FIJOS) ======
  let exposureQueue = [];
  let expPool = [...news, ...priorityLearnings, ...mastereds];
  if(expPool.length === 0) expPool = [...validData]; // Paracaídas final

  // Intentamos nutrir el motor de items diversos primero 
  let tNews = [...news].sort(()=>0.5-Math.random()).slice(0, 3); // Límite de 3 nuevas
  let selectedForExp = [...tNews, ...priorityLearnings, ...mastereds].slice(0, 30);
  selectedForExp.forEach(i => exposureQueue.push({ ...i, isExposition: true, sessionUuid: crypto.randomUUID() }));

  // Cierre de array con Padding garantizado
  while(exposureQueue.length < 30) {
      const rd = expPool[Math.floor(Math.random() * expPool.length)];
      exposureQueue.push({ ...rd, isExposition: true, sessionUuid: crypto.randomUUID() });
  }
  
  if(exposureQueue.length > 30) exposureQueue.length = 30; // Failsafe
  exposureQueue = exposureQueue.sort(() => 0.5 - Math.random());

  // TAREA 3: ====== BLOQUE EVALUACION (20 FIJOS) ======
  let evaluationQueue = [];
  let evPool = [...priorityLearnings, ...news, ...mastereds];
  if (evPool.length === 0) evPool = [...validData];

  // Prioridad evaluación: los news que acaban de ver + peores learnings
  let evalCandidates = [...tNews, ...priorityLearnings, ...mastereds].slice(0, 20);
  evalCandidates.forEach(i => evaluationQueue.push({ ...i, isExposition: false, sessionUuid: crypto.randomUUID() }));

  // Cierre de array con Padding garantizado
  while(evaluationQueue.length < 20) {
      const rd = evPool[Math.floor(Math.random() * evPool.length)];
      evaluationQueue.push({ ...rd, isExposition: false, isReview: true, sessionUuid: crypto.randomUUID() });
  }

  if(evaluationQueue.length > 20) evaluationQueue.length = 20; // Failsafe
  evaluationQueue = evaluationQueue.sort(() => 0.5 - Math.random());

  // Anti-Colisión simple (Asegurar que items no se peguen identicos)
  const antiCollision = (arr) => {
     let temp = [...arr];
     let res = [];
     while(temp.length > 0) {
        let placed = false;
        for (let i = 0; i < temp.length; i++) {
           const lastPlaced = res.length > 0 ? res[res.length - 1] : null;
           if (!lastPlaced || lastPlaced.id !== temp[i].id) {
              res.push(temp[i]);
              temp.splice(i, 1);
              placed = true;
              break;
           }
        }
        if (!placed) res.push(temp.splice(0, 1)[0]);
     }
     return res;
  };

  exposureQueue = antiCollision(exposureQueue);
  evaluationQueue = antiCollision(evaluationQueue);

  // Mantenimiento de BD Batch
  const allFinalIds = [...exposureQueue, ...evaluationQueue].map(f => f.id);
  const uniqueIdsAssigned = [...new Set(allFinalIds)];
  if (uniqueIdsAssigned.length > 0) {
      await supabaseClient.from('items').update({ last_seen_at: new Date().toISOString() }).in('id', uniqueIdsAssigned);
  }

  return { exposure_queue: exposureQueue, evaluation_queue: evaluationQueue };
}

/**
 * MOTOR DE EVALUACIÓN
 * Se ejecuta cada vez que el niño toca la pantalla (acierto o fallo), grabando y juzgando el destino.
 */
export async function evaluateAnswer(supabaseClient, itemId, isCorrect) {
   const { data, error } = await supabaseClient.from('items').select('*').eq('id', itemId).single();
   if (error || !data) throw error;

   let { status, correct_count, correct_days, type, ambiguity_level } = data;
   status = status || 'new';
   correct_count = correct_count || 0;
   correct_days = correct_days || [];
   
   const todayDateStr = new Date().toISOString().split('T')[0];

   // Ascenso natural: El primer contacto evaluativo de un new lo consolida siempre en status de trabajo.
   if (status === 'new') {
      status = 'learning';
   }

   if (isCorrect) {
      correct_count += 1;
      
      // Controlar vector diario de Masterizado (solo 1 checkpoint por fecha real)
      if (!correct_days.includes(todayDateStr)) {
         correct_days.push(todayDateStr);
      }

      // Verificación de Maestría por repeticiones distanciadas
      // Objetos: Requieren 5 rachas. Comandos (difíciles): Requieren 6 rachas.
      let requiredMastery = (type === 'command' || ambiguity_level === 'high') ? 6 : 5;
      if (correct_days.length >= requiredMastery) {
         status = 'mastered';
      }

      await supabaseClient.from('items').update({
         status,
         correct_count,
         correct_days,
         last_correct_at: new Date().toISOString()
      }).eq('id', itemId);

   } else {
      // Un fallo es un hard-reset en nuestra metódica
      await supabaseClient.from('items').update({
         status: 'learning',
         correct_count: 0,
         correct_days: []
      }).eq('id', itemId);
   }

   return { status, correct_count, mastered: status === 'mastered' };
}
