// =========================
// STORAGE KEYS
// =========================
const STORAGE_KEY = "formData";
const RESULT_KEY  = "formResult";

let countdownInterval = null;

// =========================
// OAUTH
// =========================

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError?.message || "No se pudo autenticar");
      } else {
        resolve(token);
      }
    });
  });
}

// =========================
// CREAR FORMULARIO
// =========================

async function compartirFormulario(token, formId) {
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${formId}/permissions`,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone"
      })
    }
  );
}


async function crearFormularioGoogle(token, descripcion, inicio, fin) {
  const titulo = `Asistencia - ${descripcion}`;

  // 1. Crear el form
  const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      info: { title: titulo, documentTitle: titulo }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Error creando el formulario");
  }

  const form = await createRes.json();
  const formId = form.formId;

  // 2. Publicar y habilitar respuestas PRIMERO
  await fetch(`https://forms.googleapis.com/v1/forms/${formId}:setPublishSettings`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      publishSettings: {
        publishState: {
          isPublished: true,
          isAcceptingResponses: true
        }
      }
    })
  });

  // 3. Delay para que Google procese
  await new Promise(r => setTimeout(r, 1000));

  // 4. Agregar descripción y pregunta DNI
  const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          updateFormInfo: {
            info: { description: `Formulario abierto hasta: ${fin}` },
            updateMask: "description"
          }
        },
        {
          createItem: {
            item: {
              title: "Ingrese DNI",
              description: "Solo se admiten números sin puntos, comas, caracteres especiales o espacios.",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: false }
                }
              }
            },
            location: { index: 0 }
          }
        }
      ]
    })
  });

  if (!batchRes.ok) {
    const err = await batchRes.json();
    throw new Error("batchUpdate falló: " + JSON.stringify(err.error));
  }

  // 5. Compartir con cualquiera que tenga el link
  await compartirFormulario(token, formId);

  const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
  return { formId, formUrl };
}

// =========================
// CERRAR FORMULARIO
// =========================

async function cerrarFormulario(token, formId) {
  const res = await fetch(
    `https://forms.googleapis.com/v1/forms/${formId}:setPublishSettings`,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        publishSettings: {
          publishState: {
            isPublished: true,
            isAcceptingResponses: false
          }
        }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Error cerrando el formulario");
  }
}

// =========================
// LEER RESPUESTAS DESDE FORMS API
// =========================

async function leerRespuestas(token, formId, finStr) {
  // Obtener el form para saber el questionId de la pregunta DNI
  const formRes = await fetch(
    `https://forms.googleapis.com/v1/forms/${formId}`,
    { headers: { "Authorization": "Bearer " + token } }
  );
  if (!formRes.ok) throw new Error("No se pudo obtener el formulario");
  const formData = await formRes.json();
  const preguntaDni = formData.items?.[0]?.questionItem?.question?.questionId;
  if (!preguntaDni) throw new Error("No se encontró la pregunta DNI");

  // Obtener respuestas
  const res = await fetch(
    `https://forms.googleapis.com/v1/forms/${formId}/responses`,
    { headers: { "Authorization": "Bearer " + token } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "No se pudieron leer las respuestas");
  }

  const data = await res.json();
  const responses = data.responses || [];
  const fechaFin = finStr ? new Date(finStr) : null;
  const dnisVistos = new Set();
  const dnisFiltrados = [];

  for (const r of responses) {
    // Filtrar por fecha de fin
    if (fechaFin) {
      const timestamp = new Date(r.lastSubmittedTime);
      if (timestamp > fechaFin) continue;
    }
    const dni = r.answers?.[preguntaDni]?.textAnswers?.answers?.[0]?.value;
    if (!dni) continue;
    // Deduplicar: primer respuesta por DNI gana
    if (!dnisVistos.has(dni)) {
      dnisVistos.add(dni);
      dnisFiltrados.push(dni);
    }
  }

  return dnisFiltrados;
}

// =========================
// COUNTDOWN
// =========================

function iniciarCountdown(finStr, formCerrado) {
  if (countdownInterval) clearInterval(countdownInterval);
  const el = document.getElementById("countdown");
  if (!el) return;

  if (formCerrado) {
    el.textContent = "Formulario cerrado";
    el.className = "urgente";
    return;
  }

  if (!finStr) {
    el.textContent = "";
    return;
  }

  const fechaFin = new Date(finStr);

  function actualizar() {
    const ahora = new Date();
    const diff = fechaFin - ahora;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      el.textContent = "⛔ Tiempo vencido — cerrá el formulario";
      el.className = "urgente";
      return;
    }

    const totalSegundos = Math.floor(diff / 1000);
    const horas    = Math.floor(totalSegundos / 3600);
    const minutos  = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    const hStr = horas   > 0 ? `${horas}h ` : "";
    const mStr = minutos > 0 ? `${minutos}m ` : "";
    const sStr = `${segundos}s`;
    el.textContent = `⏱ Cierra en: ${hStr}${mStr}${sStr}`;

    // Color según urgencia
    if (totalSegundos <= 60)        el.className = "urgente";
    else if (totalSegundos <= 300)  el.className = "warning";
    else                            el.className = "normal";
  }

  actualizar();
  countdownInterval = setInterval(actualizar, 1000);
}

