# 🧩 Asistencia SIU Guaraní PRO

![Estado](https://img.shields.io/badge/estado-activo-success)
![Uso](https://img.shields.io/badge/uso-produccion%20interna-blue)
![Stack](https://img.shields.io/badge/stack-Chrome%20Extension%20%7C%20JavaScript-yellow)
![Licencia](https://img.shields.io/badge/licencia-uso%20interno-lightgrey)

Extensión de navegador web para marcar asistencia automáticamente en SIU Guaraní a partir de una lista de DNIs. 
Compatible con Chrome, Edge y Firefox.

Pensada para agilizar el trabajo docente y administrativo, eliminando tareas manuales repetitivas.

---

## ✨ Funcionalidades

- ✅ Panel flotante multifunción (Generación de formulario y Carga de Asistencia por DNI)
- ✅ Activación desde el ícono de la extensión
- ✅ Función de generación automática de formulario de Asistencia con fecha/hora inicio y fecha/hora fin
- ✅ Copiado automático del link al formulario para compartir con estudiantes
- ✅ Pegado directo desde Excel o texto plano en panel de carga de Asistencia
- ✅ Limpieza automática de formato (espacios, puntos, etc.)
- ✅ Detección y conteo de DNIs en tiempo real
- ✅ Marcado automático de asistencia
- ✅ Scroll automático (recorre toda la lista)
- ✅ Resaltado visual de alumnos marcados
- ✅ Persistencia de datos (recuerda la última lista)
- ✅ Botón de limpiar lista
- ✅ Manejo de errores y logs en consola

---

## 🖼️ Vista previa
### Vista de la extensión Carga de asistencias:
![Vista de la extensión 1.1](./img/screenshot.PNG)
### Vista de la extensión inicial:
![Vista de la extensión 1](./img/Screenshot_pop1.PNG)
### Vista de la extensión generando formulario:
![Vista de la extensión 1](./img/Screenshot_pop2.PNG)
### Vista de la extensión con formulario generado:
![Vista de la extensión 1](./img/Screenshot_pop3.PNG)
### Vista de la extensión con Ultimo link generado:
![Vista de la extensión 1](./img/Screenshot_pop4.PNG)

> El panel aparece flotante en la esquina superior derecha y permite gestionar la asistencia de forma rápida.

---

## 📁 Estructura del proyecto

```

siu-auto-asistencia/
│
├── manifest.json
├── content.js
├── popup.js
├── popup.html 
├── styles.css
├── popup.js
├── img/
└── icons/

```

---

## 🔌 Compatibilidad

- Chromium (Chrome, Edge)
- Gecko (Firefox)

## 🚀 Instalación

### Chrome

1. Descargar o clonar este repositorio
2. Abrir el navegador e ir a: [chrome://extensions/](chrome://extensions/)
3. Activar **Modo desarrollador**
4. Hacer clic en **"Cargar descomprimida"**
5. Seleccionar la carpeta del proyecto

### Edge

1. Descargar o clonar este repositorio
2. Abrir el navegador e ir a: [edge://extensions/](edge://extensions/)
3. Activar **Modo para desarrolladores**
4. Hacer clic en **"Cargar desempaquetada"**
5. Seleccionar la carpeta del proyecto

### Firefox

1. Descargar la última versión desde 'Releases' (archivo .xpi)
2. Abrir el navegador e ir a: `about:addons`
3. Hacer clic en en el engranaje de opciones y luego **"Instalar complemento desde archivo"**
4. Seleccionar el archivo .xpi

---

## 🎯 Uso

1. Abrir SIU Guaraní en la pantalla de asistencia
2. Hacer clic en el ícono de la extensión
3. Se abrirá el panel flotante
4. Para cargar asistencia con lista de DNI, pulsar botón Carga asistenia.
4. Pegar la lista de DNIs
5. Presionar **"Marcar asistencia"**
6. Si se desea generar formulario para pasar asistencia, se completa Nombre del formulario, y la fecha/hora que estará abierto el formmulario y se pulsa en **Generar Formulario** (la primera vez se aceptan permisos)
7. Una vez generado el formulario, se copia el link automáticamente al portapapeles, y permite volver a copiarlo, abrir el formulario y acceder a ver las respuestas
8. Tanto el formulario como la planilla de respuestas, quedan alojadas en el Drive del docente

---

## 📌 Formato de entrada

Se acepta solo formatos número sin puntos ni comas.
**Ejemplos válidos:**

```

12345678, 98765432, 23456789

```

**Ejemplos no válidos:**

```

12.345.678
98 765 432

```

---

## ⚠️ Consideraciones

- La extensión depende de la estructura HTML de SIU Guaraní (puede romperse ante cambios del sistema)
- Solo interactúa con los alumnos presentes en la vista actual (incluye scroll automático)
- El rendimiento puede variar según la cantidad de alumnos cargados
- Se recomienda validar los resultados antes de confirmar la operación
- Para utilizar la función de generar formulario, se deben otorgar permisos a la cuenta.

---

## 🤝 Créditos y agradecimientos

Este proyecto se basa en una idea original surgida en el ámbito de la **Universidad Nacional de Hurlingham (UNaHur)**, a partir del trabajo y la experiencia de docentes y alumnos.

Aportes clave:

- 💡 La idea inicial de automatizar el marcado de asistencia surge del trabajo de [**Matías Müller**](https://github.com/matiashmuller)
- 🚀 La iniciativa de llevar esta solución a una extensión de navegador fue impulsada por [**Hernán Coniglio**](https://github.com/hernanconiglio)

Sobre esa base, se desarrolló esta versión, con foco en usabilidad, mantenimiento y extensibilidad, orientada a su aplicación en contextos reales.

---

## 👨‍💻 Contribuciones

El proyecto está abierto a mejoras.

Se valoran especialmente aportes en:

- UI/UX (experiencia de uso)
- Robustez ante cambios de SIU
- Performance en listas grandes
- Nuevas funcionalidades

Para contribuir:

1. Fork del repositorio
2. Crear una rama (`feature/nombre-descriptivo`)
3. Commit de cambios claros
4. Enviar Pull Request

Toda mejora orientada a uso real es bienvenida.

---

## 🧠 Enfoque del proyecto

Esta herramienta está diseñada como:

- ✔ Solución práctica de automatización
- ✔ Código mantenible y extensible
- ✔ Uso real en entornos productivos

---

## 📄 Licencia

Uso interno / educativo. Adaptar según necesidad.

---

## 🙌 Autor

Desarrollado para optimizar el proceso de asistencia en SIU Guaraní por: 
- [Mauricio Pintos](https://github.com/mauriciopintos)
- [Matias Müller](https://github.com/matiashmuller)
- [Hernán Coniglio](https://github.com/hernanconiglio)

---
