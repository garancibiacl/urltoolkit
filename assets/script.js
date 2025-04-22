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
let ultimaHrefEditado = '';

function mostrarHrefActual() {
  const inputImg = document.getElementById('imgSrcInput');
  const inputHref = document.getElementById('hrefInput');

  const enlaceActual = enlacesConPatron[indiceActual];
  const descripcion = descripcionesEnlaces[indiceActual] || 'Sin descripción';

  // 🔗 Obtener href limpio y mostrar en input
  const hrefRaw = enlaceActual.getAttribute('href') || '';
  const hrefExtraido = extraerUrl(hrefRaw);
  inputHref.value = hrefExtraido;
  ultimaHrefEditado = hrefExtraido;

  // 🏷️ Mostrar descripción/posición actual
  document.getElementById('estadoEnlace').textContent =
    `🔗 Editando enlace ${indiceActual + 1} de ${enlacesConPatron.length} (${descripcion})`;

  // 🔲 Resaltado visual del enlace
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  enlaceActual.classList.add('resaltado');

  // 🖼️ Obtener imagen asociada y actualizar input + preview
  const tdContenedor = enlaceActual.closest('td');
  const img = tdContenedor?.querySelector('img');
  const src = img?.getAttribute('src') || '';

  inputImg.value = src;
  ultimaImagenEditada = src; // 💾 Guardar estado original para comparar cambios

  // 🔍 Mostrar vista previa visual
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
  if (!href) return '';

  // ✅ Detectar y extraer URL desde AMPscript con separador ?
  const matchPregunta = href.match(/%%=RedirectTo\(concat\('(.+?)\?',@prefix\)\)=%%/);
  if (matchPregunta) return matchPregunta[1];

  // ✅ Detectar y extraer URL desde AMPscript con separador &
  const matchAmp = href.match(/%%=RedirectTo\(concat\('(.+?)&',@prefix\)\)=%%/);
  if (matchAmp) return matchAmp[1];

  // ✅ Si no es AMPscript, retornar la URL limpia
  return href.trim();
}



