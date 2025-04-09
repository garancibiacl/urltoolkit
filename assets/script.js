// script.js
const template = document.createElement('template');
template.innerHTML = '';
document.body.appendChild(template);

let enlacesConPatron = [];
let indiceActual = 0;
let originalHtml = '';
let bloquesAmp = [];

function conservarAmpScript(html) {
  bloquesAmp = [];
  return html.replace(/(%%\[.*?%%)/gs, (match) => {
    const token = `<!--AMP${bloquesAmp.length}-->`;
    bloquesAmp.push(match);
    return token;
  });
}

function restaurarAmpScript(html) {
  bloquesAmp.forEach((bloque, i) => {
    html = html.replace(`<!--AMP${i}-->`, bloque);
  });
  return html;
}

function eliminarEtiquetasTbody() {
  const tbodys = template.content.querySelectorAll('tbody');
  tbodys.forEach(tbody => {
    const parent = tbody.parentNode;
    while (tbody.firstChild) {
      parent.insertBefore(tbody.firstChild, tbody);
    }
    parent.removeChild(tbody);
  });
}

function limpiarClasesVacias() {
  const elementosConClase = template.content.querySelectorAll('[class]');
  elementosConClase.forEach(el => {
    if (el.getAttribute('class').trim() === '') {
      el.removeAttribute('class');
    }
  });
}

function inyectarEstiloResaltado() {
  let styleTag = template.content.querySelector('style[data-resaltado]');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.setAttribute('data-resaltado', '');
    styleTag.textContent = `.resaltado { outline: 3px solid #ff9800 !important; box-shadow: 0 0 8px #ff9800; }`;
    template.content.insertBefore(styleTag, template.content.firstChild);
  }
}



function mostrarHrefActual() {
  const enlaceActual = enlacesConPatron[indiceActual];
  const descripcion = descripcionesEnlaces[indiceActual] || 'Sin descripción';

  // Mostrar URL en el input
  document.getElementById('hrefInput').value = extraerUrl(enlaceActual.getAttribute('href'));

  // Mostrar descripción con índice
  document.getElementById('estadoEnlace').textContent =
    `🔗 Editando enlace ${indiceActual + 1} de ${enlacesConPatron.length} (${descripcion})`;

  // Limpiar resaltado anterior y resaltar el actual
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  enlaceActual.classList.add('resaltado');

  // ✅ Mostrar imagen desde el <td> relacionado al enlace actual
  const tdContenedor = enlaceActual.closest('td');
  const img = tdContenedor?.querySelector('img');
  const src = img?.getAttribute('src') || '';

  const vistaImg = document.getElementById('previewImagenInline');
  if (src) {
    vistaImg.src = src;
    vistaImg.style.display = 'block';
  } else {
    vistaImg.src = '';
    vistaImg.style.display = 'none';
  }

  // Refrescar iframe o vista previa
  actualizarVistaPrevia();
}


const descripcionesEnlaces = [
  'Vitrina',
  'Categoría 1',
  'Categoría 2',
  'Categoría 3',
  'Categoría Compl 1',
  'Categoría Compl 2',

];


function extraerUrl(href) {
  const match = href.match(/^%%=RedirectTo\(concat\('(.+?[\?&])',@prefix\)\)=%%$/);
  return match ? match[1].slice(0, -1) : '';
}

function construirHref(nuevaUrl) {
  const separador = nuevaUrl.includes('?') ? '&' : '?';
  return `%%=RedirectTo(concat('${nuevaUrl}${separador}',@prefix))=%%`;
}

function actualizarVistaPrevia() {
  const iframe = document.getElementById('vistaPrevia');
  iframe.srcdoc = template.innerHTML;
}

