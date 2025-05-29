// script.js

document.addEventListener('DOMContentLoaded', function () {
  const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltips.forEach(el => new bootstrap.Tooltip(el))
})


// Luego DOMContentLoaded para inicializar todo
document.addEventListener('DOMContentLoaded', () => {
  asignarFechaHoyInputDate(); // ✅ Asignar fecha hoy
  actualizarRangoEnTemplate(); // ✅ Reemplazar {{FECHA_RANGO}} al cargar

  const inputFecha = document.getElementById('fechaInicio');
  if (!inputFecha) return; // ⚡ Si no hay input, no seguimos

  inputFecha.addEventListener('change', () => {
    const templateActual = template?.innerHTML;
    if (!templateActual) return;

    if (templateActual.includes('{{FECHA_RANGO}}')) {
      let rango = obtenerRangoDesdeFechaInput();

      if (!rango) {
        asignarFechaHoyInputDate(); 
        rango = obtenerRangoDesdeFechaInput();
      }

      if (rango) {
        const nuevoHTML = templateActual.replace(/{{FECHA_RANGO}}/g, rango);
        template.innerHTML = nuevoHTML; // ✅ Refrescamos el contenido

        // ✅ Usar tu función mostrarToast al cambiar rango
        mostrarToast(`✅ Nuevo rango aplicado: ${rango}`, 'success');
        console.log('✅ Toast mostrado con rango:', rango); // ✅ Log en consola para confirmar
      }
    }
  });
});





 // START CREADOR DE BANNERS MULTPLES



 let bannersJSON = [];
 let cantidadMaxima = 1;
 let bannersSeleccionados = [];
 
 /*async function cargarBannersJson() {
   try {
     const response = await fetch('assets/banners.json');
     if (!response.ok) throw new Error('No se pudo cargar banners.json');
     return await response.json();
   } catch (err) {
     console.error('❌ Error cargando JSON:', err);
     alert("⚠️ No se pudo cargar el archivo banners.json. Revisa la consola.");
     return [];
   }
 }
 
 window.addEventListener("DOMContentLoaded", async () => {
   bannersJSON = await cargarBannersJson();
   console.log("✅ bannersJSON cargado:", bannersJSON);
 });*/
 
 async function cargarBannersJson() {
   const urls = ['assets/banners.json', 'assets/banners-cyber.json']; // <- ambas fuentes
   let resultado = [];
 
   for (const url of urls) {
     try {
       const response = await fetch(url);
       if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
       const data = await response.json();
       resultado = resultado.concat(data);
       console.log(`✅ Cargado: ${url}`, data);
     } catch (err) {
       console.error(`❌ Error cargando ${url}:`, err);
     }
   }
 
   return resultado;
 }
 
 window.addEventListener("DOMContentLoaded", async () => {
   bannersJSON = await cargarBannersJson();
   console.log("📦 bannersJSON combinado:", bannersJSON);
 });
 
 
 
 function actualizarCantidad(select) {
   cantidadMaxima = parseInt(select.value);
   bannersSeleccionados = [];
   document.getElementById("previewHTML").innerHTML = "";
   document.getElementById("codigoGenerado").value = "";
 }
 
 function sugerenciasBannerSimple(valor) {
   const box = document.getElementById("sugerencias-banner");
   const input = document.getElementById("buscarBanner");
 
   // Si el input está vacío, cerramos sugerencias
   if (!valor.trim()) {
     box.innerHTML = '';
     box.classList.add("d-none");
     return;
   }
 
   // Filtrar banners que coincidan
   const filtrados = bannersJSON.filter(b =>
     b.nombre.toLowerCase().includes(valor.toLowerCase())
   );
 
   // Si no hay sugerencias, cerramos
   if (filtrados.length === 0) {
     box.innerHTML = '';
     box.classList.add("d-none");
     return;
   }
 
   // Mostrar sugerencias
   box.innerHTML = '';
   box.classList.remove("d-none");
 
   filtrados.forEach((b, i) => {
     const item = document.createElement("div");
     item.className = "suggestion-item";
     item.textContent = b.nombre;
 
     item.onclick = () => {
       // Limpiar input + setear nombre (sin delay)
       input.value = b.nombre;
 
       // Cierra las sugerencias
       box.innerHTML = '';
       box.classList.add("d-none");
 
       // Agrega banner
       generarBannerDesdeJson(b);
 
       // Estilo visual
       input.classList.add("border-success");
       setTimeout(() => input.classList.remove("border-success"), 1000);
 
       // Toast
       if (typeof mostrarToast === "function") {
         mostrarToast(`✅ Banner "${b.nombre}" agregado`, "success");
       }
     };
 
     box.appendChild(item);
   });
 }
 
 
 function generarBannerDesdeJson(banner) {
   bannersSeleccionados.push({ ...banner });
   const contenedor = document.getElementById("previewHTML");
   if (!contenedor.querySelector("table")) {
     contenedor.innerHTML = '<table width="600" cellspacing="0" cellpadding="0" align="center"></table>';
   }
   const index = bannersSeleccionados.length - 1;
 // 🧠 Vista previa con botón "Editar"
 const filaPreview = `
 <tr>
   <td colspan="2" align="center">
     <a href="${banner.href}" target="_blank">
       <img src="${banner.img_src}" alt="${banner.alt}" style="display:block;" border="0">
     </a>
  <div class="mt-2 d-flex justify-content-end">
   <button class="btn btn-dark btn-sm mb-2 d-flex align-items-center gap-2 shadow-none border-0 px-2 py-1"
           onclick="abrirModalEditar(${index})"
           style="font-size: 0.85rem;">
     <i class="bx bx-edit-alt bx-xs"></i> Editar
   </button>
 </div>
   </td>
 </tr>`;
 contenedor.querySelector("table").insertAdjacentHTML("beforeend", filaPreview);
 
   generarHTMLTabla();
 }
 
 function abrirModalEditar(index) {
   const banner = bannersSeleccionados[index];
   document.getElementById("bannerIndex").value = index;
   document.getElementById("editHref").value = banner.href;
   document.getElementById("editImg").value = banner.img_src;
   document.getElementById("editAlt").value = banner.alt;
   const modal = new bootstrap.Modal(document.getElementById("modalEditarBanner"));
   modal.show();
 }
 
 function guardarCambiosBanner() {
   const index = parseInt(document.getElementById("bannerIndex").value);
   const nuevoHref = document.getElementById("editHref").value;
   const nuevaImg = document.getElementById("editImg").value;
   const nuevoAlt = document.getElementById("editAlt").value;
 
   // Actualizar el objeto en la lista
   bannersSeleccionados[index].href = nuevoHref;
   bannersSeleccionados[index].img_src = nuevaImg;
   bannersSeleccionados[index].alt = nuevoAlt;
 
   // Mostrar toast con detalles del banner actualizado
   const mensaje = `
     ✅ Banner actualizado:
     <br><small>
       <strong>Nueva Url:</strong> ${nuevoHref}<br>
       <strong>Nueva Imagen:</strong> ${nuevaImg}<br>
       <strong>Nuevo alt:</strong> ${nuevoAlt}
     </small>
   `.trim();
 
   mostrarToast(mensaje, "success");
 
   // Actualizar tabla y cerrar modal
   generarHTMLTabla();
   bootstrap.Modal.getInstance(document.getElementById("modalEditarBanner")).hide();
 }
 
 
 
 function generarHTMLTabla() {
 // ✅ Generar tabla limpia sin botones
 const tablaHTML = bannersSeleccionados.map(b => `
   <tr>
     <td colspan="2" align="center">
       <a href="${b.href}" target="_blank">
         <img src="${b.img_src}" alt="${b.alt}" style="display:block;" border="0">
       </a>
     </td>
   </tr>`).join("");
   
   const tablaFinal = `
   <table width="600" cellspacing="0" cellpadding="0" align="center">
   ${tablaHTML}
   </table>`.trim();
   
   document.getElementById("codigoGenerado").value = tablaFinal;
   
 
   document.getElementById("previewHTML").innerHTML = tablaCompleta;
 
 }
 
 function copiarCodigo() {
   const area = document.getElementById("codigoGenerado");
   area.select();
   document.execCommand("copy");
   mostrarToast("📋 HTML copiado correctamente", "success");
 }
 
 function actualizarContador() {
   const contador = document.getElementById("contadorBanners");
   if (contador) {
     contador.textContent = `${bannersSeleccionados.length} de ${cantidadMaxima} banners agregados`;
   }
 }
 
 
 
 function limpiarCamposBanner() {
   bannersSeleccionados = [];
   document.getElementById("buscarBanner").value = "";
   document.getElementById("previewHTML").innerHTML = "";
   document.getElementById("codigoGenerado").value = "";
 
   const contador = document.getElementById("contadorBanners");
   if (contador) contador.textContent = `0 de ${cantidadMaxima} banners agregados`;
 
   const barra = document.getElementById("barraProgreso");
   if (barra) {
     barra.style.width = `0%`;
     barra.setAttribute("aria-valuenow", "0");
   }
 
   mostrarToast("🧹 Campos limpiados", "success");
 }
 
 
 function activarBotonLimpiar() {
   const input = document.getElementById("buscarBanner");
   const btn = document.getElementById("btnClearInput");
 
   if (input.value.length > 0) {
     btn.classList.remove("d-none");
   }
 
   input.addEventListener("input", () => {
     if (input.value.length > 0) {
       btn.classList.remove("d-none");
     } else {
       btn.classList.add("d-none");
     }
   });
 }
 
 function limpiarInputBuscar() {
   const input = document.getElementById("buscarBanner");
   const btn = document.getElementById("btnClearInput");
 
   input.value = "";
   btn.classList.add("d-none");
 
   // Cerrar sugerencias también
   const box = document.getElementById("sugerencias-banner");
   if (box) box.classList.add("d-none");
 }
 

 

   // FIN CREADOR DE BANNERS MULTPLES



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
  const clearHrefBtn = document.getElementById('clearHrefBtn'); // aún lo tomamos si lo estás usando
  const enlaceActual = enlacesConPatron[indiceActual];
  const descripcion = descripcionesEnlaces[indiceActual] || 'Sin descripción';


  

  // 🔗 Obtener href limpio y mostrar como placeholder
  const hrefRaw = enlaceActual.getAttribute('href') || '';
  const hrefExtraido = extraerUrl(hrefRaw);
  inputHref.value = ''; // dejar el campo vacío
  inputHref.placeholder = hrefExtraido;
  ultimaHrefEditado = hrefExtraido;

  // 🔁 Ocultar botón ❌ porque el campo queda vacío
  if (clearHrefBtn) clearHrefBtn.style.display = 'none';

  // 🏷️ Mostrar descripción/posición actual
  document.getElementById('estadoEnlace').textContent =
    `🔗 Url ${indiceActual + 1} de ${enlacesConPatron.length} (${descripcion})`;

  // 🔲 Resaltado visual del enlace
  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  enlaceActual.classList.add('resaltado');

  // 🖼️ Obtener imagen asociada y actualizar input + preview
  const tdContenedor = enlaceActual.closest('td');
  const img = tdContenedor?.querySelector('img');
  const src = img?.getAttribute('src') || '';

  

  inputImg.value = src;
  ultimaImagenEditada = src;

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


