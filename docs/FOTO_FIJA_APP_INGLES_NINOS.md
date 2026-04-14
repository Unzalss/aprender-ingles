FOTO FIJA: APP APRENDER INGLÉS (NIÑOS)

Documento maestro de estado, arquitectura y decisiones cerradas.

1. OBJETIVO DEL PROYECTO
Qué es la app: Aplicación interactiva para enseñar inglés a niños pequeños mediante imágenes/GIFs, audio y repetición controlada.
Para quién es: Inicialmente para dos niños concretos: Izan y Valeria.
Qué resuelve: Enseñanza de vocabulario y acciones cotidianas con un sistema de exposición + evaluación, registrando progreso real por niño.
Alcance actual de la V1:
selección de niño
dashboard
sesión de aprendizaje
panel Admin de curación de contenidos
subida manual de imágenes/GIFs
motor de sesiones ya operativo
Partes privadas vs vendibles:
Privadas: perfiles fijos actuales, panel Admin interno, bucket/BD del entorno actual.
Vendibles a futuro: motor de sesiones, lógica de progreso, arquitectura React + Vercel + Supabase.
2. STACK Y ARQUITECTURA ACTUAL
Frontend: React con Vite
Hosting: Vercel
Base de datos: Supabase Postgres
Storage: Supabase Storage
Backend/API: funciones serverless en Vercel
IA imágenes: endpoint backend con OpenAI / DALL·E
Búsqueda externa de imágenes: se ha probado Pixabay y después Pexels
Firebase: eliminado, no volver a proponerlo
Variables de entorno actuales / usadas
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
se han usado/clasificado también claves de búsqueda externas según proveedor
3. ESTRUCTURA FUNCIONAL ACTUAL
Selección de niño
Entrada inicial con perfiles Izan y Valeria
Sin auth compleja
Selección guardada en estado React
Dashboard
Muestra estado de aprendizaje por niño
Clasificación visual por progreso
Session
Ya reestructurada con metodología cerrada
Ya no depende del flujo antiguo simple
Usa motor de sesión nuevo
Admin

El Admin sigue siendo el centro absoluto de trabajo.

Actualmente permite:

Buscar 5
Generar 1
Guardar seleccionada
Eliminar
Subir archivo manual
Añadir palabra manualmente
Carga inicial de catálogo ya hecha por SQL
Previsualización de imagen/GIF
Gestión de palabras sin imagen
Subida manual
Ya se pueden subir manualmente:
.png
.jpg
.jpeg
.webp
.gif
Se suben a Supabase Storage
Se actualiza items.image_url
El preview refresca en el momento
4. BASE DE DATOS ACTUAL
Tablas
items
user_progress
items

Campos base y ampliados:

id
label
type
image_url
category
translation_es
ambiguity_level
status
correct_count
last_seen_at
last_correct_at
correct_days
Tipos válidos
object
word
command
user_progress
sigue siendo la tabla de seguimiento por usuario/niño
conserva el rol de guardar progreso individual
Storage
bucket images
se usa para imágenes y también GIFs
backend usa service role para evitar bloqueos RLS al guardar
5. ESTADO REAL ACTUAL DEL PROYECTO
🟢 FUNCIONA
App desplegada y accesible en Vercel
Supabase conectado
Storage funcionando
Guardado de imágenes funcionando
Subida manual de imágenes y GIFs funcionando
Creación manual de palabras funcionando
Catálogo grande cargado en BD
Motor de sesión funcionando
Endpoint de test funcionando
Sesión real funcionando
Metodología nueva 30 + 20 funcionando
No aparecen palabras sin imagen en sesión
UI de sesión ya operativa
🟡 FUNCIONA PARCIALMENTE
Buscar imágenes devuelve resultados, pero la calidad visual no es fiable
Generar por IA funciona técnicamente, pero no está cerrado el estilo definitivo
Los verbos siguen siendo el área más difícil visualmente
🟠 PENDIENTE
Cerrar de forma definitiva la estrategia visual
Cerrar prompt maestro de generación IA
Definir cuándo usar buscar y cuándo generar
Audio español de apoyo
Limpieza de imágenes malas o antiguas
Pulido UX final
🔴 NO FUNCIONA / NO ESTÁ RESUELTO
La coherencia estética global todavía NO está cerrada
No existe todavía un criterio visual único y blindado para todo el catálogo
La búsqueda externa no garantiza material válido para niños pequeños en verbos complejos
6. DECISIONES YA TOMADAS Y CERRADAS
Stack
Mantener:
React + Vite
Vercel
Supabase
No cambiar stack
Filosofía de trabajo
Desarrollo por bloques pequeños
Todo a través de Antigravity
Sin reescrituras grandes
Sin improvisar
Admin
El Admin sigue siendo el centro total de curación
No quitar sus funciones existentes
Mantener:
Buscar 5
Generar 1
Guardar seleccionada
Eliminar
Subir archivo manual
Añadir palabra manual
Imágenes
Las búsquedas automáticas han demostrado limitaciones
El usuario quiere seguir manteniendo el sistema actual, pero con capacidad de subir manualmente lo que haga falta
Las palabras problemáticas se resolverán manualmente cuando sea necesario
Los GIFs están aceptados como solución válida para verbos/acciones si ayudan pedagógicamente
Calidad visual
La calidad visual es ahora el problema principal del proyecto
El sistema funcional ya existe
Lo que queda ya no es “hacer la app”, sino dejarla seria y usable de verdad
7. CATÁLOGO Y CONTENIDO
Catálogo
Ya se ha cargado un catálogo amplio de palabras (~300 aprox) por SQL
Hay objetos, animales, familia, colores, números, formas, verbos, acciones de casa, posiciones y estados
Ya existe opción para añadir más palabras manualmente desde Admin
Regla semántica importante

