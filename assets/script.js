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


let ultimaImagenEditada = '';

function mostrarHrefActual() {
  const inputImg = document.getElementById('imgSrcInput');
  const srcActualInput = inputImg.value.trim();

  // 🔁 Si hubo un cambio en la imagen anterior, se guarda automáticamente
  if (ultimaImagenEditada && srcActualInput !== ultimaImagenEditada) {
    guardarImagenDesdeInput(); // Usamos tu función actual
  }

  const enlaceActual = enlacesConPatron[indiceActual];
  const descripcion = descripcionesEnlaces[indiceActual] || 'Sin descripción';

  // Mostrar href en input
  document.getElementById('hrefInput').value = extraerUrl(enlaceActual.getAttribute('href'));

  // Mostrar estado
  document.getElementById('estadoEnlace').textContent =
    `🔗 Editando enlace ${indiceActual + 1} de ${enlacesConPatron.length} (${descripcion})`;

  // Resaltar el enlace actual
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  enlaceActual.classList.add('resaltado');

  // Mostrar src de imagen en input
  const tdContenedor = enlaceActual.closest('td');
  const img = tdContenedor?.querySelector('img');
  const src = img?.getAttribute('src') || '';

  inputImg.value = src;
  ultimaImagenEditada = src; // 💾 Referencia para saber si se modificó luego

  // Mostrar preview visual
  const preview = document.getElementById('previewImagenInline');
  if (src) {
    preview.src = src;
    preview.style.display = 'block';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }

  actualizarVistaPrevia();
}



function obtenerEnlacesFiltrados() {
  const celdas = template.content.querySelectorAll('td[colspan="2"][align="center"]');
  const setUnico = new Set();
  const enlacesValidos = [];

  celdas.forEach(td => {
    const a = td.querySelector('a[href*="%%=RedirectTo"]');
    const carpetaSeleccionada = obtenerCarpetaSeleccionada();
    const img = td.querySelector(`img[src*="${carpetaSeleccionada}"]`);

    if (a && img) {
      const href = a.getAttribute('href') || '';
      const src = img.getAttribute('src') || '';
      const hash = `${href}|${src}`;

      if (!setUnico.has(hash)) {
        setUnico.add(hash);
        enlacesValidos.push(a); // solo agregamos el <a> al array
      }
    }
  });

  return enlacesValidos;
}