document.getElementById('cargarBtn').addEventListener('click', () => {
  const entrada = document.getElementById('htmlInput').value;
  originalHtml = entrada;
  const procesado = conservarAmpScript(entrada);
  template.innerHTML = procesado;

  eliminarEtiquetasTbody();
  limpiarClasesVacias();
  inyectarEstiloResaltado();

  const enlaces = template.content.querySelectorAll('a[href]');
  enlacesConPatron = Array.from(enlaces).filter(a =>
    a.getAttribute('href')?.match(/^%%=RedirectTo\(concat\('.*?[\?&]',@prefix\)\)=%%$/)
  );

  if (enlacesConPatron.length === 0) {
    mostrarToast('⚠️ No se encontró ningún href con el patrón esperado.', 'danger');
    return;
  }

  indiceActual = 0;
  document.getElementById('editorHref').classList.remove('d-none');
  document.getElementById('copiarHtmlBtn').classList.add('d-none');
  mostrarHrefActual();
});



 // START FUNCION BOTON APLICAR CAMBIOS

 document.getElementById('aplicarCambioBtn').addEventListener('click', () => {
  let nuevaUrl = document.getElementById('hrefInput').value.trim();

  if (!nuevaUrl) return alert('⚠️ Ingresa una URL válida.');

  const enlaceActual = enlacesConPatron[indiceActual];
  if (!enlaceActual) return;

  // ✅ Normalizar y quitar acentos
  nuevaUrl = nuevaUrl.normalize("NFD").replace(/[\u0300-\u036f]/g, '');

  // ✅ Agrega https:// si no tiene
  if (!/^https?:\/\//i.test(nuevaUrl)) {
    nuevaUrl = 'https://' + nuevaUrl;
  }

  try {
    const tempUrl = new URL(nuevaUrl);

    // ✅ Agrega www. si el dominio no lo tiene
    if (!tempUrl.hostname.startsWith('www.')) {
      tempUrl.hostname = 'www.' + tempUrl.hostname;
    }

    // ✅ Eliminar parámetros innecesarios
    const parametrosAEliminar = ['domain', 'exp', 'sc', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign'];
    parametrosAEliminar.forEach(param => tempUrl.searchParams.delete(param));

    const urlFinal = tempUrl.toString();

    // ✅ Construcción del href con AMPscript
    const nuevoHref = `%%=RedirectTo(concat('${urlFinal}?',@prefix))=%%`;
    enlaceActual.setAttribute('href', nuevoHref);

    // ✅ Alt automático (4º segmento significativo o último)
    const segmentosSignificativos = tempUrl.pathname
      .split('/')
      .filter(seg => seg && !/^\d+$/.test(seg));

    let altSegment = segmentosSignificativos[3] || segmentosSignificativos.at(-1);
    if (altSegment && /^[\w\-]+$/.test(altSegment)) {
      altSegment = altSegment.replace(/[-_]/g, ' ').trim().replace(/\s+/g, ' ');
      altSegment = altSegment.charAt(0).toUpperCase() + altSegment.slice(1);
      const img = enlaceActual.querySelector('img');
      if (img) img.setAttribute('alt', `Ir a ${altSegment}`);
    }

  } catch (e) {
    console.warn('❌ URL inválida:', e);
    return alert('❌ La URL ingresada no es válida.');
  }

  // ✅ Avanzar al siguiente enlace
  if (indiceActual < enlacesConPatron.length - 1) {
    indiceActual++;
    mostrarHrefActual();
  } else {
    alert('✅ Todos los enlaces fueron modificados.');
    document.getElementById('copiarHtmlBtn').classList.remove('d-none');
    actualizarVistaPrevia();
  }
});



 // FIN FUNCION BOTON APLICAR CAMBIOS





document.getElementById('siguienteBtn').addEventListener('click', () => {
  if (indiceActual < enlacesConPatron.length - 1) {
    indiceActual++;
    mostrarHrefActual();
  }
});

document.getElementById('anteriorBtn').addEventListener('click', () => {
  if (indiceActual > 0) {
    indiceActual--;
    mostrarHrefActual();
  }
});

document.getElementById('copiarHtmlBtn').addEventListener('click', () => {
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));

  const styleTag = template.content.querySelector('style[data-resaltado]');
  if (styleTag) styleTag.remove();

  eliminarEtiquetasTbody();
  limpiarClasesVacias();

  let finalHTML = template.innerHTML;
  finalHTML = restaurarAmpScript(finalHTML).replace(/&amp;/g, '&');

  navigator.clipboard.writeText(finalHTML).then(() => {
    mostrarToast('✅ URLs copiadas al portapapeles');

    
       // ✅ LIMPIEZA COMPLETA
document.getElementById('htmlInput').value = '';
document.getElementById('skuInput').value = '';
document.getElementById('ocrProgreso').textContent = '';
document.getElementById('resultadoSKU').value = '';

// ✅ Limpiar iframe de vista previa
const iframe = document.getElementById('vistaPrevia');
iframe.removeAttribute('srcdoc');
iframe.src = 'about:blank';

// (Opcional) también limpia el iframe del modal si se usa
const iframeModal = document.getElementById('vistaPreviaModal');
if (iframeModal) iframeModal.src = 'about:blank';

    
    const copiarBtn = document.getElementById('copiarAmpBtn');
    if (copiarBtn) copiarBtn.classList.add('d-none');

    // ✅ LIMPIAR CONTENIDO HTML TEMPORAL Y VARIABLES
    template.innerHTML = '';
    enlacesConPatron = [];
    indiceActual = 0;

    // ✅ OCULTAR EDITOR Y MOSTRAR INICIO
    document.getElementById('editorHref').classList.add('d-none');
    document.getElementById('copiarHtmlBtn').classList.add('d-none');

    // ✅ OPCIONAL: limpiar zona de imagen inline
    const imgInline = document.getElementById('previewImagenInline');
    if (imgInline) {
      imgInline.src = '';
      imgInline.style.display = 'none';
    }

    // ✅ OPCIONAL: hacer scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ✅ Opcional: mostrar mensaje visual o reiniciar texto en input HTML
    document.getElementById('htmlInput').value = '';
  }).catch(err => {
    console.error('Error al copiar HTML:', err);
  });
});







