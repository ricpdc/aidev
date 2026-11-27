// Clave con la que guardamos las sesiones en el navegador.
const CLAVE = "diario-de-estudio-sesiones";

const formulario = document.getElementById("form-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const mensajeError = document.getElementById("error");
const rachaNumero = document.getElementById("racha");
const rachaTexto = document.getElementById("racha-texto");
const mejorRachaNumero = document.getElementById("mejor-racha");
const minutosSemana = document.getElementById("minutos-semana");
const minutosMes = document.getElementById("minutos-mes");
const lista = document.getElementById("lista-sesiones");
const vacio = document.getElementById("vacio");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonGuardar = document.getElementById("boton-guardar");
const botonCancelar = document.getElementById("boton-cancelar");

let sesiones = cargarSesiones();

// Sesión que se está editando, o null si el formulario crea una nueva.
let sesionEnEdicion = null;

// --- Fechas (siempre en hora local) ---

// Devuelve la fecha de hoy como texto "AAAA-MM-DD".
function fechaDeHoy() {
  return fechaATexto(new Date());
}

// Convierte un objeto Date a texto "AAAA-MM-DD" usando su hora local.
function fechaATexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Convierte "AAAA-MM-DD" a un Date local. Usamos las 12:00 para evitar
// problemas con los cambios de hora.
function textoAFecha(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 12);
}

// Formatea "AAAA-MM-DD" como "26 nov 2026" en español.
function formatearFecha(texto) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(textoAFecha(texto));
}

// --- Rachas ---

// Conjunto de días ("AAAA-MM-DD") con al menos una sesión.
// Ignoramos las fechas con formato incorrecto para que un dato
// corrupto no rompa los cálculos.
function obtenerDiasConSesion() {
  const dias = new Set();

  for (const sesion of sesiones) {
    if (typeof sesion.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sesion.fecha)) {
      dias.add(sesion.fecha);
    }
  }

  return dias;
}

