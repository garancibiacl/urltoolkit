// START COPIAR HTML BTN
document.getElementById('copiarHtmlBtn').addEventListener('click', () => {
  const inputImg = document.getElementById('imgSrcInput');
  const nuevaSrc = inputImg?.value.trim();
  const hrefInput = document.getElementById('hrefInput')?.value.trim();
  const enlaceActual = enlacesConPatron[indiceActual];

  // Sincronizar textarea con DOM real
  template.innerHTML = document.getElementById('htmlInput').value;

  if (enlaceActual) {
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

    if (hrefInput) {
      try {
        let tempUrl = new URL(hrefInput);
        if (!tempUrl.hostname.startsWith('www.') && tempUrl.hostname.includes('sodimac.cl')) {
          tempUrl.hostname = 'www.' + tempUrl.hostname;
        }

        const parametrosAEliminar = ['domain', 'exp', 'sc', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign'];
        parametrosAEliminar.forEach(param => tempUrl.searchParams.delete(param));

        tempUrl.pathname = tempUrl.pathname.split('/').map(seg => seg.replace(/,/g, '-')).join('/');
        let urlFinal = `${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`;

        const esBusqueda = urlFinal.includes('/sodimac-cl/buscar?Ntt=');
        const tieneFacet = urlFinal.includes('facetSelected=true') && urlFinal.includes('sellerId=SODIMAC');
        const tieneCategoriaL2 = urlFinal.includes('f.product.L2_category_paths=');
        const tieneCategoriaL3 = urlFinal.includes('f.product.brandName=');
        const tieneIsPLP = urlFinal.includes('isPLP=true&Ntt=');
        const esDecolovers = tempUrl.hostname.includes('sodimac.decolovers.cl');
        const usaAmp = urlFinal.startsWith('https://www.sodimac.cl/sodimac-cl');
        const contieneParametrosEspeciales = esBusqueda || tieneFacet || tieneCategoriaL2 || tieneCategoriaL3 || tieneIsPLP;
        let nuevoHref = '';

        if (esDecolovers) {
          nuevoHref = urlFinal;
        } else if (usaAmp) {
          const separadorAmp = contieneParametrosEspeciales ? '&' : '?';
          nuevoHref = `%%=RedirectTo(concat('${urlFinal}${separadorAmp}',@prefix))=%%`;
        } else {
          nuevoHref = urlFinal;
        }

        enlaceActual.setAttribute('href', nuevoHref);
      } catch (e) {
        console.warn('❌ No se pudo validar el href al copiar:', e);
      }
    }
  }

  enlacesConPatron.forEach(el => el.classList.remove('resaltado'));
  const styleTag = template.content.querySelector('style[data-resaltado]');
  if (styleTag) styleTag.remove();

  eliminarEtiquetasTbody();
  limpiarClasesVacias();

  // Fecha dinámica
  function asignarFechaHoyInputDate() {
    const inputFecha = document.getElementById('fechaInicio');
    if (!inputFecha) return;
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    inputFecha.value = `${yyyy}-${mm}-${dd}`;
  }

  function obtenerRangoDesdeFechaInput() {
    const inputFecha = document.getElementById('fechaInicio');
    if (!inputFecha || !inputFecha.value) return null;
    const [year, month, day] = inputFecha.value.split('-');
    const inicio = new Date(year, month - 1, day);
    const fin = new Date(inicio); fin.setDate(inicio.getDate() + 2);
    const formatear = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `desde el ${formatear(inicio)} hasta el ${formatear(fin)}`;
  }

  let finalHTML = template.innerHTML;

  if (finalHTML.includes('{{FECHA_RANGO}}')) {
    let rango = obtenerRangoDesdeFechaInput();
    if (!rango) {
      asignarFechaHoyInputDate();
      rango = obtenerRangoDesdeFechaInput();
    }
    if (rango) {
      finalHTML = finalHTML.replace(/{{FECHA_RANGO}}/g, rango);
    }
  }

  // ✅ Limpieza y restauración final
  finalHTML = finalHTML
    .replace(/<tr[^>]*\sid=["'][^"']*["']/gi, match => match.replace(/\sid=["'][^"']*["']/, ''))
    .replace(/<tbody>/gi, '').replace(/<\/tbody>/gi, '')
    .replace(/\sclass=["']\s*["']/gi, '');

  finalHTML = restaurarAmpScript(finalHTML)
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<');

  finalHTML = finalHTML.replace(/\s+id="bloquePlantillaFecha"/g, '');

  navigator.clipboard.writeText(finalHTML).then(() => {
    mostrarToast('✅ HTML limpio copiado al portapapeles', 'success');

    document.getElementById('htmlInput').value = '';
    document.getElementById('skuInput').value = '';
    document.getElementById('ocrProgreso').textContent = '';
    document.getElementById('resultadoSKU').value = '';
    document.getElementById('imgSrcInput').value = '';

    const iframe = document.getElementById('vistaPrevia');
    if (iframe) { iframe.removeAttribute('srcdoc'); iframe.src = 'about:blank'; }

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
