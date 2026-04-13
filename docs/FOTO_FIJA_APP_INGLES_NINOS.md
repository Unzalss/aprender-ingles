# FOTO FIJA: APP APRENDER INGLÉS (NIÑOS)
*Documento maestro de estado, arquitectura y curación visual.*

---

## 1. OBJETIVO DEL PROYECTO
- **Qué es la app**: Una aplicación interactiva diseñada para la enseñanza y asimilación de vocabulario básico en inglés.
- **Para quién es**: Dirigida inicialmente a dos usuarios infantiles concretos (Izan y Valeria).
- **Qué resuelve**: Facilita el aprendizaje mediante un flujo de retención visual y repetición, registrando métricas de acierto/fallo y la evolución del vocabulario de 'new' a 'mastered'.
- **Alcance actual de la V1**: Aplicación funcional Web/Móvil con Dashboard personal, ciclo de Sesión (preguntas) y un Panel Admin para la curación de contenido y medios.
- **Partes privadas vs. vendibles**:
  - *Privadas/Internas*: Los perfiles harcodeados actuales (Izan/Valeria), el panel Admin y el bucket/base de datos ligados a la instancia en desarrollo.
  - *Vendibles a futuro*: El motor de aprendizaje frontal, la lógica de métricas en sesión y la arquitectura desacoplada en Supabase/Vercel preparada para un escalado a multitenant.

---

## 2. STACK Y ARQUITECTURA ACTUAL
- **Frontend**: React.js (construido con Vite).
- **Hosting**: Vercel.
- **Base de Datos**: Supabase (PostgreSQL).
- **Storage**: Supabase Storage (Bucket público).
- **Backend/API**: Funciones Serverless de Vercel (escritas en Node.js común).
- **Variables de entorno usadas**:
  - `VITE_SUPABASE_URL` (Frontend)
  - `VITE_SUPABASE_ANON_KEY` (Frontend)
  - `VITE_PIXABAY_API_KEY` (Frontend - Búsqueda)
  - `OPENAI_API_KEY` (Backend protegido - Generación)
- **Dependencias exactas por servicio**:
  - *Supabase*: Almacena el esquema SQL (`items`, `user_progress`), expone la DB y aloja físicamente las imágenes en el bucket `images`.
  - *Vercel*: Sirve el paquete empaquetado de React (Frontend) y ejecuta el endpoint invisible `/api/generate-image`.
  - *OpenAI*: Subministra el modelo `dall-e-3` llamado en el backend para crear imágenes bajo demanda.
  - *Pixabay*: API HTTP consumida por el frontend para alimentar el panel de candidatos con dibujos de stock.
- **⚠️ CONFIRMACIÓN**: El SDK y cualquier dependencia o fichero relacionado con Google Firebase **han sido eliminados del proyecto**.

---

## 3. ESTRUCTURA FUNCIONAL ACTUAL
- **Flujo de selección de niño**: Renderizado condicional inicial en `App.jsx` que permite entrar haciendo clic en "Izan" o "Valeria" (sin contraseñas o Firebase Auth, guardando la selección en estado de React).
- **Dashboard / panel (`Dashboard.jsx`)**: Lee `user_progress` para el usuario activo y muestra de forma visual las palabras en estado "new", "learning" y "mastered".
- **Session (`Session.jsx`)**: El motor core. Cruza datos de `items` y `user_progress`. Evalúa aciertos y fallos y hace 'upsert' en la DB cambiando los estados.
- **Admin (`Admin.jsx`)**: Panel de gestión para ver, modificar imágenes y resolver items rotos.
  - *Qué botones existen hoy*: Buscar 5, Generar 1, Guardar seleccionada, Eliminar (imagen).
  - *Buscar 5*: Llama a Pixabay variando el término según sea "objeto" o "comando/verbo" ("cartoon cute" vs "kids action cartoon"), filtra basura visual y pinta 5 miniaturas.
  - *Generar 1*: Llama al endpoint de Vercel `/api/generate-image` que internamente invoca DALL-E 3 produciendo una URL nueva y la coloca en la galería de opciones efímeras.
  - *Guardar seleccionada*: Hace Fetch al Blob de la imagen elegida, la inyecta como `image/png` genérica en Supabase Storage, obtiene el Public Link de Supabase y hace Update del campo `image_url` del ítem específico.
  - *Eliminar*: Pone `image_url = null` en la DB e intenta borrar el archivo físico antiguo del Storage para ahorrar espacio.

---

## 4. BASE DE DATOS ACTUAL
Las tablas están en esquema relacional dentro de Supabase.
- **Tablas existentes**: `items` y `user_progress`.
- **Qué guarda `items`**: El catálogo o diccionario universal.
  - *Campos*: `id` (PK), `label` (palabra inglesa), `type` (palabra/objeto o verbo), `image_url` (vínculo al bucket de Supabase).
  - *Tipos válidos*: `'word'`, `'object'`, `'command'`.
