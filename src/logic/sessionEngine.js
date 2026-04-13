/**
 * MOTOR DE APRENDIZAJE: REPETICIÓN ESPACIADA (Fase 2)
 * Se ejecuta al iniciar una sesión para calcular el array de 30 elementos óptimos.
 */
export async function getSessionItems(supabaseClient) {
  // 1. Extraer ítems válidos (ignoramos los que aún no tengan imagen salvada)
  const { data, error } = await supabaseClient
    .from('items')
    .select('*')
    .not('image_url', 'is', null);

  if (error) throw error;

  // 2. Clasificación Base
  const mastereds = data.filter(i => i.status === 'mastered');
  let learnings = data.filter(i => i.status === 'learning');
  let news = data.filter(i => i.status === 'new' || !i.status);

  // 3. Extracción de News limitados a 3 (barajados al azar)
  news = news.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  const sessionQueue = [];

  // PUSH NEWS: 3 Exposiciones (mudas/estudio) + 1 Evaluación
  news.forEach(n => {
    sessionQueue.push({ ...n, isExposition: true, sessionUuid: crypto.randomUUID() });
    sessionQueue.push({ ...n, isExposition: true, sessionUuid: crypto.randomUUID() });
    sessionQueue.push({ ...n, isExposition: true, sessionUuid: crypto.randomUUID() });
    sessionQueue.push({ ...n, isExposition: false, sessionUuid: crypto.randomUUID() });
  });

  const slotsTaken = sessionQueue.length;
  const slotsRemaining = 30 - slotsTaken;

  // 4. Selección de Learnings priorizados
  // Orden = fallados o con 0 racha primero. Luego, los que tengan un last_seen_at más antiguo (nulls primero)
  let priorityLearnings = learnings.sort((a, b) => {
     const countA = a.correct_count || 0;
     const countB = b.correct_count || 0;

     if (countA === 0 && countB !== 0) return -1;
     if (countB === 0 && countA !== 0) return 1;
     
     // Empate: miramos antigüedad de vista
     const dA = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
     const dB = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
     return dA - dB;
  });

  const selectedLearnings = priorityLearnings.slice(0, slotsRemaining);
  selectedLearnings.forEach(L => {
    sessionQueue.push({ ...L, isExposition: false, sessionUuid: crypto.randomUUID() });
  });

  // Si no hay suficientes learnings o news para llegar a 30 (ej. fin de bloque), extraemos masters al azar.
  if (sessionQueue.length < 30) {
      let masterFills = mastereds.sort(() => 0.5 - Math.random()).slice(0, 30 - sessionQueue.length);
      masterFills.forEach(M => {
          sessionQueue.push({ ...M, isExposition: false, isReview: true, sessionUuid: crypto.randomUUID() });
      });
  }

  // 5. Mezcla y Separación Espaciada (anti-colapso consecutivo)
  // Intenta separar las interacciones de un mismo item lo máximo posible.
  let finalQueue = [];
  let tempQueue = [...sessionQueue].sort(() => 0.5 - Math.random());
  
  while(tempQueue.length > 0) {
     let placed = false;
     for (let i = 0; i < tempQueue.length; i++) {
        const item = tempQueue[i];
        const lastPlaced = finalQueue.length > 0 ? finalQueue[finalQueue.length - 1] : null;

        // Si el elemento es distinto al último que pusimos en cola, es legal colocarlo.
        if (!lastPlaced || lastPlaced.id !== item.id) {
           finalQueue.push(item);
           tempQueue.splice(i, 1);
           placed = true;
           break;
        }
     }
     
     // Failsafe: Si todos los que quedan son el mismo bloque (ej al final), lo fuerza arrastrándolos.
     if (!placed) {
        finalQueue.push(tempQueue.splice(0, 1)[0]); 
     }
  }

  // Mantenimiento de BD de un solo lote: Actulizamos la fecha global de vista
  const uniqueIdsAssigned = [...new Set(finalQueue.map(f => f.id))];
  if (uniqueIdsAssigned.length > 0) {
      await supabaseClient.from('items').update({ last_seen_at: new Date().toISOString() }).in('id', uniqueIdsAssigned);
  }

  return finalQueue;
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