// =========================
// ACTUALIZAR BOTONES
// =========================

function actualizarBotones(hayFormulario, formCerrado) {
  const contenedor = document.getElementById("botonesForm");

  if (hayFormulario && !formCerrado) {
    contenedor.className = "btn-row";
    contenedor.innerHTML = `
      <button class="btn-main" id="crearForm">Crear formulario</button>
      <button class="btn-danger" id="cerrarForm">Cerrar formulario</button>
    `;
  } else {
    contenedor.className = "";
    contenedor.innerHTML = `
      <button class="btn-main" id="crearForm">Crear formulario</button>
    `;
  }

  document.getElementById("crearForm").addEventListener("click", onCrearForm);
  const btnCerrar = document.getElementById("cerrarForm");
  if (btnCerrar) btnCerrar.addEventListener("click", onCerrarForm);
}

// =========================
// RESTAURAR AL ABRIR
// =========================

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get([STORAGE_KEY, RESULT_KEY], (res) => {
    const formData   = res[STORAGE_KEY];
    const resultData = res[RESULT_KEY];

    if (formData) {
      document.getElementById("descripcion").value = formData.descripcion || "";
      document.getElementById("fin").value         = formData.fin || "";
    }

    const hayFormulario = !!resultData;
    const formCerrado   = resultData?.cerrado || false;

    actualizarBotones(hayFormulario, formCerrado);

    if (hayFormulario) {
      mostrarResultado(resultData, formCerrado ? "Formulario cerrado" : "Último formulario generado");
      iniciarCountdown(formData?.fin, formCerrado);
    }
  });
});

// =========================
// AUTOGUARDADO
// =========================

function guardarDatos() {
  const data = {
    descripcion: document.getElementById("descripcion").value,
    fin:         document.getElementById("fin").value
  };
  chrome.storage.local.set({ [STORAGE_KEY]: data });
}

["descripcion", "fin"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", guardarDatos);
});

// =========================
// LIMPIAR
// =========================

document.getElementById("limpiarForm").addEventListener("click", () => {
  document.getElementById("descripcion").value = "";
  document.getElementById("fin").value         = "";
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("countdown").textContent = "";
  if (countdownInterval) clearInterval(countdownInterval);
  chrome.storage.local.remove([STORAGE_KEY, RESULT_KEY]);
  actualizarBotones(false, false);
});

// =========================
// BOTÓN PANEL SIU
// =========================

document.getElementById("abrirPanel").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { alert("No se encontró ninguna pestaña activa."); return; }
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:")) {
      alert("Navegá a una página web primero.");
      return;
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    window.close();
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// =========================
// COPIAR
// =========================

function copiarTexto(texto) {
  navigator.clipboard.writeText(texto).catch(err => console.error("Error copiando:", err));
}

// =========================
// MOSTRAR RESULTADO
// =========================

function mostrarResultado(data, titulo) {
  const resultado = document.getElementById("resultado");
  const color = data.cerrado ? "#ff5252" : "#00c853";

  resultado.innerHTML = `
    <p style="color:${color};"><b>${titulo}</b></p>
    <p><b>Link para alumnos:</b></p>
    <input id="linkForm" value="${data.formUrl}" readonly style="width:100%" />
    <button id="copiarBtn" class="btn-main" style="margin-top:5px;">Copiar nuevamente</button>
    <p style="margin-top:8px;">
      <a href="${data.formUrl}" target="_blank">Abrir formulario</a>
    </p>
    <button id="verRespuestasBtn" class="btn-secondary" style="margin-top:6px;">Ver DNIs recibidos</button>
    <div id="listaDnis" style="margin-top:8px; font-size:13px;"></div>
  `;

  document.getElementById("copiarBtn").addEventListener("click", () => {
    copiarTexto(data.formUrl);
    const btn = document.getElementById("copiarBtn");
    btn.textContent = "Copiado OK";
    setTimeout(() => { btn.textContent = "Copiar nuevamente"; }, 1500);
  });

  document.getElementById("verRespuestasBtn").addEventListener("click", () => {
    cargarDnis(data);
  });
}