function obtenerEnlacesFiltrados() {
  const celdas = template.content.querySelectorAll('td[colspan="2"][align="center"]');
  const setUnico = new Set();
  const enlacesValidos = [];

  celdas.forEach(td => {
    const a = td.querySelector('a[href*="%%=RedirectTo"]');
    const img = td.querySelector('img');
    const src = img?.getAttribute('src') || '';

    // ✅ Detecta cualquier ruta que empiece con /2025 o contenga /cyberday
    const esRuta2025 = src.includes('/static/envioweb/2025/');
    const esRutaCyber = src.includes('/static/envioweb/2025/cyberday');

    if (a && img && (esRuta2025 || esRutaCyber)) {
      const href = a.getAttribute('href') || '';
      const hash = `${href}|${src}`;
      if (!setUnico.has(hash)) {
        setUnico.add(hash);
        enlacesValidos.push(a);
      }
    }
  });

  return enlacesValidos;
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


// 🔍 Validaciones especiales para AMPscript BOTON APLICAR CAMBIOS
const esBusqueda = urlFinal.includes('/sodimac-cl/buscar?Ntt=');
const tieneFacet = urlFinal.includes('facetSelected=true') && urlFinal.includes('sellerId=SODIMAC');
const tieneCategoriaL2 = urlFinal.includes('f.product.L2_category_paths=');
const tieneCategoriaL3 = urlFinal.includes('f.product.brandName=');
const tieneIsPLP = urlFinal.includes('isPLP=true&Ntt=');
const esDecolovers = tempUrl.hostname.includes('sodimac.decolovers.cl');
const usaAmp = urlFinal.startsWith('https://www.sodimac.cl/sodimac-cl');

// 🛠️ Reemplazar el primer "?" por "&" si hay parámetros especiales
const contieneParametrosEspeciales =  esBusqueda || tieneFacet || tieneCategoriaL2 || tieneCategoriaL3 || tieneIsPLP;


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

 // START BANNER DETECTADOS

 /*async function cargarBannersJson() {
  const response = await fetch('assets/banners.json');
  return await response.json();
}*/


function detectarBanners() {
  const html = document.getElementById("htmlInput").value;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const banners = [...doc.querySelectorAll("tr[id]")];
  const contenedor = document.getElementById("contenedorBannersDetectados");
  contenedor.innerHTML = '';

  banners.forEach((banner, index) => {
    const id = banner.getAttribute("id");
    const img = banner.querySelector("img");
    const a = banner.querySelector("a");
    const imgSrc = img?.getAttribute("src") || '';
    const href = a?.getAttribute("href") || '';

    contenedor.innerHTML += `
      <div class="banner-card position-relative">
        <strong>ID:</strong> ${id}
        <img id="preview-${index}" src="${imgSrc}" class="img-fluid my-3 rounded" style="max-height:150px;">
        <div class="mb-2">
          <label>Href:</label>
          <input type="text" id="href-${index}" class="form-control" value="${href}">
        </div>
        <div class="mb-2">
          <label>Imagen Src:</label>
          <input type="text" id="src-${index}" class="form-control" value="${imgSrc}">
        </div>
        <input type="text" class="form-control mt-2 mb-2" id="jsonInput-${index}" placeholder="Buscar por nombre..." oninput="sugerenciasBanner(this.value, ${index}, '${id}')">
        <div id="sugerencias-${index}" class="suggestion-box d-none"></div>
        <button class="btn btn-warning mt-2" onclick="reemplazarTdDesdeJson('${id}', 'jsonInput-${index}', ${index})">🔁 Reemplazar desde JSON</button>
        <button class="btn btn-success me-2" onclick="editarBannerDesdeInputs('${id}', ${index})">✏️ Editar desde Inputs</button>

      </div>`;
  });

  new bootstrap.Modal(document.getElementById("modalBannersDetectados")).show();
}

function sugerenciasBanner(valor, index, id) {
  const box = document.getElementById(`sugerencias-${index}`);
  if (!valor) return box.classList.add("d-none");

  cargarBannersJson().then(banners => {
    const filtrados = banners.filter(b => b.nombre.toLowerCase().includes(valor.toLowerCase()));
    if (!filtrados.length) return box.classList.add("d-none");

    box.innerHTML = '';
    box.classList.remove("d-none");

    filtrados.forEach(b => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = b.nombre;
      item.onclick = () => {
        document.getElementById(`jsonInput-${index}`).value = b.nombre;
        aplicarBannerDesdeJson(b, index, id);
        reemplazarTdDesdeJson(id, `jsonInput-${index}`, index);
      };
            box.appendChild(item);
    });
  });
}

