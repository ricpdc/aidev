// Clave con la que guardamos las sesiones en el navegador.
const CLAVE = "diario-de-estudio-sesiones";

const formulario = document.getElementById("form-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const mensajeError = document.getElementById("error");
const rachaNumero = document.getElementById("racha");
const rachaTexto = document.getElementById("racha-texto");
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

// --- Racha ---

function calcularRacha() {
  const diasConSesion = new Set(sesiones.map((sesion) => sesion.fecha));

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