Para ciertas palabras:

no valen resultados genéricos
ejemplos:
brother ≠ boy
sister ≠ girl
mom ≠ woman
dad ≠ man
Soporte español
Ya se ha previsto translation_es
Se quiere botón futuro de audio español de apoyo cuando haya ambigüedad
8. METODOLOGÍA CERRADA DE APRENDIZAJE
Fase 1 — Exposición
30 items exactos
Solo items con imagen o GIF
Los new:
máximo 3 distintos por sesión
aparecen 3 veces en exposición
las repeticiones van separadas
En exposición:
imagen/GIF grande
audio en inglés
sin examen
La exposición no cuenta para mastered
Fase 2 — Evaluación
20 preguntas exactas
Solo items con imagen o GIF
Cada pregunta:
muestra imagen/GIF
reproduce audio
ofrece 3 opciones
Tras primera evaluación, un new deja de ser new y pasa a learning
Estados
new
learning
mastered
Reglas de dominio
palabras/objetos: 5 aciertos en días distintos
comandos/verbos: 6 aciertos en días distintos
Reglas de fallo
si algo mastered falla:
vuelve a learning
reinicia progreso
9. MOTOR DE SESIONES
Implementado
getSessionItems(...)
evaluateAnswer(...)
endpoint de prueba /api/test-session creado y funcionando
Estructura actual
exposure_queue: 30
evaluation_queue: 20
Restricción crítica
Se excluyen items sin image_url
Resultado actual
Motor validado
JSON correcto
Sesión usable en web
10. UI DE SESIÓN
Estado actual
Ya existe ruta de sesión funcional
Muestra exposición y evaluación encadenadas
Progreso visual por fase
Feedback visual correcto/incorrecto
Botones grandes y usables
Validación actual
La sesión funciona bien
Lo confirmado por el usuario:
no deben aparecer palabras sin imagen
cada sesión debe ser:
30 exposición
20 evaluación
11. PROBLEMA PRINCIPAL ACTUAL
Ya NO es técnico

La app ya funciona.

El problema real ahora es:

la calidad y coherencia visual del contenido

Esto incluye:

resultados de búsqueda pobres
verbos difíciles de representar
mezcla de estilos
incertidumbre sobre el uso final de IA
necesidad de curación manual más fuerte
12. ESTRATEGIA REAL ACTUAL
Lo que sí existe
Buscar 5
Generar 1
Guardar seleccionada
Subida manual
GIFs
Añadir palabra
Sesión real funcionando
Lo que se ha visto
Buscar automáticamente no garantiza calidad
Para muchos casos, la solución correcta será:
elegir manualmente
o subir manualmente
o generar IA solo donde tenga sentido
Conclusión actual

La app ya está en fase de:

curación
criterio visual
limpieza
refinado
13. LO QUE FALTA REALMENTE AHORA
Bloque prioritario actual
Cerrar prompt maestro de IA
Cerrar estrategia visual definitiva
Definir cuándo buscar / cuándo generar / cuándo subir manualmente
Limpiar imágenes malas
Audio español de apoyo
Pulido UX final
Lo que NO falta
La base técnica principal ya está
La sesión ya existe
El Admin ya existe
El sistema ya se puede usar
14. PASO ACTUAL RECOMENDADO

En la nueva ventana, el siguiente bloque debe ser:

Objetivo

Cerrar definitivamente el sistema visual de imágenes

Lo que hay que pedir
revisar api/generate-image.js
cerrar prompt maestro
dejar estilo consistente
documentar estrategia final:
buscar
generar
subida manual
Lo que NO hay que tocar
no tocar Session
no tocar Dashboard
no rehacer Admin
no cambiar stack
no crear nuevas features grandes
15. GIT Y FLUJO
GitHub + Vercel despliegue automático
Mantener flujo pequeño y controlado
Antes de volver a Normativas u otros proyectos:
revisar identidad Git hacia Unzalss