- **Qué guarda `user_progress`**: El estado de aprendizaje individual.
  - *Campos*: `user_id`, `item_id`, `state`, métricas integradas (aciertos históricos, racha, último repaso).
  - *Estados válidos*: `'new'`, `'learning'`, `'mastered'`.
- **Buckets en Supabase**: Un solo bucket público llamado `images`. Las URLs resultantes en base de datos siguen este formato estructurado: `.../public/images/{itemId}/{timestamp}.png`.

---

## 5. ESTADO REAL ACTUAL DEL PROYECTO
### 🟢 FUNCIONA
- La app está desplegada en Vercel y carga en internet correctamente.
- Supabase (DB y Storage) ya está conectado y absorbe peticiones sin errores CORS detectados.
- La selección de niño y el aislamiento del Dashboard por infante funciona correctamente.
- La sesión ya entra en producción registrando el progreso de aprendizaje real de cada niño.
- Algunas imágenes antiguas cargan correctamente.

### 🟡 FUNCIONA PARCIALMENTE
- **Buscar 5**: Ya devuelve candidatos fiables, pero al ser un motor externo puede ser impredecible para palabras poco literales.
- **Imágenes Clave**: Mientras que algunas palabras sencillas lo tienen resuelto, "Dog" y "Sit" fallan o están incompletas (requieren uso urgente del admin).

### 🟠 PENDIENTE / EN DESARROLLO
- **Generar 1**: Funciona técnicamente, pero el resultado visual entregado por DALL-E no está garantizo 100% que represente el estilo final homogéneo. 
- **Verificación IA**: Hay que confirmar/cerrar definitivamente si el modelo fijado y los costes del endpoint `/api/generate-image.js` son exactamente lo que se necesita a largo plazo.
- **Arte Visual**: La app arrastra contenido viejo (Pixabay viejo + Wikimedia + Mocks locales); es urgente proceder con una limpieza sistemática y unificarlo todo con el estilo final acordado.

### 🔴 NO FUNCIONA
- No existen fallos paralizantes o roturas de código activas; el sistema técnico arranca. Los fallos se concentran exclusivamente en curación de datos (apartado 6).

---

## 6. FALLOS ACTUALES DETECTADOS
1. **Inconsistencia visual severa**: Coexisten imágenes generadas o traídas en diversas fases iniciales que mezclan fotografía analítica, ilustraciones de stock al azar, arte tipo clip-art y fondos transparentes frente a grises/blancos.
2. Algunas filas en base de datos de Ítems tienen `image_url` rotas porque todavía apuntan a URLs viejas (loremflickr) o están en null.
3. El botón "Buscar 5" es útil pero al consumirse de Pixabay no existe garantía ni control matemático sobre la uniformidad del estilo resultante al agregarlos en grupo (a veces devolverá un logo y a veces acuarela).
4. El backend "Generar 1" carece del ajuste fino final que garantice al 100% una salida de ilustración infantil calcada en cada ítem.
5. Falta definir de forma contundente la política de visualización: qué regla debe aplicar DALL-E cuando un objeto tangible choca artísticamente con la representación de una acción o verbo.
6. Falta fijar el presupuesto real y qué generación específica de OpenAI se está cobrando con cada impacto del botón "Generar 1".
7. Toda la base de datos acarrea la deuda de limpieza de datos basura / imágenes de Test que no pertenecen a la aplicación infantil.
8. Falta un método claro o manual del usuario para el workflow de reemplazos y aprobaciones diarias.

---

## 7. DECISIONES YA TOMADAS Y QUE NO QUIERO VOLVER A DISCUTIR
- **Entorno Agente**: El proyecto se desarrolla con asistencia de *Antigravity*.
- **Desarrollo Limpio**: No quiero tareas ni reescrituras inmensas manuales ni desarrollos de golpe en cascada.
- **Hosting Definido**: El frontend y backend serverless es Vercel exclusivamente.
- **Backend BD Definido**: La base de datos y almacenamiento es Supabase exclusivamente.
- **Firebase Descartes**: Está eliminado, no hay vuelta atrás.
- **Filosofía del Admin**: El panel Admin es y debe seguir siendo el epicentro local e indivisible de curación de contenidos.
- **Método de Carga**: No quiero subir cientos de imágenes desde mi propio ordenador una a una. 
- **Flujo Mixto Exigido**: 
  1º Buscar candidatos vía API externa abierta. 
  2º Generar por IA si la opción uno fracasa estéticamente. 
  3º Seleccionar obligatoriamente a mano lo ideal. 
  4º Todo debe terminar cristalizado en el Bucket `images` de Supabase sin URLs volátiles eternas.
- **Decisión Estética Tomada**:
  - Coherencia visual absoluta en toda la app.
  - Cero fotografías del mundo real.
  - Orientación innegociable a dibujos/ilustración infantil clara, tanto para el sustantivo material como para la orden ambigua verbal.
- **Identidad Git Prometida**: Antes de abandonar el proyecto y ramificar a nuevas ideas de la empresa (Ej: "Normativas"), debe revisarse obligatoriamente la identidad GitHub local para configurarse como `Unzalss`.