function calcularRacha() {
  const diasConSesion = obtenerDiasConSesion();

  // Empezamos en hoy. Si hoy aún no hay sesión, empezamos en ayer:
  // la racha sigue viva hasta que termine el día.
  const cursor = textoAFecha(fechaDeHoy());
  if (!diasConSesion.has(fechaATexto(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let racha = 0;
  while (diasConSesion.has(fechaATexto(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}

// Mejor racha: el máximo de días consecutivos con al menos una sesión.
// Se calcula al vuelo y no se guarda, así nunca se desincroniza.
function calcularMejorRacha() {
  const dias = [...obtenerDiasConSesion()].sort();
  const hoy = fechaDeHoy();

  let mejor = 0;
  let racha = 0;
  let diaAnterior = null;

  for (const dia of dias) {
    // Las fechas futuras todavía no cuentan.
    if (dia > hoy) {
      continue;
    }

    if (diaAnterior !== null && esDiaSiguiente(diaAnterior, dia)) {
      racha++;
    } else {
      racha = 1;
    }

    if (racha > mejor) {
      mejor = racha;
    }

    diaAnterior = dia;
  }

  return mejor;
}

// ¿El día "dia" es exactamente el siguiente a "diaAnterior"?
// Sumamos un día con setDate para que funcione también con los
// cambios de hora, en los que un día no dura 24 horas.
function esDiaSiguiente(diaAnterior, dia) {
  const fecha = textoAFecha(diaAnterior);
  fecha.setDate(fecha.getDate() + 1);
  return fechaATexto(fecha) === dia;
}

// --- Total de la semana ---

// Días (texto "AAAA-MM-DD") de la semana actual, de lunes a domingo.
function diasDeEstaSemana() {
  const dias = new Set();
  const lunes = textoAFecha(fechaDeHoy());

  // getDay() devuelve domingo = 0. Lo pasamos a lunes = 0.
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));

  for (let i = 0; i < 7; i++) {
    dias.add(fechaATexto(lunes));
    lunes.setDate(lunes.getDate() + 1);
  }

  return dias;
}

function calcularMinutosSemana() {
  const dias = diasDeEstaSemana();
  const hoy = fechaDeHoy();

  let total = 0;

  for (const sesion of sesiones) {
    // Solo sesiones de esta semana y que ya hayan ocurrido.
    if (!dias.has(sesion.fecha) || sesion.fecha > hoy) {
      continue;
    }

    const minutos = Number(sesion.minutos);
    if (Number.isFinite(minutos)) {
      total += minutos;
    }
  }

  return total;
}

// Convierte minutos a un texto legible: "0 min", "45 min", "1 h" o "2 h 15 min".
function formatearDuracion(total) {
  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  if (horas === 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
}

// --- Total del mes ---

function calcularMinutosMes() {
  const hoy = fechaDeHoy();
  const mes = hoy.slice(0, 7); // "AAAA-MM"

  let total = 0;

  for (const sesion of sesiones) {
    if (typeof sesion.fecha !== "string" || sesion.fecha.slice(0, 7) !== mes) {
      continue;
    }

    // Mismo criterio que en la semana: el futuro todavía no cuenta.
    if (sesion.fecha > hoy) {
      continue;
    }

    const minutos = Number(sesion.minutos);
    if (Number.isFinite(minutos)) {
      total += minutos;
    }
  }

  return total;
}

// --- Almacenamiento ---

function cargarSesiones() {
  const guardado = localStorage.getItem(CLAVE);
  if (!guardado) {
    return [];
  }

  try {
    const datos = JSON.parse(guardado);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarSesiones() {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}

// --- Dibujar la interfaz ---

function render() {
  const racha = calcularRacha();
  rachaNumero.textContent = racha;
  rachaTexto.textContent = racha === 1 ? "día seguido" : "días seguidos";
  mejorRachaNumero.textContent = calcularMejorRacha();
  minutosSemana.textContent = formatearDuracion(calcularMinutosSemana());
  minutosMes.textContent = formatearDuracion(calcularMinutosMes());

  // De la más reciente a la más antigua. Si dos sesiones son del mismo
  // día, primero la que se añadió más tarde.
  const ordenadas = [...sesiones].sort((a, b) => {
    if (a.fecha !== b.fecha) {
      return b.fecha.localeCompare(a.fecha);
    }
    return b.creadoEn - a.creadoEn;
  });

  lista.innerHTML = "";

  for (const sesion of ordenadas) {
    const item = document.createElement("li");
    item.className = "sesion";

    const info = document.createElement("div");
    info.className = "sesion-info";

    const tema = document.createElement("p");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;

    const meta = document.createElement("p");
    meta.className = "sesion-meta";
    meta.textContent = formatearFecha(sesion.fecha);

    info.append(tema, meta);

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = `${sesion.minutos} min`;

    // Botones para editar y borrar esta sesión concreta.
    const acciones = document.createElement("div");
    acciones.className = "sesion-acciones";

    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.className = "boton-icono";
    botonEditar.textContent = "✏️";
    botonEditar.title = "Editar sesión";
    botonEditar.setAttribute("aria-label", `Editar la sesión de ${sesion.tema}`);
    botonEditar.addEventListener("click", () => entrarEnEdicion(sesion));

    const botonBorrar = document.createElement("button");
    botonBorrar.type = "button";
    botonBorrar.className = "boton-icono";
    botonBorrar.textContent = "🗑️";
    botonBorrar.title = "Borrar sesión";
    botonBorrar.setAttribute("aria-label", `Borrar la sesión de ${sesion.tema}`);
    botonBorrar.addEventListener("click", () => borrarSesion(sesion));

    acciones.append(botonEditar, botonBorrar);

    item.append(info, minutos, acciones);
    lista.append(item);
  }

  vacio.hidden = ordenadas.length > 0;
}

// --- Editar y borrar sesiones ---

function entrarEnEdicion(sesion) {
  sesionEnEdicion = sesion;

  campoFecha.value = sesion.fecha;
  campoTema.value = sesion.tema;
  campoMinutos.value = sesion.minutos;
  mensajeError.hidden = true;

  tituloFormulario.textContent = "Editar sesión";
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;

  formulario.scrollIntoView({ behavior: "smooth", block: "center" });
  campoTema.focus();
}

// Vuelve al modo "nueva sesión" y limpia el formulario.
function salirDeEdicion() {
  sesionEnEdicion = null;

  formulario.reset();
  campoFecha.value = fechaDeHoy();
  mensajeError.hidden = true;

  tituloFormulario.textContent = "Nueva sesión";
  botonGuardar.textContent = "Añadir sesión";
  botonCancelar.hidden = true;
}

function borrarSesion(sesion) {
  const pregunta = `¿Borrar la sesión «${sesion.tema}» del ${formatearFecha(sesion.fecha)}?`;
  if (!confirm(pregunta)) {
    return;
  }

  // Si estábamos editando justo esa sesión, salimos del modo edición.
  if (sesionEnEdicion === sesion) {
    salirDeEdicion();
  }

  // Quitamos exactamente esa sesión (misma referencia de objeto).
  sesiones = sesiones.filter((s) => s !== sesion);
  guardarSesiones();
  render();
}

// --- Formulario ---

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  if (!fecha || !tema || !Number.isFinite(minutos) || minutos <= 0) {
    mensajeError.textContent = "Rellena la fecha, el tema y unos minutos mayores que 0.";
    mensajeError.hidden = false;
    return;
  }

  mensajeError.hidden = true;

  if (sesionEnEdicion) {
    // Actualizamos la sesión existente (conservamos su creadoEn).
    sesionEnEdicion.fecha = fecha;
    sesionEnEdicion.tema = tema;
    sesionEnEdicion.minutos = minutos;
  } else {
    sesiones.push({
      fecha,
      tema,
      minutos,
      creadoEn: Date.now(),
    });
  }

  guardarSesiones();
  render();
  salirDeEdicion();
  campoTema.focus();
});

botonCancelar.addEventListener("click", salirDeEdicion);

// --- Arranque ---

campoFecha.value = fechaDeHoy();
render();
