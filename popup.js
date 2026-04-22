// =========================
// [NUEVO] STORAGE KEYS
// =========================
const STORAGE_KEY = "formData";
const RESULT_KEY = "formResult"; // [NUEVO]
// =========================
// [NUEVO] RESTAURAR DATOS
// =========================

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get([STORAGE_KEY], (res) => {
    if (!res[STORAGE_KEY]) return;

    const data = res[STORAGE_KEY];

    document.getElementById("descripcion").value = data.descripcion || "";
    document.getElementById("inicio").value = data.inicio || "";
    document.getElementById("fin").value = data.fin || "";
  });
  // =========================
  // [NUEVO] RESTAURAR RESULTADO
  // =========================

  chrome.storage.local.get([RESULT_KEY], (res) => {
    if (!res[RESULT_KEY]) return;

    const data = res[RESULT_KEY];

    document.getElementById("resultado").innerHTML = `
      <p style="color:#00c853;"><b>Ultimo formulario generado</b></p>

      <p><b>Link para alumnos:</b></p>
      <input value="${data.formUrl}" readonly style="width:100%" />

      <button id="copiarBtn" class="btn-main" style="margin-top:5px;">
        Copiar nuevamente
      </button>

      <p style="margin-top:10px;"><b>Abrir formulario:</b><br>
        <a href="${data.formUrl}" target="_blank">Abrir</a>
      </p>

      <p><b>Ver respuestas:</b><br>
        <a href="${data.sheetUrl}" target="_blank">Abrir</a>
      </p>
    `;

    document.getElementById("copiarBtn").addEventListener("click", () => {
      navigator.clipboard.writeText(data.formUrl);
    });
  });
});

// =========================
// [NUEVO] AUTOGUARDADO
// =========================

function guardarDatos() {
  const data = {
    descripcion: document.getElementById("descripcion").value,
    inicio: document.getElementById("inicio").value,
    fin: document.getElementById("fin").value
  };

  chrome.storage.local.remove([STORAGE_KEY, RESULT_KEY]);
}

// listeners
["descripcion", "inicio", "fin"].forEach(id => {
  document.getElementById(id).addEventListener("input", guardarDatos);
});

// =========================
// [NUEVO] LIMPIAR FORM
// =========================

document.getElementById("limpiarForm").addEventListener("click", () => {
  document.getElementById("descripcion").value = "";
  document.getElementById("inicio").value = "";
  document.getElementById("fin").value = "";

  chrome.storage.local.remove(STORAGE_KEY);

  document.getElementById("resultado").innerHTML = "";
});

// =========================
// BOTÓN PARA INYECTAR PANEL SIU
// =========================

document.getElementById("abrirPanel").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  // cerrar popup para no tapar el panel
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
// CREAR FORMULARIO
// =========================

document.getElementById("crearForm").addEventListener("click", async () => {
  const descripcion = document.getElementById("descripcion").value;
  const inicio = document.getElementById("inicio").value;
  const fin = document.getElementById("fin").value;

  const resultado = document.getElementById("resultado");
  const btn = document.getElementById("crearForm");

  // =========================
  // LOADING UI (ROBUSTO)
  // =========================

  btn.disabled = true;

  resultado.innerHTML = `
    <p id="loadingText">Generando formulario.</p>
  `;

  let dots = 1;
  const interval = setInterval(() => {
    dots = (dots % 3) + 1;
    document.getElementById("loadingText").textContent =
      "Generando formulario" + ".".repeat(dots);
  }, 400);

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbxqC-TD1IldoYtyso1b0Ohk4zkeimfXYZjIIsvGmcyqsHrzBI909MYmvEG_Zh17cp1R/exec", {
      method: "POST",
      body: JSON.stringify({
        descripcion,
        inicio,
        fin
      })
    });

    const data = await res.json();
    // [NUEVO] guardar resultado
    chrome.storage.local.set({
      [RESULT_KEY]: data
    });
    // copiar automáticamente
    copiarTexto(data.formUrl);

    // =========================
    // RESULTADO FINAL
    // =========================

    resultado.innerHTML = `
      <p style="color:#00c853;"><b>Link copiado automaticamente</b></p>

      <p><b>Link para alumnos:</b></p>
      <input id="linkForm" value="${data.formUrl}" readonly style="width:100%" />

      <button id="copiarBtn" class="btn-main" style="margin-top:5px;">
        Copiar nuevamente
      </button>

      <p style="margin-top:10px;"><b>Abrir formulario:</b><br>
        <a href="${data.formUrl}" target="_blank">Abrir</a>
      </p>

      <p><b>Ver respuestas:</b><br>
        <a href="${data.sheetUrl}" target="_blank">Abrir</a>
      </p>
    `;

    // botón copiar manual
    document.getElementById("copiarBtn").addEventListener("click", () => {
      copiarTexto(data.formUrl);

      const btnCopy = document.getElementById("copiarBtn");
      btnCopy.textContent = "Copiado OK";

      setTimeout(() => {
        btnCopy.textContent = "Copiar nuevamente";
      }, 1500);
    });

  } catch (err) {
    console.error(err);

    resultado.innerHTML = `
      <p style="color:#ff5252;"><b>Error creando el formulario</b></p>
    `;
  } finally {
    clearInterval(interval);
    btn.disabled = false;
  }
});