---

## 8. OBJETIVO VISUAL Y FUNCIONAL DE IMÁGENES
**Reglas de Oro del Arte Final:**
- **Estilo**: Infantil, dibujo limpio e ilustración tierna/dócil.
- **Fondo**: Limpio (transparente a la fuerza o blanco sólido rotundo).
- **Composición**: Objeto central masivo u acción inconfundible y protagónica en el centro del marco.
- **Contenido restado**: Sin textos, leyendas ni letras integradas. Sin realismo o ruido fotoperiodístico.
- **Consistencia**: Un "coche" debe dar la misma sensación de acuarela/lápiz digital que una "manzana" o un niño "saltando".
- **Legibilidad Cognitiva**: Deben ser indiscutiblemente descifrables por un niño menor sin capacidad de abstracción adulta o de doble sentido. Este mandato es extremadamente exigente en los casos de verbos abstractos o acciones corporales complejas.

**Flujo Funcional Interactivo Cerrado:**
1. Panel Admin -> Click "Buscar 5".
2. Evaluación visual exigente.
3. Si el vector agrada -> Guardar.
4. Si hay duda o discordancia visual -> Click "Generar 1".
5. Si falla el prompt IA -> Click otra vez "Generar 1" (las opciones se apilan para comparación).
6. Click en miniatura ganadora -> Click "Guardar seleccionada" (se hace fetch transparente, se sube a Supabase y se enlazan datos).
7. Sustituir sin piedad haciendo delete y re-ejecución si el estilo desentona con el grid general.

---

## 9. PLAN CORRECTO A PARTIR DE AHORA
*(Secuencia táctica para las próximas intervenciones recomendadas)*

- **Bloque 1**: Auditar el estado real de imágenes actuales en `items` (identificar el caos visual inminente en Supabase).
- **Bloque 2**: Revisar `api/generate-image.js` para asegurar que el modelo fijado, tamaño y el prompt exacto se acoplan a la regla inquebrantable expresada en el punto 8.
- **Bloque 3**: Deliberar la estrategia general si Pixabay ("Buscar 5") merece su mantenimiento transversal o limitarse solo a un atajo de objetos fáciles frente a verbos.
- **Bloque 4**: Cerrar bajo llave las palabras mágicas (prompt final) que obliguen a DALL-E a no variar de estilo para las próximas decenas de verbos.
- **Bloque 5**: Atacar el reemplazo oficial y estandarización visual de las primeras 10-15 palabras de la base de datos semilla ('apple', 'banana', 'cat', 'dog', 'sit', etc.).
- **Bloque 6**: Purgar las filas desfiguradas ("loremflickr", etc.) y eliminar basura temporal.
- **Bloque 7**: Validar impacto lógico y económico de las generaciones IA tras completar la base base de datos real.
- **Bloque 8**: Marcar el proyecto Admin como finalizado en etapa de herramienta de curación, blindándolo sin alteraciones adicionales.

---

## 10. PASOS INMEDIATOS RECOMENDADOS
- **¿Qué hay que hacer ahora mismo?**: Detenerse a leer este documento y reflexionar sobre la estética. Luego iniciar inmediatamente el **Bloque 1** del punto anterior revisando visualmente los ítems actuales para captar a simple vista su discordancia visual.
- **¿Cuál es el siguiente bloque de código real?**: No es un componente React. Es abrir el archivo  `api/generate-image.js` y refinar el modelo JSON para clavar el Prompt de la directiva artística.
- **¿Qué NO hay que tocar todavía?**: Ninguna lógica en `Session.jsx`, `Dashboard.jsx` o rutinas relacionadas al progreso, éxito y login. Sigue estando vetada la introducción masiva de código visual complejo.
- **Riesgos latentes frente a errores**: Si en este punto se precipitan los estilos de prompt o se empieza a jugar indiscriminadamente con la Base de datos sin un criterio gráfico unificador final, la experiencia infantil de la App quedará arruinada estéticamente, impidiendo su comercialización futura seria, sumada a la penalización en peticiones API pagadas con IA errónea.

---

## 11. GIT Y FLUJO DE TRABAJO
- **Repositorio y Estructura Actual**: El puente de versiones local apunta a GitHub, el cual mediante Webhooks alimenta de forma impávida el despliegue automático hacia Vercel en la rama final. Todo guardado en el archivo `.gitignore` recién generado mantiene limpios los entornos ajenos `.env.local`.
- **Identidad Futura Obligatoria**: Antes de cerrar en falsas promesas o migrar el cerebro al próximo proyecto masivo corporativo ("Normativas"), el archivo `~/.gitconfig` global exigirá conmutarse sin falta bajo la identidad **Unzals** (`git config --global user.name "Unzalss"`).
- **Acuerdo de Regla de Desarrollo**: La arquitectura total debe canalizarse a través de directrices y mandatos controlados vía **Antigravity**. Toda improvisación manual o sobrescritura unilateral al margen rompe el hilo conductor del rastreo de bloques.
