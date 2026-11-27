# MEMORY.md — Diario de Estudio 
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte. 
 
## Estado actual 
- v1.4 funcionando: registrar, editar y borrar sesiones (fecha, tema, minutos), racha actual, mejor racha, total semanal, total mensual y lista. 
- Datos en localStorage, clave `diario-de-estudio-sesiones`. 
 
## Decisiones (y por qué) 
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic. 
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer. 
- La mejor racha se calcula al vuelo desde las sesiones, no se almacena: así no se desincroniza y no necesita migración. Incluye la racha activa y excluye fechas futuras. 
- Total semanal: semana natural lunes–domingo en hora local, calculado al vuelo, excluye fechas futuras y se muestra como «X h Y min». Sin almacenamiento nuevo. 
- Total mensual: mes natural actual, mismo criterio que la semana (al vuelo, sin almacenar, futuro excluido, formato «X h Y min»). 
- Editar reutiliza el formulario principal (con «Cancelar») en vez de un modal: una sola validación y menos código; se compensa con scroll y el título «Editar sesión». 
- Borrar usa `confirm()` nativo y muestra tema y fecha. 
- Sin `id` en las sesiones: editar y borrar usan la referencia al objeto, así no hay que migrar datos. Editar conserva `creadoEn`. 
- `AGENTS.md` refleja el código real (clave y campos), que es la fuente de verdad. 
 
## Aprendizajes y errores a evitar 
- No comparar días restando milisegundos: con el cambio de hora un día puede durar 23 o 25 horas. Sumar con `setDate(getDate() + 1)` y comparar textos. 
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`: desplazan el día fuera de UTC. 
- Para comparar meses, usar el prefijo `AAAA-MM` del texto de fecha: evita aritmética de fechas y problemas de fin de mes. 
- `getDay()` devuelve domingo = 0; para empezar la semana en lunes: `(getDay() + 6) % 7`. 
- Los botones de icono deben sobrescribir los estilos globales de `button` (ancho, fondo, márgenes). 
 
## Próximos pasos 
- (vacío por ahora) 