const toggleBtn = document.getElementById('toggleThemeBtn');
const body = document.body;

// Función para aplicar el tema
function aplicarTema(modo) {
  body.setAttribute('data-bs-theme', modo); 
  toggleBtn.textContent = modo === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('modoVisual', modo);
}

// Cargar tema guardado al iniciar
window.addEventListener('DOMContentLoaded', () => {
  const modoGuardado = localStorage.getItem('modoVisual') || 'light';
  aplicarTema(modoGuardado);
});

// Alternar entre claro y oscuro al hacer clic
toggleBtn.addEventListener('click', () => {
  const modoActual = body.getAttribute('data-bs-theme') || 'light';
  const nuevoModo = modoActual === 'light' ? 'dark' : 'light';
  aplicarTema(nuevoModo);
});




// START Función para mostrar una vista y ocultar las otras
const vistaEditor = document.getElementById('vistaEditor');
const vistaSku = document.getElementById('vistaSku');
const vistaConversor = document.getElementById('vistaConversor');

const navEditor = document.getElementById('navEditor');
const navSku = document.getElementById('navSku');
const navConversor = document.getElementById('navConversor');

// Función para mostrar una vista y ocultar las otras
function mostrarVista(vista) {
  if (vista === 'editor') {
    vistaEditor.style.display = 'block';
    vistaSku.style.display = 'none';
    vistaConversor.style.display = 'none';

    navEditor.classList.add('active');
    navSku.classList.remove('active');
    navConversor.classList.remove('active');

  } else if (vista === 'sku') {
    vistaEditor.style.display = 'none';
    vistaSku.style.display = 'block';
    vistaConversor.style.display = 'none';

    navEditor.classList.remove('active');
    navSku.classList.add('active');
    navConversor.classList.remove('active');

  } else if (vista === 'conversor') {
    vistaEditor.style.display = 'none';
    vistaSku.style.display = 'none';
    vistaConversor.style.display = 'block';

    navEditor.classList.remove('active');
    navSku.classList.remove('active');
    navConversor.classList.add('active');
  }
}


// Listeners del navbar
navEditor.addEventListener('click', () => mostrarVista('editor'));
navSku.addEventListener('click', () => mostrarVista('sku'));
navConversor.addEventListener('click', () => mostrarVista('conversor'));

// Mostrar vista por defecto
mostrarVista('editor');

// FIN Función para mostrar una vista y ocultar las otras





