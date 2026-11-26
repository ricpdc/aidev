# MEMORY.md — Diario de Estudio 
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte. 
 
## Estado actual 
- v1.1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha y lista de sesiones. 
- Datos en localStorage, clave `diario-de-estudio-sesiones`. 
 
## Decisiones (y por qué) 
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic. 
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer. 
- La mejor racha se calcula al vuelo desde las sesiones, no se almacena: así no se desincroniza y no necesita migración. Incluye la racha activa y excluye fechas futuras. 
- `AGENTS.md` se corrigió para reflejar el código real (clave y campos), que es la fuente de verdad. 
 
## Aprendizajes y errores a evitar 
- No comparar días restando milisegundos: con el cambio de hora un día puede durar 23 o 25 horas. Sumar con `setDate(getDate() + 1)` y comparar textos. 
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`: desplazan el día fuera de UTC. 
 
## Próximos pasos 
- (vacío por ahora) 
