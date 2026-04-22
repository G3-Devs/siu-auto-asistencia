(function () {
  let container = document.getElementById("asistencia-pro-container");
  if (container) {
    container.remove();
    return;
  }

  container = document.createElement("div");
  container.id = "asistencia-pro-container";
  container.style.zIndex = "9999"; // [NUEVO]
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  // --- TRUCO PARA USAR TU STYLES.CSS ---
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("styles.css"); // Esto trae tu archivo externo
  shadow.appendChild(link);

  const panel = document.createElement("div");
  panel.id = "asistencia-panel";
  panel.innerHTML = `
    <div id="asistencia-header">
      <h3>Asistencia PRO</h3>
      <button id="cerrar">✕</button>
    </div>
    <textarea id="inputDnis" placeholder="Pegá los DNIs..."></textarea>
    <button class="btn-main" id="marcar">Marcar asistencia</button>
    <button class="btn-clear" id="limpiar">Limpiar</button>
    <div id="preview"></div>
  `;
  shadow.appendChild(panel);

  // Selectores internos (shadow)
  const textarea = shadow.getElementById("inputDnis");
  const preview = shadow.getElementById("preview");
  shadow.getElementById("cerrar").onclick = () => container.remove();

  // Lógica de Persistencia
  chrome.storage.local.get(["dnis"], (res) => {
    if (res.dnis) textarea.value = res.dnis;
    actualizarPreview();
  });

  textarea.addEventListener("input", () => {
    chrome.storage.local.set({ dnis: textarea.value });
    actualizarPreview();
  });

  function limpiarInput(texto) {
    return (texto.match(/\d+/g) || []).map(d => d.replace(/\D/g, ""));
  }

  function actualizarPreview() {
    const lista = limpiarInput(textarea.value);
    preview.textContent = `Detectados: ${lista.length}`;
  }

  shadow.getElementById("limpiar").onclick = () => {
    textarea.value = "";
    chrome.storage.local.set({ dnis: "" });
    actualizarPreview();
  };

  // Marcar asistencia (Lógica externa al shadow)
  shadow.getElementById("marcar").onclick = () => {
    let dnis = limpiarInput(textarea.value);
    if (!dnis.length) {
      alert("No hay DNIs válidos");
      return;
    }

    let dniSet = new Set(dnis);
    let noEncontrados = new Set(dniSet);
    let marcados = 0;

    let alumnos = document.querySelectorAll(".box-asistencia");

    alumnos.forEach(alumno => {
      try {
        let nodoDni = alumno.querySelector('.info.pull-right div:not(.truncate)');
        if (!nodoDni) return;

        let dni = nodoDni.textContent.replace(/\D/g, '');

        if (dniSet.has(dni)) {
          noEncontrados.delete(dni);
          if (alumno.classList.contains("ausente")) {
            alumno.click();
            marcados++;
            alumno.style.outline = "3px solid #00c853";
            alumno.style.backgroundColor = "#e8f5e9";
          }
        }
      } catch (e) {
        console.warn("Error marcando alumno:", e);
      }
    });

    alert(`✔ Marcados: ${marcados}\n❌ No encontrados: ${noEncontrados.size}`);
  };

})();