document.addEventListener("DOMContentLoaded", () => {
  const copiarAmpBtn = document.getElementById('copiarAmpBtn');
  const toastElement = document.getElementById('toastCopiado');
  const toastCopiado = new bootstrap.Toast(toastElement);

  // START Generador de SKUs

document.getElementById('generarSkuBtn').addEventListener('click', () => {
  const input = document.getElementById('skuInput').value.trim();
  if (!input) return alert('⚠️ Ingresa al menos un SKU.');

  const skus = input.split(/\n/).map(s => s.trim()).filter(s => s !== '').slice(0, 12);
  const bloquearCampos = skus.length === 9;
  const camposBloqueadosCondicional = ['04', '08', '12'];

  let usableIndex = 0;
  let output = '';

  for (let fila = 0; fila < 3; fila++) {
    output += `/*** Fila ${fila + 1} ***/\n`;

    for (let i = 0; i < 4; i++) {
      const numSKU = fila * 4 + i + 1; // de 1 a 12
      const idSKU = numSKU < 10 ? `0${numSKU}` : `${numSKU}`; // SKU_01...SKU_12
      const aliasSKU = numSKU < 10 ? `0${numSKU}${numSKU}` : `01${numSKU}`; // @SKU_011, @SKU_0110

      const debeBloquear = bloquearCampos && camposBloqueadosCondicional.includes(idSKU);

      if (debeBloquear) {
        output += `IF SKU_${idSKU} < 0 THEN SET @SKU_${aliasSKU}='0' ELSE SET @SKU_${aliasSKU}='0' ENDIF\n`;
      } else {
        const valor = skus[usableIndex] || '0';
        output += `IF SKU_${idSKU} < 0 THEN SET @SKU_${aliasSKU}='0' ELSE SET @SKU_${aliasSKU}='${valor}' ENDIF\n`;
        usableIndex++;
      }
    }

    output += '\n';
  }

  document.getElementById('resultadoSKU').value = output.trim();
  copiarAmpBtn.classList.remove('d-none');
});


// FIN Generador de SKUs





  

  // Copiar AMPscript generado al portapapeles
  copiarAmpBtn.addEventListener('click', () => {
    const resultado = document.getElementById('resultadoSKU').value.trim();
  
    if (!resultado) {
      mostrarToast('⚠️ No hay código AMPscript para copiar.', 'warning');
      return;
    }
  
    navigator.clipboard.writeText(resultado)
      .then(() => mostrarToast('✅ Código AMPscript copiado al portapapeles'))
      .catch(() => mostrarToast('❌ Error al copiar el código.', 'danger'));
  });
  
});


// Contador dinámico
document.getElementById('skuInput').addEventListener('input', () => {
  const lines = document.getElementById('skuInput').value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s !== '');

  const contador = document.getElementById('skuContador');
  const total = lines.length;

  contador.textContent = `${total} de 16 SKUs`;

  if (total > 16) {
    contador.classList.remove('text-muted');
    contador.classList.add('text-danger', 'fw-bold');
  } else {
    contador.classList.remove('text-danger', 'fw-bold');
    contador.classList.add('text-muted');
  }
});





