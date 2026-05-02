// =========================
// STORAGE KEYS
// =========================
const STORAGE_KEY = "formData";
const RESULT_KEY = "formResult";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqC-TD1IldoYtyso1b0Ohk4zkeimfXYZjIIsvGmcyqsHrzBI909MYmvEG_Zh17cp1R/exec"; // ← reemplazá con tu nueva URL

// =========================
// RESTAURAR DATOS AL ABRIR
// =========================

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    if (!res[STORAGE_KEY]) return;
    const data = res[STORAGE_KEY];
    document.getElementById("descripcion").value = data.descripcion || "";
    document.getElementById("inicio").value = data.inicio || "";
    document.getElementById("fin").value = data.fin || "";
  });

  chrome.storage.local.get([RESULT_KEY], (res) => {
    if (!res[RESULT_KEY]) return;
    const data = res[RESULT_KEY];
    mostrarResultado(data, "Ultimo formulario generado");
  });
});

// =========================
// AUTOGUARDADO (corregido)
// =========================

function guardarDatos() {
  const data = {
    descripcion: document.getElementById("descripcion").value,
    inicio: document.getElementById("inicio").value,
    fin: document.getElementById("fin").value
  };
  // ANTES estaba llamando a remove() acá, era un bug
  chrome.storage.local.set({ [STORAGE_KEY]: data });
}

["descripcion", "inicio", "fin"].forEach(id => {
  document.getElementById(id).addEventListener("input", guardarDatos);
});

// =========================
// LIMPIAR FORM
// =========================

document.getElementById("limpiarForm").addEventListener("click", () => {
  document.getElementById("descripcion").value = "";
  document.getElementById("inicio").value = "";
  document.getElementById("fin").value = "";
  chrome.storage.local.remove([STORAGE_KEY, RESULT_KEY]);
  document.getElementById("resultado").innerHTML = "";
});

// =========================
// BOTÓN PANEL SIU
// =========================

document.getElementById("abrirPanel").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
  window.close();
});

// =========================
// FUNCIÓN COPIAR
// =========================

function copiarTexto(texto) {
  navigator.clipboard.writeText(texto).catch(err => {
    console.error("Error copiando:", err);
  });
}

// =========================
// MOSTRAR RESULTADO (función reutilizable)
// =========================

function mostrarResultado(data, titulo) {
  const resultado = document.getElementById("resultado");

  // Armar URL de resultados usando el formId
  const resultadosUrl = SCRIPT_URL + "?action=resultados&id=" + data.formId;

  resultado.innerHTML = `
    <p style="color:#00c853;"><b>${titulo}</b></p>

    <p><b>Link para alumnos:</b></p>
    <input id="linkForm" value="${data.formUrl}" readonly style="width:100%" />

    <button id="copiarBtn" class="btn-main" style="margin-top:5px;">
      Copiar nuevamente
    </button>

    <p style="margin-top:10px;"><b>Abrir formulario:</b><br>
      <a href="${data.formUrl}" target="_blank">Abrir</a>
    </p>

    <p><b>Ver respuestas:</b><br>
      <a href="${resultadosUrl}" target="_blank">Abrir</a>
    </p>
  `;

  document.getElementById("copiarBtn").addEventListener("click", () => {
    copiarTexto(data.formUrl);
    const btn = document.getElementById("copiarBtn");
    btn.textContent = "Copiado OK";
    setTimeout(() => { btn.textContent = "Copiar nuevamente"; }, 1500);
  });
}

// =========================
// CREAR FORMULARIO
// =========================

document.getElementById("crearForm").addEventListener("click", async () => {
  const descripcion = document.getElementById("descripcion").value.trim();
  const inicio = document.getElementById("inicio").value;
  const fin = document.getElementById("fin").value;

  if (!descripcion || !inicio || !fin) {
    document.getElementById("resultado").innerHTML =
      `<p style="color:#ff5252;"><b>Completá todos los campos antes de continuar.</b></p>`;
    return;
  }

  const resultado = document.getElementById("resultado");
  const btn = document.getElementById("crearForm");

  btn.disabled = true;

  resultado.innerHTML = `<p id="loadingText">Generando formulario.</p>`;

  let dots = 1;
  const interval = setInterval(() => {
    dots = (dots % 3) + 1;
    const el = document.getElementById("loadingText");
    if (el) el.textContent = "Generando formulario" + ".".repeat(dots);
  }, 400);

  try {
    const res = await fetch(SCRIPT_URL + "?action=crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ descripcion, inicio, fin })
    });

    const data = await res.json();

    if (data.error) {
      resultado.innerHTML =
        `<p style="color:#ff5252;"><b>Error: ${data.error}</b></p>`;
      return;
    }

    // Guardar resultado
    chrome.storage.local.set({ [RESULT_KEY]: data });

    // Copiar automáticamente
    copiarTexto(data.formUrl);

    // Mostrar con título de "copiado"
    mostrarResultado(data, "Link copiado automaticamente");

  } catch (err) {
    console.error(err);
    resultado.innerHTML =
      `<p style="color:#ff5252;"><b>Error creando el formulario.</b></p>`;
  } finally {
    clearInterval(interval);
    btn.disabled = false;
  }
});