function aplicarBannerDesdeJson(banner, index, id) {
  document.getElementById(`src-${index}`).value = banner.img_src;
  document.getElementById(`href-${index}`).value = banner.href;
  document.getElementById(`preview-${index}`).src = banner.img_src;
  document.getElementById(`sugerencias-${index}`).classList.add("d-none");
}

async function reemplazarTdDesdeJson(id, inputId, index) {
  const nombre = document.getElementById(inputId).value.trim();
  if (!nombre) return alert("⚠️ Escribe el nombre del banner.");

  const banners = await cargarBannersJson();
  const banner = banners.find(b => b.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
  if (!banner) return alert("❌ No encontrado en JSON");

  const html = document.getElementById("htmlInput").value;

  const tdHtml = `<td colspan="2" align="center">
  <a href="${banner.href}" target="_blank">
    <img src="${banner.img_src}" alt="${banner.alt || ''}" style="display:block;" border="0">
  </a>
</td>`;

  const trRegex = new RegExp(`<tr[^>]*id=["']?${id}["'][^>]*>[\\s\\S]*?<\\/tr>`, 'i');
  const nuevoBloque = `<tr>\n  ${tdHtml}\n</tr>`;
  const actualizado = html.replace(trRegex, nuevoBloque);
  document.getElementById("htmlInput").value = actualizado;

  // 🔁 Actualizar también la vista previa en modal
  document.getElementById(`src-${index}`).value = banner.img_src;
  document.getElementById(`href-${index}`).value = banner.href;
  document.getElementById(`preview-${index}`).src = banner.img_src;

  mostrarToast('✅ Banner reemplazado y actualizado en la vista.', 'dark');
}

function editarBannerDesdeInputs(id, index) {
  let html = document.getElementById("htmlInput").value;
  const href = document.getElementById(`href-${index}`)?.value.trim();
  const src = document.getElementById(`src-${index}`)?.value.trim();

  const nuevoTr = `<tr>
  <td colspan="2" align="center">
    <a href="${href}" target="_blank">
      <img src="${src}" style="display:block;" border="0">
    </a>
  </td>
</tr>`;

  // Reemplazar todo el <tr id="..."> por un nuevo <tr> limpio
  const trRegex = new RegExp(`<tr[^>]*id=["']?${id}["'][^>]*>[\\s\\S]*?<\\/tr>`, 'i');
  html = html.replace(trRegex, nuevoTr);

  // 🔄 Actualizar el HTML en el textarea
  document.getElementById("htmlInput").value = html;

  // 🔄 Actualizar vista previa (DOM real)
  template.innerHTML = html;

  template.innerHTML = document.getElementById('htmlInput').value;

  // 🔄 Actualizar mini preview imagen
  document.getElementById(`preview-${index}`).src = src;

  mostrarToast("✅ Banner actualizado y <tr> sin ID.", "success");



}

function guardarCambiosBannerDesdeInputs(index) {
  const hrefInput = document.getElementById(`href-${index}`)?.value.trim();
  const srcInput = document.getElementById(`src-${index}`)?.value.trim();

  const enlace = enlacesConPatron?.[index];
  if (!enlace) return;

  const img = enlace.querySelector('img') || enlace.closest('td')?.querySelector('img');
  const actualHref = enlace.getAttribute('href') || '';
  const actualSrc = img?.getAttribute('src') || '';

  let html = document.getElementById('htmlInput').value;

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  }

  if (hrefInput && html.includes(actualHref)) {
    const hrefRegex = new RegExp(`(<a[^>]*href=["'])${escapeRegExp(actualHref)}(["'])`, 'i');
    html = html.replace(hrefRegex, `$1${hrefInput}$2`);
  }

  if (srcInput && html.includes(actualSrc)) {
    const srcRegex = new RegExp(`(<img[^>]*src=["'])${escapeRegExp(actualSrc)}(["'])`, 'i');
    html = html.replace(srcRegex, `$1${srcInput}$2`);
  }

  document.getElementById('htmlInput').value = html;
  template.innerHTML = html;
  
}


 // FIN BANNER DETECTADOS




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
      // 🔍 Validaciones especiales para AMPscript copiar html
      const esBusqueda = urlFinal.includes('/sodimac-cl/buscar?Ntt=');
      const tieneFacet = urlFinal.includes('facetSelected=true') && urlFinal.includes('sellerId=SODIMAC');
      const tieneCategoriaL2 = urlFinal.includes('f.product.L2_category_paths=');
      const tieneCategoriaL3 = urlFinal.includes('f.product.brandName=');
      const tieneIsPLP = urlFinal.includes('isPLP=true&Ntt=');
      const esDecolovers = tempUrl.hostname.includes('sodimac.decolovers.cl');
      const usaAmp = urlFinal.startsWith('https://www.sodimac.cl/sodimac-cl');
      
      // 🛠️ Reemplazar el primer "?" por "&" si hay parámetros especiales
      const contieneParametrosEspeciales =  esBusqueda || tieneFacet || tieneCategoriaL2 || tieneCategoriaL3 || tieneIsPLP;
      
      
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