// START Detectar SKUs desde imagen (OCR)
document.getElementById('detectarSkuBtn').addEventListener('click', async () => {
  const archivo = document.getElementById('imagenSku').files[0];
  const progreso = document.getElementById('ocrProgreso');

  if (!archivo) {
    alert('⚠️ Debes seleccionar una imagen primero.');
    return;
  }

  progreso.textContent = '🕐 Procesando imagen con OCR...';

  try {
    const { data: { text } } = await Tesseract.recognize(archivo, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          progreso.textContent = `⏳ OCR progreso: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    // ✅ Buscar SKUs de 9 dígitos en todo el texto, sin importar formato
    let posiblesSKUs = [...text.matchAll(/\b\d{9}\b/g)].map(m => m[0]);

    // Eliminar duplicados
    posiblesSKUs = [...new Set(posiblesSKUs)];

    // Ignorar el 5.º si hay 5 o más
    if (posiblesSKUs.length >= 5) {
      posiblesSKUs.splice(4, 1);
    }

    const final = posiblesSKUs.slice(0, 12);

    if (final.length === 0) {
      progreso.textContent = '❌ No se detectaron SKUs válidos en la imagen.';
      return;
    }

    document.getElementById('skuInput').value = final.join('\n');
    progreso.textContent = `✅ Se insertaron ${final.length} SKU(s) desde imagen.`;

  } catch (err) {
    console.error(err);
    progreso.textContent = '❌ Hubo un error procesando la imagen.';
  }
});





// Botón limpiar imagen + SKUs
document.getElementById('limpiarImagenBtn').addEventListener('click', () => {
  document.getElementById('imagenSku').value = '';
  document.getElementById('skuInput').value = '';
  document.getElementById('ocrProgreso').textContent = '';
  document.getElementById('resultadoSKU').value = ''; // ✅ limpia el AMPscript generado

  // Opcional: ocultar botón de copiar si estaba visible
  const copiarBtn = document.getElementById('copiarAmpBtn');
  if (copiarBtn) copiarBtn.classList.add('d-none');
});


// FIN Detectar SKUs desde imagen (OCR)



// Conversor FTP
// Escucha pegado múltiple
document.getElementById('ftpInputMultiple').addEventListener('paste', function () {
  setTimeout(() => {
    const entrada = document.getElementById('ftpInputMultiple').value;
    const urlsFormateadas = formatearFTPUrlMultiple(entrada);
    const resultado = urlsFormateadas.join('\n');

    document.getElementById('urlListaResultado').value = resultado;

    if (urlsFormateadas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No se encontró ninguna URL válida',
        text: 'Asegúrate de que las URLs tengan el patrón correcto.',
        confirmButtonColor: '#0d6efd'
      });
    } else {
      /*Swal.fire({
        icon: 'success',
        title: `✅ ${urlsFormateadas.length} URL(s) convertida(s)`,
        showConfirmButton: false,
        timer: 1200
      });;*/
    }
  }, 100);
})




//  START Conversor de múltiples URLs FTP → HTTPS

const inputFtp = document.getElementById('ftpInputMultiple');
  const salida = document.getElementById('urlListaResultado');
  const checkQuitarFinal = document.getElementById('removeLastImageNumber');

  inputFtp.addEventListener('input', actualizarResultado);
  checkQuitarFinal.addEventListener('change', actualizarResultado);

  inputFtp.addEventListener('paste', function (e) {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text');
    const textoActual = inputFtp.value.trim();
    const nuevaEntrada = (textoActual ? textoActual + '\n' : '') + pastedText;
    inputFtp.value = nuevaEntrada + '\n';
    actualizarResultado();
  });

  function actualizarResultado() {
    const urls = formatearFTPUrlMultiple(inputFtp.value);
    salida.value = urls.join('\n');
  }

  function formatearFTPUrlMultiple(texto) {
    const baseEsperada = 'ftp://soclAdmin@10.1.3.63/produccion';
    const nuevoDominio = 'https://www.sodimac.cl';
    const quitarNumeroFinal = checkQuitarFinal.checked;

    return texto
      .split(/\r?\n/)
      .map(linea => linea.trim().replace(/\\/g, '/'))
      .filter(linea => linea.length > 0 && linea.includes(baseEsperada))
      .map(linea => {
        let urlTransformada = nuevoDominio + linea.replace(baseEsperada, '');
        if (quitarNumeroFinal) {
          urlTransformada = urlTransformada.replace(/-\d+\.(png|jpg|gif)$/i, '')
          .replace(/\.(png|jpg|gif)$/i, '');
        }
        return urlTransformada;
      });
  }

  function copiarListaResultado() {
    const texto = salida.value;
    if (!texto) {
      mostrarToast('⚠️ No hay URLs para copiar', 'warning');
      return;
    }
  
    navigator.clipboard.writeText(texto).then(() => {
      mostrarToast('✅ URLs copiadas al portapapeles', 'success');
      inputFtp.value = '';
      salida.value = '';
      inputFtp.focus();
    });
  }
  
  
  


//  FIN Conversor de múltiples URLs FTP → HTTPS

   // START FUNCION TOAST

function mostrarToast(mensaje, tipo = 'success') {
  const toastContainerId = 'toastContainer';

  // Si no existe el contenedor, lo creamos una vez
  if (!document.getElementById(toastContainerId)) {
    const container = document.createElement('div');
    container.id = toastContainerId;
    container.className = 'position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  // Crear el toast dinámico
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0 mb-2`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  document.getElementById(toastContainerId).appendChild(toastEl);

  // Iniciar y mostrar el toast
  const bsToast = new bootstrap.Toast(toastEl);
  bsToast.show();

  // Eliminar el toast del DOM cuando termine
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}


 // FIN FUNCION TOAST