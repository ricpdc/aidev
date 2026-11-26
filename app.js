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
const lista = document.getElementById("lista-sesiones");
const vacio = document.getElementById("vacio");

let sesiones = cargarSesiones();

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

    item.append(info, minutos);
    lista.append(item);
  }

  vacio.hidden = ordenadas.length > 0;
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

  sesiones.push({
    fecha,
    tema,
    minutos,
    creadoEn: Date.now(),
  });

  guardarSesiones();
  render();

  formulario.reset();
  campoFecha.value = fechaDeHoy();
  campoTema.focus();
});

// --- Arranque ---

campoFecha.value = fechaDeHoy();
render();