// =========================
// CARGAR DNIs
// =========================

async function cargarDnis(data) {
  const btn      = document.getElementById("verRespuestasBtn");
  const listaDnis = document.getElementById("listaDnis");
  if (btn) { btn.disabled = true; btn.textContent = "Cargando..."; }

  try {
    const token = await getAuthToken();
    const finStr = (await new Promise(r =>
      chrome.storage.local.get([STORAGE_KEY], res => r(res[STORAGE_KEY]?.fin))
    ));

    const dnis = await leerRespuestas(token, data.formId, finStr);

    if (!dnis.length) {
      listaDnis.innerHTML = `<p style="opacity:0.7;">Todavía no hay respuestas.</p>`;
      return;
    }

    const texto = dnis.join("\n");
    listaDnis.innerHTML = `
      <p style="margin:4px 0;opacity:0.8;">Total: <b>${dnis.length}</b> DNIs</p>
      <textarea readonly style="width:100%;height:80px;border-radius:6px;padding:6px;border:none;">${texto}</textarea>
      <button id="copiarDnisBtn" class="btn-main" style="margin-top:4px;">Copiar DNIs</button>
    `;

    document.getElementById("copiarDnisBtn").addEventListener("click", () => {
      copiarTexto(texto);
      document.getElementById("copiarDnisBtn").textContent = "Copiado OK";
      setTimeout(() => {
        const b = document.getElementById("copiarDnisBtn");
        if (b) b.textContent = "Copiar DNIs";
      }, 1500);
    });

  } catch (err) {
    listaDnis.innerHTML = `<p style="color:#ff5252;">Error: ${err}</p>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Ver DNIs recibidos"; }
  }
}

// =========================
// HANDLER CREAR FORMULARIO
// =========================

async function onCrearForm() {
  const descripcion = document.getElementById("descripcion").value.trim();
  const fin         = document.getElementById("fin").value;

  if (!descripcion || !fin) {
    document.getElementById("resultado").innerHTML =
      `<p style="color:#ff5252;"><b>Completá todos los campos antes de continuar.</b></p>`;
    return;
  }

  const resultado = document.getElementById("resultado");
  const btn       = document.getElementById("crearForm");
  btn.disabled    = true;

  resultado.innerHTML = `<p id="loadingText">Autenticando...</p>`;
  let dots = 1;
  const interval = setInterval(() => {
    dots = (dots % 3) + 1;
    const el = document.getElementById("loadingText");
    if (el) el.textContent = "Creando formulario" + ".".repeat(dots);
  }, 400);

  try {
    const token = await getAuthToken();
    const data  = await crearFormularioGoogle(token, descripcion, fin);

    // Guardar sin marcar como cerrado
    const resultData = { ...data, cerrado: false };
    chrome.storage.local.set({ [RESULT_KEY]: resultData });

    actualizarBotones(true, false);
    iniciarCountdown(fin, false);
    copiarTexto(data.formUrl);
    mostrarResultado(resultData, "Link copiado automáticamente");

  } catch (err) {
    console.error(err);
    resultado.innerHTML = `<p style="color:#ff5252;"><b>Error: ${err}</b></p>`;
  } finally {
    clearInterval(interval);
    btn.disabled = false;
  }
}

// =========================
// HANDLER CERRAR FORMULARIO
// =========================

async function onCerrarForm() {
  const btn = document.getElementById("cerrarForm");
  btn.disabled  = true;
  btn.textContent = "Cerrando...";

  try {
    const token = await getAuthToken();

    const resultData = await new Promise(r =>
      chrome.storage.local.get([RESULT_KEY], res => r(res[RESULT_KEY]))
    );

    if (!resultData) {
      alert("No hay formulario activo.");
      btn.disabled = false;
      btn.textContent = "Cerrar formulario";
      return;
    }

    // Cerrar via API
    await cerrarFormulario(token, resultData.formId);

    // Marcar como cerrado en storage
    const dataCerrada = { ...resultData, cerrado: true };
    chrome.storage.local.set({ [RESULT_KEY]: dataCerrada });

    // Actualizar UI
    if (countdownInterval) clearInterval(countdownInterval);
    document.getElementById("countdown").textContent = "Formulario cerrado";
    document.getElementById("countdown").className   = "urgente";

    actualizarBotones(true, true);
    mostrarResultado(dataCerrada, "Formulario cerrado ✓");

    // Cargar DNIs automáticamente al cerrar
    await cargarDnis(dataCerrada);

  } catch (err) {
    console.error(err);
    alert("Error cerrando el formulario: " + err);
    btn.disabled = false;
    btn.textContent = "Cerrar formulario";
  }
}