// ✅ Función independiente para calcular el rango desde fecha input
function asignarFechaHoyInputDate() {
  const inputFecha = document.getElementById('fechaInicio');
  if (!inputFecha) return;

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');

  inputFecha.value = `${yyyy}-${mm}-${dd}`;
}


// ✅ Función Obetener rango desde fecha input
function obtenerRangoDesdeFechaInput() {
  const inputFecha = document.getElementById('fechaInicio');
  if (!inputFecha || !inputFecha.value) {
    return null; // No mostrar Toast aquí todavía
  }

  const [year, month, day] = inputFecha.value.split('-');
  const inicio = new Date(year, month - 1, day);

  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 2);

  const formatear = d =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return `desde el ${formatear(inicio)} hasta el ${formatear(fin)}`;
}






// sirve para el mostrar los input modificados
let finalHTML = template.innerHTML;


// sirve para el mostrar los banner modificados
// let finalHTML = document.getElementById('htmlInput').value;




// ✅ Detectar si hay marcador de fecha
if (finalHTML.includes('{{FECHA_RANGO}}')) {
  let rango = obtenerRangoDesdeFechaInput();

  if (!rango) {
    // ✅ Si no hay fecha seleccionada, asignar hoy automáticamente
    asignarFechaHoyInputDate(); 

    // ⚡ Recalcular el rango después de asignar hoy
    rango = obtenerRangoDesdeFechaInput();
  }

  if (rango) {
    finalHTML = finalHTML.replace(/{{FECHA_RANGO}}/g, rango);

  }
}

  // ✅ Restaurar AMPscript y reemplazos
  finalHTML = restaurarAmpScript(finalHTML).replace(/&amp;/g, '&');

  finalHTML = finalHTML.replace(/\s+id="bloquePlantillaFecha"/g, ''); 

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
const vistaCrearBanner = document.getElementById('vistaCrearBanner')
const vistaConversor = document.getElementById('vistaConversor');
const vistaAmpEditor = document.getElementById('vistaAmpEditor');