const descripcionesEnlaces = [
  'Vitrina',
  'Categoría 1',
  'Categoría 2',
  'Categoría 3',
  'Categoría 4',
  'Categoría Compl 1',
  'Categoría Compl 2',
  'Categoría Compl 3  ',

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
function obtenerCarpetaSeleccionada() {
  const mes = document.getElementById('carpetaSelector').value;
  return `/static/envioweb/2025/${mes}/`;
}


document.getElementById('cargarBtn').addEventListener('click', () => {
  const rawHtml = document.getElementById('htmlInput').value;
  template.innerHTML = conservarAmpScript(rawHtml); // si estás usando AMP tokens

  eliminarEtiquetasTbody();
  limpiarClasesVacias();
  inyectarEstiloResaltado();

  // ✅ Usamos nuestra lógica filtrada
  enlacesConPatron = obtenerEnlacesFiltrados();

  


  indiceActual = 0;
  document.getElementById('editorHref').classList.remove('d-none');
  document.getElementById('copiarHtmlBtn').classList.add('d-none');
  mostrarHrefActual();
});




 // START FUNCION BOTON APLICAR CAMBIOS

 /*document.getElementById('aplicarCambioBtn').addEventListener('click', () => {
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

    // ✅ Reemplazar comas en el pathname
    const segmentos = tempUrl.pathname.split('/').map(seg => seg.replace(/,/g, '-'));
    tempUrl.pathname = segmentos.join('/');

    // ✅ Construcción del href con AMPscript (sin codificación de %C3...)
    const urlFinal = `${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`;
    document.getElementById('hrefInput').value = urlFinal;

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
});*/

function aplicarCambioHref(idInput = 'hrefInput') {
  let nuevaUrl = document.getElementById(idInput).value.trim();
  if (!nuevaUrl) return alert('⚠️ Ingresa una URL válida.');

  const enlaceActual = enlacesConPatron[indiceActual];
  if (!enlaceActual) return;

  nuevaUrl = nuevaUrl.normalize("NFD").replace(/[\u0300-\u036f]/g, '');

  if (!/^https?:\/\//i.test(nuevaUrl)) {
    nuevaUrl = 'https://' + nuevaUrl;
  }

  try {
    const tempUrl = new URL(nuevaUrl);

    if (!tempUrl.hostname.startsWith('www.')) {
      tempUrl.hostname = 'www.' + tempUrl.hostname;
    }

    const parametrosAEliminar = ['domain', 'exp', 'sc', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign'];
    parametrosAEliminar.forEach(param => tempUrl.searchParams.delete(param));

    const segmentos = tempUrl.pathname.split('/').map(seg => seg.replace(/,/g, '-'));
    tempUrl.pathname = segmentos.join('/');

    let urlFinal = `${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`;
    document.getElementById(idInput).value = urlFinal;

    let nuevoHref = '';

    // 🟡 Validación para NO usar AMPscript si es de Decolovers Blog
    const esDecoloversBlog = tempUrl.hostname.includes('sodimac.decolovers.cl') && tempUrl.pathname.startsWith('/blog/articulos');
    if (esDecoloversBlog) {
      nuevoHref = urlFinal;
    } else {
      // 🟠 Validación especial para buscador con parámetros
      const esBusqueda = urlFinal.includes('/sodimac-cl/buscar?Ntt=');
      const tieneFacet = urlFinal.includes('facetSelected=true') || urlFinal.includes('sellerId=SODIMAC');
      const separadorAmp = (esBusqueda || tieneFacet) ? '&' : '?';

      nuevoHref = `%%=RedirectTo(concat('${urlFinal}${separadorAmp}',@prefix))=%%`;
    }

    enlaceActual.setAttribute('href', nuevoHref);

    // 🖼️ ALT automático
    const segmentosSignificativos = tempUrl.pathname.split('/').filter(seg => seg && !/^\d+$/.test(seg));
    let altSegment = segmentosSignificativos[3] || segmentosSignificativos.at(-1);
    if (altSegment && /^[\w\-]+$/.test(altSegment)) {
      altSegment = altSegment.replace(/[-_]/g, ' ').trim().replace(/\s+/g, ' ');
      altSegment = altSegment.charAt(0).toUpperCase() + altSegment.slice(1);
      const img = enlaceActual.querySelector('img');
      if (img) img.setAttribute('alt', `Ir a ${altSegment}`);
    }

    // ✅ Guardar imagen si hay input lleno
    const nuevaImagen = document.getElementById('imgSrcInput')?.value.trim();
    if (nuevaImagen) {
      const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
      const dominioHTTPS = 'https://www.sodimac.cl';
      const srcFinal = nuevaImagen.startsWith(baseFTP)
        ? nuevaImagen.replace(baseFTP, dominioHTTPS).replace(/\\/g, '/')
        : nuevaImagen;

      const tdContenedor = enlaceActual.closest('td');
      const img = tdContenedor?.querySelector('img');
      if (img) {
        img.setAttribute('src', srcFinal);
        const preview = document.getElementById('previewImagenInline');
        if (preview) {
          preview.src = srcFinal;
          preview.style.display = 'block';
        }
      }
    }

  } catch (e) {
    console.warn('❌ URL inválida:', e);
    return alert('❌ La URL ingresada no es válida.');
  }

  // ✅ Avanza al siguiente enlace o termina
  if (indiceActual < enlacesConPatron.length - 1) {
    indiceActual++;
    mostrarHrefActual();
  } else {
    mostrarToast('✅ Todos los enlaces fueron modificados.', 'success');
    document.getElementById('copiarHtmlBtn').classList.remove('d-none');
    actualizarVistaPrevia();
  }
}




 // FIN FUNCION BOTON APLICAR CAMBIOS





 document.getElementById('siguienteBtn').addEventListener('click', () => {
  if (indiceActual < enlacesConPatron.length - 1) {
    mostrarHrefActual(); // autoguarda si detecta cambio
    indiceActual++;
    mostrarHrefActual();
  }
});

document.getElementById('anteriorBtn').addEventListener('click', () => {
  if (indiceActual > 0) {
    mostrarHrefActual(); // autoguarda si detecta cambio
    indiceActual--;
    mostrarHrefActual();
  }
});


// START COPIAR HTML BTN
document.getElementById('copiarHtmlBtn').addEventListener('click', () => {
  const inputImg = document.getElementById('imgSrcInput');
  const nuevaSrc = inputImg?.value.trim();
  const enlaceActual = enlacesConPatron[indiceActual];

  // ✅ Guardar imagen si hubo cambios antes de copiar
  if (enlaceActual) {
    let img = enlaceActual.querySelector('img') || enlaceActual.closest('td')?.querySelector('img');
    const srcActual = img?.getAttribute('src') || '';

    if (nuevaSrc && nuevaSrc !== srcActual) {
      const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
      const dominioHTTPS = 'https://www.sodimac.cl';

      let srcFinal = nuevaSrc.startsWith(baseFTP)
        ? nuevaSrc.replace(baseFTP, dominioHTTPS).replace(/\\/g, '/')
        : nuevaSrc;

      inputImg.value = srcFinal;
      img?.setAttribute('src', srcFinal);

      const preview = document.getElementById('previewImagenInline');
      if (preview) {
        preview.src = srcFinal;
        preview.style.display = 'block';
      }

      actualizarVistaPrevia?.();
    }

    // ✅ Detectar si el enlace actual es del buscador
    const hrefOriginal = enlaceActual.getAttribute('href');
    const matchBuscar = hrefOriginal.match(/^%%=RedirectTo\(concat\('(https:\/\/www\.sodimac\.cl\/sodimac-cl\/buscar)\?(.+?)',@prefix\)\)=%%$/);
    
    if (matchBuscar) {
      const nuevaHref = `%%=RedirectTo(concat('${matchBuscar[1]}&${matchBuscar[2]}',@prefix))=%%`;
      enlaceActual.setAttribute('href', nuevaHref);
    }
  }

  // 🔁 Limpiar resaltados
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  const styleTag = template.content.querySelector('style[data-resaltado]');
  if (styleTag) styleTag.remove();

  eliminarEtiquetasTbody();
  limpiarClasesVacias();

  let finalHTML = template.innerHTML;

  // ✅ Eliminar etiquetas <custom>
  finalHTML = finalHTML.replace(/<\/?custom>/gi, '');

  // ✅ Restaurar AMPscript y limpiar entidades HTML
  finalHTML = restaurarAmpScript(finalHTML).replace(/&amp;/g, '&');

  // ✅ Copiar al portapapeles
  navigator.clipboard.writeText(finalHTML).then(() => {
    mostrarToast('✅ HTML limpio copiado al portapapeles', 'success');

    // 🧼 Limpieza visual e inputs
    document.getElementById('htmlInput').value = '';
    document.getElementById('skuInput').value = '';
    document.getElementById('ocrProgreso').textContent = '';
    document.getElementById('resultadoSKU').value = '';
    document.getElementById('imgSrcInput').value = '';

    const iframe = document.getElementById('vistaPrevia');
    iframe.removeAttribute('srcdoc');
    iframe.src = 'about:blank';

    const iframeModal = document.getElementById('vistaPreviaModal');
    if (iframeModal) iframeModal.src = 'about:blank';

    const copiarBtn = document.getElementById('copiarAmpBtn');
    if (copiarBtn) copiarBtn.classList.add('d-none');

    template.innerHTML = '';
    enlacesConPatron = [];
    indiceActual = 0;

    document.getElementById('editorHref').classList.add('d-none');
    document.getElementById('copiarHtmlBtn').classList.add('d-none');

    const imgInline = document.getElementById('previewImagenInline');
    if (imgInline) {
      imgInline.src = '';
      imgInline.style.display = 'none';
    }

    // Scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Recarga final opcional
    setTimeout(() => {
      location.reload();
    }, 1500);
  }).catch(err => {
    console.error('❌ Error al copiar HTML:', err);
    mostrarToast('❌ Error al copiar HTML', 'error');
  });
});




// FIN COPIAR HTML BTN




// START TOGGLE DARK Y LIGTH

const toggleBtn = document.getElementById('toggleThemeBtn');
const body = document.body;

function aplicarTema(modo) {
  body.setAttribute('data-bs-theme', modo);
  localStorage.setItem('modoVisual', modo);

  // Si tienes CodeMirror activo, cambia su tema también
  if (typeof codeMirrorTabla !== 'undefined') {
    codeMirrorTabla.setOption('theme', modo === 'dark' ? 'material-darker' : 'eclipse');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const guardado = localStorage.getItem('modoVisual') || 'light';
  aplicarTema(guardado);
});

toggleBtn.addEventListener('click', () => {
  const actual = body.getAttribute('data-bs-theme') || 'light';
  const nuevo = actual === 'light' ? 'dark' : 'light';
  aplicarTema(nuevo);
});


// FIN TOGGLE DARK Y LIGTH

// START Función para mostrar una vista y ocultar las otras
const vistaEditor = document.getElementById('vistaEditor');
const vistaSku = document.getElementById('vistaSku');
const vistaConversor = document.getElementById('vistaConversor');
const vistaAmpEditor = document.getElementById('vistaAmpEditor');

const navEditor = document.getElementById('navEditor');
const navSku = document.getElementById('navSku');
const navConversor = document.getElementById('navConversor');
const navAmp = document.getElementById('navAmp');

function mostrarVista(vista) {
  vistaEditor.style.display = vista === 'editor' ? 'block' : 'none';
  vistaSku.style.display = vista === 'sku' ? 'block' : 'none';
  vistaConversor.style.display = vista === 'conversor' ? 'block' : 'none';
  vistaAmpEditor.style.display = vista === 'amp' ? 'block' : 'none';

  navEditor.classList.toggle('active', vista === 'editor');
  navSku.classList.toggle('active', vista === 'sku');
  navConversor.classList.toggle('active', vista === 'conversor');
  navAmp.classList.toggle('active', vista === 'amp');
}

// Listeners
navEditor.addEventListener('click', () => mostrarVista('editor'));
navSku.addEventListener('click', () => mostrarVista('sku'));
navConversor.addEventListener('click', () => mostrarVista('conversor'));
navAmp.addEventListener('click', () => mostrarVista('amp'));

// Vista por defecto
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
  
    // ✅ Extraer solo números de 9 dígitos
    const posiblesSKUs = [...input.matchAll(/\b\d{9}\b/g)].map(m => m[0]);
    const skus = [...new Set(posiblesSKUs)].slice(0, 12); // sin duplicados
  
    // ✅ Mostrar contador visual
    const contador = document.getElementById('skuContador');
    contador.textContent = `${skus.length} de 16 SKUs`;
  
    if (skus.length === 0) {
      contador.classList.remove('text-muted');
      contador.classList.add('text-danger');
      return alert('❌ No se encontraron SKUs válidos de 9 dígitos.');
    }
  
    if (skus.length > 16) {
      contador.classList.remove('text-muted');
      contador.classList.add('text-danger', 'fw-bold');
    } else {
      contador.classList.remove('text-danger', 'fw-bold');
      contador.classList.add('text-muted');
    }
  
    const bloquearCampos = skus.length === 9;
    const camposBloqueadosCondicional = ['04', '08', '12'];
  
    let usableIndex = 0;
    let output = '';
  
    for (let fila = 0; fila < 3; fila++) {
      output += `/*** Fila ${fila + 1} ***/\n`;
  
      for (let i = 0; i < 4; i++) {
        const numSKU = fila * 4 + i + 1;
        const idSKU = numSKU < 10 ? `0${numSKU}` : `${numSKU}`;
        const aliasSKU = numSKU < 10 ? `0${numSKU}${numSKU}` : `01${numSKU}`;
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

function inicializarConversorFTP(idInput, idSalida, idCheckbox) {
  const input = document.getElementById(idInput);
  const salida = document.getElementById(idSalida);
  const checkbox = document.getElementById(idCheckbox);

  function actualizar() {
    const urls = formatearFTPUrlMultiple(input.value, checkbox.checked);
    salida.value = urls.join('\n');
  }

  input.addEventListener('input', actualizar);

  checkbox.addEventListener('change', actualizar);

  input.addEventListener('paste', function (e) {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text');
    const textoActual = input.value.trim();
    input.value = (textoActual ? textoActual + '\n' : '') + pastedText + '\n';
    actualizar();
  });

  input.addEventListener('paste', function () {
    setTimeout(() => {
      const urls = formatearFTPUrlMultiple(input.value, checkbox.checked);
      salida.value = urls.join('\n');

      if (urls.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No se encontró ninguna URL válida',
          text: 'Asegúrate de que las URLs tengan el patrón correcto.',
          confirmButtonColor: '#0d6efd'
        });
      }
    }, 100);
  });
}


function formatearFTPUrlMultiple(texto, quitarNumeroFinal = false) {
  const baseEsperada = 'ftp://soclAdmin@10.1.3.63/produccion';
  const nuevoDominio = 'https://www.sodimac.cl';

  return texto
    .split(/\r?\n/)
    .map(linea => linea.trim().replace(/\\/g, '/'))
    .filter(linea => linea.length > 0 && linea.includes(baseEsperada))
    .map(linea => {
      let url = nuevoDominio + linea.replace(baseEsperada, '');
      if (quitarNumeroFinal) {
        url = url.replace(/-\d+\.(png|jpg|gif)$/i, '').replace(/\.(png|jpg|gif)$/i, '');
      }
      return url;
    });
}


// Inicializar múltiples bloques
inicializarConversorFTP('ftpInputMultiple', 'urlListaResultado', 'removeLastImageNumber');
inicializarConversorFTP('ftpInput2', 'urlResultado2', 'checkFinal2');
// puedes seguir agregando más...



// Funcion copiar  URLs FTP:
function copiarListaResultado(idTextarea) {
  const textarea = document.getElementById(idTextarea);
  const contenido = textarea.value.trim();

  if (!contenido) {
    mostrarToast('⚠️ No hay URLs para copiar', 'warning');
    return;
  }

  navigator.clipboard.writeText(contenido)
    .then(() => mostrarToast('✅ URLs copiadas al portapapeles', 'success'))
    .catch(err => {
      console.error('Error al copiar:', err);
      mostrarToast('❌ Error al copiar', 'error');
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


// START FUNCION reamplzado imagenes masivas
 function reemplazarRutaBaseDetectandoCarpeta(rutaFtpUsuario) {
  if (!rutaFtpUsuario || !rutaFtpUsuario.includes('/static/envioweb/')) {
    return alert('❌ La ruta debe contener /static/envioweb/');
  }

  const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
  const dominioHTTPS = 'https://www.sodimac.cl';

  // Convertir ruta FTP → HTTPS
  const nuevaBase = rutaFtpUsuario
    .replace(baseFTP, dominioHTTPS)
    .replace(/\\/g, '/')
    .trim();

  const nuevaRelativa = nuevaBase.split('/static/envioweb/')[1];
  if (!nuevaRelativa) {
    return alert('❌ Ruta no válida para reemplazo');
  }

  const imgs = template.content.querySelectorAll('img');
  let contador = 0;

  imgs.forEach(img => {
    const src = img.getAttribute('src');
    if (!src || !src.includes('/static/envioweb/')) return;

    // Detectar segmento clave /mes-carpeta/images/mes-carpeta-
    const matchBase = src.match(/\/\d{2}-[a-z]+\/images\/\d{2}-[a-z]+-/i);
    const matchNumero = src.match(/(\d+\.(png|jpg|jpeg|gif))$/i);

    if (!matchBase || !matchNumero) return;

    const numeroFinal = matchNumero[1];
    const nuevaRuta = `${dominioHTTPS}/static/envioweb/${nuevaRelativa}${numeroFinal}`;

    img.setAttribute('src', nuevaRuta);
    contador++;
  });

  actualizarVistaPrevia();
  mostrarToast(`✅ ${contador} imagen(es) actualizada(s) con nueva carpeta`);
}
// FIN FUNCION reamplAzado imagenes masivas






function guardarImagenDesdeInput() {
  const input = document.getElementById('imgSrcInput');
  let nuevaSrc = input?.value.trim();
  const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
  const dominioHTTPS = 'https://www.sodimac.cl';

  if (!nuevaSrc) return mostrarToast('⚠️ Ingresa una URL de imagen válida', 'warning');

  // ⚠️ Solo convertir si realmente comienza con base FTP
  if (nuevaSrc.startsWith(baseFTP)) {
    const nuevaConvertida = nuevaSrc.replace(baseFTP, dominioHTTPS).replace(/\\/g, '/');

    // Solo si es diferente de lo ya mostrado, actualizar input y usar nuevo valor
    if (nuevaSrc !== nuevaConvertida) {
      nuevaSrc = nuevaConvertida;
      input.value = nuevaSrc; // evita recodificación infinita
    }
  }

  const enlaceActual = enlacesConPatron?.[indiceActual];
  if (!enlaceActual) return mostrarToast('❌ No se encontró el enlace actual', 'danger');

  let img = enlaceActual.querySelector('img') || enlaceActual.closest('td')?.querySelector('img');
  if (!img) return mostrarToast('❌ No se encontró imagen relacionada al enlace', 'danger');

  const srcActual = img.getAttribute('src');
  if (srcActual === nuevaSrc) {
    return mostrarToast('⚠️ La imagen ya tiene esa misma URL. No se realizó ningún cambio.', 'info');
  }

  img.setAttribute('src', nuevaSrc);

  const previewImg = document.getElementById('previewImagenInline');
  if (previewImg) {
    previewImg.src = nuevaSrc;
    previewImg.style.display = 'block';
  }

  if (typeof actualizarVistaPrevia === 'function') actualizarVistaPrevia();

  mostrarToast('💾 Imagen guardada automáticamente antes de avanzar', 'info');
}





function inputRutaFtpReemplazo(ruta) {
  if (!ruta.includes('/static/envioweb/')) return ruta;

  // Extrae número final si existe
  const match = ruta.match(/(-\d+\.(png|jpg|jpeg|gif))$/i);
  const numeroFinal = match ? match[1] : '';

  // Elimina todo lo anterior a partir de "static/envioweb"
  const base = ruta.split('/static/envioweb/')[1];
  if (!base) return ruta;

  // Generar nueva ruta limpia
  const nuevoPath = `https://www.sodimac.cl/static/envioweb/${base.replace(/-\d+\.(png|jpg|jpeg|gif)$/i, '')}${numeroFinal}`;
  return nuevoPath;
}