function construirHref(nuevaUrl) {
  const tieneParametrosEspeciales =
    nuevaUrl.includes('facetSelected=true') ||
    nuevaUrl.includes('sellerId=SODIMAC') ||
    nuevaUrl.includes('f.product.L2_category_paths=') ||
    nuevaUrl.includes('/sodimac-cl/buscar?Ntt=');

  // ✅ Si hay parámetros especiales, reemplazar el primer ? por &
  if (tieneParametrosEspeciales && nuevaUrl.includes('?')) {
    const idx = nuevaUrl.indexOf('?');
    nuevaUrl = nuevaUrl.slice(0, idx) + '&' + nuevaUrl.slice(idx + 1);
  }

  const separador = nuevaUrl.includes('?') || nuevaUrl.includes('&') ? '&' : '?';
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

function aplicarCambioHref(idInput = 'hrefInput') {
  let nuevaUrl = document.getElementById(idInput).value.trim();
  if (!nuevaUrl) return alert('⚠️ Ingresa una URL válida.');

  const enlaceActual = enlacesConPatron[indiceActual];
  if (!enlaceActual) return;

  // 🔠 Normalizar caracteres
  nuevaUrl = nuevaUrl.normalize("NFD").replace(/[\u0300-\u036f]/g, '');

  // Agrega https:// si no tiene
  if (!/^https?:\/\//i.test(nuevaUrl)) {
    nuevaUrl = 'https://' + nuevaUrl;
  }

  try {
    const tempUrl = new URL(nuevaUrl);

    // Agrega www. si falta
    if (!tempUrl.hostname.startsWith('www.') && tempUrl.hostname.includes('sodimac.cl')) {
      tempUrl.hostname = 'www.' + tempUrl.hostname;
    }

    // Eliminar parámetros innecesarios
    const parametrosAEliminar = ['domain', 'exp', 'sc', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign'];
    parametrosAEliminar.forEach(param => tempUrl.searchParams.delete(param));

    // Reemplazar comas en el pathname
    tempUrl.pathname = tempUrl.pathname.split('/').map(seg => seg.replace(/,/g, '-')).join('/');

    // Construir URL final limpia
    let urlFinal = `${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`;
    document.getElementById(idInput).value = urlFinal;


// 🔍 Validaciones especiales para AMPscript
const esBusqueda = urlFinal.includes('/sodimac-cl/buscar?Ntt=');
const tieneFacet = urlFinal.includes('facetSelected=true') && urlFinal.includes('sellerId=SODIMAC');
const tieneCategoriaL2 = urlFinal.includes('f.product.L2_category_paths=');
const tieneIsPLP = urlFinal.includes('isPLP=true&Ntt=');
const esDecolovers = tempUrl.hostname.includes('sodimac.decolovers.cl');
const usaAmp = urlFinal.startsWith('https://www.sodimac.cl/sodimac-cl');

// 🛠️ Reemplazar el primer "?" por "&" si hay parámetros especiales
const contieneParametrosEspeciales = tieneFacet || tieneCategoriaL2 || tieneIsPLP;
if (contieneParametrosEspeciales) {
  const primerInterrogacion = urlFinal.indexOf('?');
  if (primerInterrogacion !== -1) {
    urlFinal = urlFinal.slice(0, primerInterrogacion) + '&' + urlFinal.slice(primerInterrogacion + 1);
  }
}

let nuevoHref = '';

if (esDecolovers) {
  // ❌ No usar AMPscript
  nuevoHref = urlFinal;
} else if (usaAmp) {
  // ✅ Aplicar AMPscript
  const separadorAmp = (esBusqueda || contieneParametrosEspeciales) ? '&' : '?';
  nuevoHref = `%%=RedirectTo(concat('${urlFinal}${separadorAmp}',@prefix))=%%`;
} else {
  // ❌ Para dominios distintos no usar AMPscript
  nuevoHref = urlFinal;
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

    // 🖼️ Guardar imagen si hay input lleno
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

  // Avanzar al siguiente
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
  const inputHref = document.getElementById('hrefInput')?.value.trim();
  const inputImg = document.getElementById('imgSrcInput')?.value.trim();
  const enlaceActual = enlacesConPatron[indiceActual];
  if (!enlaceActual) return;

  const hrefActual = extraerUrl(enlaceActual.getAttribute('href'));
  const img = enlaceActual.querySelector('img') || enlaceActual.closest('td')?.querySelector('img');
  const srcActual = img?.getAttribute('src') || '';

  let huboCambio = false;

  // ✅ Verificar y aplicar cambio en HREF
  if (inputHref && inputHref !== hrefActual) {
    aplicarCambioHref('hrefInput', false); // NO avanzar automáticamente
    huboCambio = true;
  }

  // ✅ Verificar y aplicar cambio en SRC imagen
  if (inputImg && inputImg !== srcActual) {
    let nuevaSrc = inputImg;
    const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
    const dominioHTTPS = 'https://www.sodimac.cl';

    if (nuevaSrc.startsWith(baseFTP)) {
      const nuevaConvertida = nuevaSrc.replace(baseFTP, dominioHTTPS).replace(/\\/g, '/');
      if (nuevaSrc !== nuevaConvertida) {
        nuevaSrc = nuevaConvertida;
        document.getElementById('imgSrcInput').value = nuevaSrc;
      }
    }

    if (img && srcActual !== nuevaSrc) {
      img.setAttribute('src', nuevaSrc);

      const preview = document.getElementById('previewImagenInline');
      if (preview) {
        preview.src = nuevaSrc;
        preview.style.display = 'block';
      }

      actualizarVistaPrevia?.();
      mostrarToast('💾 Imagen guardada correctamente', 'info');
      huboCambio = true;
    }
  }

  // ✅ Solo avanzar si no hubo cambios
  if (!huboCambio && indiceActual < enlacesConPatron.length - 1) {
    indiceActual++;
    mostrarHrefActual();
  }
});

document.getElementById('anteriorBtn').addEventListener('click', () => {
  const inputHref = document.getElementById('hrefInput')?.value.trim();
  const inputImg = document.getElementById('imgSrcInput')?.value.trim();
  const enlaceActual = enlacesConPatron[indiceActual];
  if (!enlaceActual) return;

  const hrefActual = extraerUrl(enlaceActual.getAttribute('href'));
  const img = enlaceActual.querySelector('img') || enlaceActual.closest('td')?.querySelector('img');
  const srcActual = img?.getAttribute('src') || '';

  let huboCambio = false;

  // ✅ Verificar y aplicar cambio en HREF
  if (inputHref && inputHref !== hrefActual) {
    aplicarCambioHref('hrefInput', false); // NO avanzar automáticamente
    huboCambio = true;
  }

  // ✅ Verificar y aplicar cambio en SRC imagen
  if (inputImg && inputImg !== srcActual) {
    let nuevaSrc = inputImg;
    const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
    const dominioHTTPS = 'https://www.sodimac.cl';

    if (nuevaSrc.startsWith(baseFTP)) {
      const nuevaConvertida = nuevaSrc.replace(baseFTP, dominioHTTPS).replace(/\\/g, '/');
      if (nuevaSrc !== nuevaConvertida) {
        nuevaSrc = nuevaConvertida;
        document.getElementById('imgSrcInput').value = nuevaSrc;
      }
    }

    if (img && srcActual !== nuevaSrc) {
      img.setAttribute('src', nuevaSrc);

      const preview = document.getElementById('previewImagenInline');
      if (preview) {
        preview.src = nuevaSrc;
        preview.style.display = 'block';
      }

      actualizarVistaPrevia?.();
      mostrarToast('💾 Imagen guardada correctamente', 'info');
      huboCambio = true;
    }
  }

  // ✅ Solo retroceder si no hubo cambios
  if (!huboCambio && indiceActual > 0) {
    indiceActual--;
    mostrarHrefActual();
  }
});




// START COPIAR HTML BTN
document.getElementById('copiarHtmlBtn').addEventListener('click', () => {
  const inputImg = document.getElementById('imgSrcInput');
  const nuevaSrc = inputImg?.value.trim();
  const hrefInput = document.getElementById('hrefInput')?.value.trim();

  const enlaceActual = enlacesConPatron[indiceActual];
  if (enlaceActual) {
    // ✅ Validación y guardado de imagen si no coincide con el DOM
    const img = enlaceActual.querySelector('img') || enlaceActual.closest('td')?.querySelector('img');
    const srcActual = img?.getAttribute('src') || '';

    if (nuevaSrc && nuevaSrc !== srcActual) {
      const baseFTP = 'ftp://soclAdmin@10.1.3.63/produccion';
      const dominioHTTPS = 'https://www.sodimac.cl';
      const srcFinal = nuevaSrc.startsWith(baseFTP)
        ? nuevaSrc.replace(baseFTP, dominioHTTPS).replace(/\\/g, '/')
        : nuevaSrc;

      if (img) {
        img.setAttribute('src', srcFinal);
        inputImg.value = srcFinal;
        const preview = document.getElementById('previewImagenInline');
        if (preview) {
          preview.src = srcFinal;
          preview.style.display = 'block';
        }
      }
    }

    // ✅ Validación y guardado de href
    if (hrefInput) {
      try {
        let tempUrl = new URL(hrefInput);
        if (!tempUrl.hostname.startsWith('www.') && tempUrl.hostname.includes('sodimac.cl')) {
          tempUrl.hostname = 'www.' + tempUrl.hostname;
        }

        // Eliminar parámetros innecesarios
        const parametrosAEliminar = ['domain', 'exp', 'sc', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign'];
        parametrosAEliminar.forEach(param => tempUrl.searchParams.delete(param));

        tempUrl.pathname = tempUrl.pathname.split('/').map(seg => seg.replace(/,/g, '-')).join('/');
        let urlFinal = `${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`;

        // Detectar AMPscript válido
      // 🔍 Validaciones especiales para AMPscript
const esBusqueda = urlFinal.includes('/sodimac-cl/buscar?Ntt=');
const tieneFacet = urlFinal.includes('facetSelected=true') && urlFinal.includes('sellerId=SODIMAC');
const tieneCategoriaL2 = urlFinal.includes('f.product.L2_category_paths=');
const tieneIsPLP = urlFinal.includes('isPLP=true&Ntt=');
const esDecolovers = tempUrl.hostname.includes('sodimac.decolovers.cl');
const usaAmp = urlFinal.startsWith('https://www.sodimac.cl/sodimac-cl');

// 🛠️ Reemplazar el primer "?" por "&" si hay parámetros especiales
const contieneParametrosEspeciales = tieneFacet || tieneCategoriaL2 || tieneIsPLP;
if (contieneParametrosEspeciales) {
  const primerInterrogacion = urlFinal.indexOf('?');
  if (primerInterrogacion !== -1) {
    urlFinal = urlFinal.slice(0, primerInterrogacion) + '&' + urlFinal.slice(primerInterrogacion + 1);
  }
}

let nuevoHref = '';

if (esDecolovers) {
  // ❌ No usar AMPscript
  nuevoHref = urlFinal;
} else if (usaAmp) {
  // ✅ Aplicar AMPscript
  const separadorAmp = (esBusqueda || contieneParametrosEspeciales) ? '&' : '?';
  nuevoHref = `%%=RedirectTo(concat('${urlFinal}${separadorAmp}',@prefix))=%%`;
} else {
  // ❌ Para dominios distintos no usar AMPscript
  nuevoHref = urlFinal;
}




        enlaceActual.setAttribute('href', nuevoHref);
      } catch (e) {
        console.warn('❌ No se pudo validar el href al copiar:', e);
      }
    }
  }

  // ✅ Limpiar estilo, clases vacías, tbody y etiquetas no deseadas
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  const styleTag = template.content.querySelector('style[data-resaltado]');
  if (styleTag) styleTag.remove();

  eliminarEtiquetasTbody();
  limpiarClasesVacias();

  let finalHTML = template.innerHTML;



  // ✅ Restaurar AMPscript y reemplazos
  finalHTML = restaurarAmpScript(finalHTML).replace(/&amp;/g, '&');

  // ✅ Copiar y limpiar
  navigator.clipboard.writeText(finalHTML).then(() => {
    mostrarToast('✅ HTML limpio copiado al portapapeles', 'success');

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

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => location.reload(), 1500);
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
  function generarSkuPorFila() {
    const inputRaw = document.getElementById('skuInput').value.trim();
    const bloques = inputRaw.split(/Fila\s*\d+\s*:/gi).map(b => b.trim()).filter(Boolean);
    const filas = [];
  
    for (let i = 0; i < 3; i++) {
      const bloque = bloques[i] || '';
      const lineas = bloque.split(/\n/).map(l => l.trim());
      const skus = lineas.filter(s => /^\d{9}$/.test(s)).slice(0, 4);
      while (skus.length < 4) skus.push('0');
      filas.push(skus);
    }
  
    const nuevaEntrada = filas.map((fila, i) => `Fila ${i + 1} :\n${fila.join('\n')}`).join('\n\n');
    document.getElementById('skuInput').value = nuevaEntrada;
  
    const plantilla = [
      "IF SKU_01 < 0 THEN SET @SKU_011='0' ELSE SET @SKU_011='SKU USUARIO' ENDIF",
      "IF SKU_02 < 0 THEN SET @SKU_022='0' ELSE SET @SKU_022='SKU USUARIO' ENDIF",
      "IF SKU_03 < 0 THEN SET @SKU_033='0' ELSE SET @SKU_033='SKU USUARIO' ENDIF",
      "IF SKU_04 < 0 THEN SET @SKU_044='0' ELSE SET @SKU_044='SKU USUARIO' ENDIF",
      "",
      "IF SKU_05 < 0 THEN SET @SKU_055='0' ELSE SET @SKU_055='SKU USUARIO' ENDIF",
      "IF SKU_06 < 0 THEN SET @SKU_066='0' ELSE SET @SKU_066='SKU USUARIO' ENDIF",
      "IF SKU_07 < 0 THEN SET @SKU_077='0' ELSE SET @SKU_077='SKU USUARIO' ENDIF",
      "IF SKU_08 < 0 THEN SET @SKU_088='0' ELSE SET @SKU_088='SKU USUARIO' ENDIF",
      "",
      "IF SKU_09 < 0 THEN SET @SKU_099='0' ELSE SET @SKU_099='SKU USUARIO' ENDIF",
      "IF SKU_10 < 0 THEN SET @SKU_0110='0' ELSE SET @SKU_0110='SKU USUARIO' ENDIF",
      "IF SKU_11 < 0 THEN SET @SKU_0111='0' ELSE SET @SKU_0111='SKU USUARIO' ENDIF",
      "IF SKU_12 < 0 THEN SET @SKU_0112='0' ELSE SET @SKU_0112='SKU USUARIO' ENDIF"
    ];
  
    const skus = filas.flat();
    let idx = 0;
    let output = '';
  
    for (let i = 0; i < plantilla.length; i++) {
      if (i % 5 === 0) {
        output += `/*** Fila ${Math.floor(i / 5) + 1} ***/\n`;
      }
      const linea = plantilla[i];
      if (linea.includes('SKU USUARIO')) {
        const valor = skus[idx++] || '0';
        output += `${linea.replace("'SKU USUARIO'", `'${valor}'`)}\n`;
      } else {
        output += `${linea}\n`;
      }
    }
  
    document.getElementById('resultadoSKU').value = output.trim();
    copiarAmpBtn.classList.remove('d-none');
  }
  
  

  function generarSkuAgrupado() {
    const inputRaw = document.getElementById('skuInput').value.trim();
    const lineas = inputRaw.split(/\n/).map(l => l.trim());
    const skusValidos = lineas.filter(s => /^\d{9}$/.test(s)).slice(0, 12); // Solo 9 dígitos válidos, máx 12
  
    const filas = [];
    for (let i = 0; i < 3; i++) {
      const fila = skusValidos.slice(i * 4, i * 4 + 4);
      while (fila.length < 4) fila.push('0');
      filas.push(fila);
    }
  
    const nuevaEntrada = filas.map((fila, i) => `Fila ${i + 1} :\n${fila.join('\n')}`).join('\n\n');
    document.getElementById('skuInput').value = nuevaEntrada;
  
    const plantilla = [
      "IF SKU_01 < 0 THEN SET @SKU_011='0' ELSE SET @SKU_011='SKU USUARIO' ENDIF",
      "IF SKU_02 < 0 THEN SET @SKU_022='0' ELSE SET @SKU_022='SKU USUARIO' ENDIF",
      "IF SKU_03 < 0 THEN SET @SKU_033='0' ELSE SET @SKU_033='SKU USUARIO' ENDIF",
      "IF SKU_04 < 0 THEN SET @SKU_044='0' ELSE SET @SKU_044='SKU USUARIO' ENDIF",
      "",
      "IF SKU_05 < 0 THEN SET @SKU_055='0' ELSE SET @SKU_055='SKU USUARIO' ENDIF",
      "IF SKU_06 < 0 THEN SET @SKU_066='0' ELSE SET @SKU_066='SKU USUARIO' ENDIF",
      "IF SKU_07 < 0 THEN SET @SKU_077='0' ELSE SET @SKU_077='SKU USUARIO' ENDIF",
      "IF SKU_08 < 0 THEN SET @SKU_088='0' ELSE SET @SKU_088='SKU USUARIO' ENDIF",
      "",
      "IF SKU_09 < 0 THEN SET @SKU_099='0' ELSE SET @SKU_099='SKU USUARIO' ENDIF",
      "IF SKU_10 < 0 THEN SET @SKU_0110='0' ELSE SET @SKU_0110='SKU USUARIO' ENDIF",
      "IF SKU_11 < 0 THEN SET @SKU_0111='0' ELSE SET @SKU_0111='SKU USUARIO' ENDIF",
      "IF SKU_12 < 0 THEN SET @SKU_0112='0' ELSE SET @SKU_0112='SKU USUARIO' ENDIF"
    ];
  
    const skus = filas.flat();
    let idx = 0;
    let output = '';
  
    for (let i = 0; i < plantilla.length; i++) {
      if (i % 5 === 0) {
        output += `/*** Fila ${Math.floor(i / 5) + 1} ***/\n`;
      }
      const linea = plantilla[i];
      if (linea.includes('SKU USUARIO')) {
        const valor = skus[idx++] || '0';
        output += `${linea.replace("'SKU USUARIO'", `'${valor}'`)}\n`;
      } else {
        output += `${linea}\n`;
      }
    }
  
    document.getElementById('resultadoSKU').value = output.trim();
    copiarAmpBtn.classList.remove('d-none');
  }
  
  
  document.getElementById('generarSkuBtn').addEventListener('click', () => {
    const modo = document.querySelector('input[name="modoSKU"]:checked')?.value;
    if (modo === 'porFila') {
      generarSkuPorFila();
    } else {
      generarSkuAgrupado();
    }
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

  const enlaceActual = enlacesConPatron[indiceActual];
  const tdActual = enlaceActual?.closest('td');
  const imgActual = tdActual?.querySelector('img');

  imgs.forEach(img => {
    const src = img.getAttribute('src');
    if (!src || !src.includes('/static/envioweb/')) return;

    const matchBase = src.match(/\/\d{2}-[a-z]+\/images\/\d{2}-[a-z]+-/i);
    const matchNumero = src.match(/(\d+\.(png|jpg|jpeg|gif))$/i);

    if (!matchBase || !matchNumero) return;

    const numeroFinal = matchNumero[1];
    const nuevaRuta = `${dominioHTTPS}/static/envioweb/${nuevaRelativa}${numeroFinal}`;
    img.setAttribute('src', nuevaRuta);

    contador++;

    // Si esta imagen es la del enlace actual, actualiza vista previa también
    if (img === imgActual) {
      const preview = document.getElementById('previewImagenInline');
      const input = document.getElementById('imgSrcInput');
      if (preview) {
        preview.src = nuevaRuta;
        preview.style.display = 'block';
      }
      if (input) {
        input.value = nuevaRuta;
      }
    }
  });

  actualizarVistaPrevia();
  mostrarToast(`✅ ${contador} imagen(es) actualizada(s) con nueva carpeta`, 'success');
}
// FIN FUNCION reamplAzado imagenes masivas




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