const navEditor = document.getElementById('navEditor');
const navSku = document.getElementById('navSku');
const navBanner = document.getElementById('navBanner');
const navConversor = document.getElementById('navConversor');
const navAmp = document.getElementById('navAmp');

function mostrarVista(vista) {
  vistaEditor.style.display = vista === 'editor' ? 'block' : 'none';
  vistaCrearBanner.style.display = vista === 'banner' ? 'block' : 'none';
  vistaSku.style.display = vista === 'sku' ? 'block' : 'none';
  vistaConversor.style.display = vista === 'conversor' ? 'block' : 'none';
  vistaAmpEditor.style.display = vista === 'amp' ? 'block' : 'none';

  navEditor.classList.toggle('active', vista === 'editor');
  navSku.classList.toggle('active', vista === 'sku');
  navBanner.classList.toggle('active', vista === 'banner');
  navConversor.classList.toggle('active', vista === 'conversor');
  navAmp.classList.toggle('active', vista === 'amp');
}

// Listeners
navEditor.addEventListener('click', () => mostrarVista('editor'));
navSku.addEventListener('click', () => mostrarVista('sku'));
navBanner.addEventListener('click', () => mostrarVista('banner'));
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

  progreso.textContent = '🕐 Procesando imagen con sensibilidad para líneas delgadas...';

  const img = new Image();
  img.src = URL.createObjectURL(archivo);

  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 🔍 Suavizar ligeramente la imagen para estabilidad
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

    // 🧠 Umbral inverso para resaltar líneas oscuras muy finas
    const binary = new cv.Mat();
    cv.threshold(blurred, binary, 60, 255, cv.THRESH_BINARY_INV);

    // 📏 Detección de contornos horizontales finos
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const lineasY = [];
    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      // 🎯 Ajustar tolerancia para línea extremadamente delgada
      if (rect.height <= 2 && rect.width > src.cols * 0.7) {
        lineasY.push(rect.y);
        cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), [255, 0, 0, 255], 1);
      }
    }

    if (lineasY.length < 2) {
      progreso.textContent = '❌ Línea demasiado delgada. No se detectaron suficientes separadores.';
      return;
    }

    const lineasUnicas = [...new Set(lineasY.map(y => Math.round(y / 2) * 2))].sort((a, b) => a - b);
    const resultadosOCR = [];

    for (let i = 0; i < lineasUnicas.length - 1; i++) {
      const y1 = lineasUnicas[i];
      const y2 = lineasUnicas[i + 1];
      const height = y2 - y1;

      if (height < 5) continue;

      const roi = src.roi(new cv.Rect(0, y1, src.cols, height));
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = roi.cols;
      tempCanvas.height = roi.rows;
      cv.imshow(tempCanvas, roi);

      const blob = await new Promise(res => tempCanvas.toBlob(res));
      const { data: { text } } = await Tesseract.recognize(blob, 'eng');

      const cleaned = text
        .replace(/[O]/g, '0')
        .replace(/[I|l]/g, '1')
        .replace(/[^0-9]/g, '')
        .trim();

      if (/^\d{9}$/.test(cleaned)) {
        resultadosOCR.push(cleaned);
      }

      roi.delete();
    }

    const skus = [...new Set(resultadosOCR)];
    if (skus.length >= 5) skus.splice(4, 1);
    const final = skus.slice(0, 12);

    if (final.length === 0) {
      progreso.textContent = '❌ No se detectaron SKUs válidos.';
      return;
    }

    document.getElementById('skuInput').value = final.join('\n');
    progreso.textContent = `✅ Se insertaron ${final.length} SKU(s) desde imagen.`;

    // 🧼 Limpieza de memoria
    gray.delete(); blurred.delete(); binary.delete(); contours.delete(); hierarchy.delete(); src.delete();
  };
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

  // ✅ Carpetas de campañas válidas (puedes extender esta lista)
  const carpetasValidas = [
    '/cyberday/emkt/',
    '/05-mayo/',
    '/navidad/emkt/',
    '/aniversario/emkt/',
    '/liquidades/emkt/'
  ];
  const imgs = template.content.querySelectorAll('img');
  let contador = 0;

  const enlaceActual = enlacesConPatron[indiceActual];
  const tdActual = enlaceActual?.closest('td');
  const imgActual = tdActual?.querySelector('img');

  imgs.forEach(img => {
    const src = img.getAttribute('src');

    // ✅ Validación dinámica: asegurar que incluya "/static/envioweb/2025/[carpeta]/emkt/"
    const esValida = src && src.includes('/static/envioweb/2025') &&
      carpetasValidas.some(ruta => src.includes(`/static/envioweb/2025${ruta}`));

    if (!esValida) return;

    const matchNumero = src.match(/(\d+\.(png|jpg|jpeg|gif))$/i);
    if (!matchNumero) return;

    const numeroFinal = matchNumero[1];
    const nuevaRuta = `${dominioHTTPS}/static/envioweb/${nuevaRelativa}${numeroFinal}`;
    img.setAttribute('src', nuevaRuta);
    contador++;

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


function seleccionarTemplate() {
  const select = document.getElementById('selectorTemplate');
  const archivoSeleccionado = select.value;

  if (archivoSeleccionado) {
    cargarTemplateDesdeAssets(archivoSeleccionado);
  }
}



function cargarTemplateDesdeAssets(nombreArchivo) {
  fetch(`./assets/template/${nombreArchivo}`)
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el archivo.');
      return response.text();
    })
    .then(html => {
      // ✅ Mostrar en textarea e iframe
      document.getElementById('htmlInput').value = html;
      const iframe = document.getElementById('vistaPrevia');
      if (iframe) {
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
      }

      // ✅ Procesar enlaces AMPscript automáticamente
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      enlacesConPatron = Array.from(tempDiv.querySelectorAll('a')).filter(a =>
        a.outerHTML.includes("%%=RedirectTo(concat('")
      );

      htmlOriginal = html;
      indiceActual = 0;

      if (enlacesConPatron.length > 0) {
        mostrarHrefActual();


        mostrarToast(`✅ Template cargado (${nombreArchivo})`, "success");
      } else {
        mostrarToastDinamico('⚠️ Template cargado pero sin enlaces AMPscript', 'warning');
      }
    })
    .catch(error => {
      console.error(error);
      mostrarToastDinamico("❌ Error al cargar el HTML desde assets", "danger");
    });
}


function limpiarCamposUrl() {
  // Limpiar todos los input y textarea del documento
  document.querySelectorAll('input, textarea').forEach(el => {
    el.value = '';
  });

  // Limpiar todos los elementos con contenido textual que quieras resetear
  const elementosTexto = ['ocrProgreso', 'resultadoSKU']; // Agrega más IDs si necesitas
  elementosTexto.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  // Mostrar notificación si tienes toast integrado
  if (typeof mostrarToast === 'function') {
    mostrarToast('🔄 Campos limpiados, recargando...', 'info');
  }

  // Recargar la página después de una pequeña pausa
  setTimeout(() => {
    location.reload();
  }, 800); // Da un pequeño tiempo para ver el toast antes del refresh
}





function asignarFechaHoyInputDate() {
  const inputFecha = document.getElementById('fechaInicio');
  if (!inputFecha) return;

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');

  inputFecha.value = `${yyyy}-${mm}-${dd}`;
}






