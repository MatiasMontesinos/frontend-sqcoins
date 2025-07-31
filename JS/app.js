function cargarPagina(archivo, url) {
  fetch(`Paginas/${archivo}`)
    .then(res => res.text())
    .then(html => {
      document.getElementById('contenido').innerHTML = html;
      history.pushState({ archivo }, '', url);
      // Ejecutar scripts específicos según la página
     
      if (archivo === 'pagina5-perfil.html') {
        if (typeof inicializarPerfil === 'function') {
           inicializarPerfil();
          }
        if (typeof inicializarEventosPerfil === 'function') {
          inicializarEventosPerfil();
        }
      }
      if (archivo === 'pagina2-juego1.html') {
        const script = document.createElement('script');
        script.src = 'JS/coinflip.js';
        document.body.appendChild(script);
      }      

      if (archivo === 'coinflip-juego.html') {
        const script = document.createElement('script');
        script.src = 'JS/coinflip-juego.js';
        document.body.appendChild(script);
      }

            if (archivo === 'pagina3-juego2.html') {
        const script = document.createElement('script');
        script.src = 'JS/buscaminas.js'; 
        script.onload = () => {
          if (typeof window.iniciarBuscaminas === 'function') {
            window.iniciarBuscaminas();
          }
        };
        document.body.appendChild(script);

        return; 
      }

      if (archivo === 'pagina4-sorteo.html') {
        const script = document.createElement('script');
        script.src = 'JS/sorteo.js'; 
        document.body.appendChild(script);
      }
      if (archivo === 'pagina1-principal.html') {
        // Cargar script para rankings y ejecutarlo
        const script = document.createElement('script');
        script.src = 'principal.js';  // Ruta relativa a frontend
        script.onload = () => {
          if (typeof cargarRankings === 'function') {
            cargarRankings();
          }
        };
        document.body.appendChild(script);
      }

    })
    .catch(() => {
      document.getElementById('contenido').innerHTML = '<p>Error al cargar la página.</p>';
    });
}
function cargarScript(src) {
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  document.body.appendChild(script);
}

// Escucha clics en cualquier enlace con data-pagina
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-pagina]');
  if (link) {
    e.preventDefault();
    const archivo = link.dataset.pagina;
    const url = link.getAttribute('href');
    cargarPagina(archivo, url);
  }
});

// Carga navbar una vez y contenido inicial
window.addEventListener('DOMContentLoaded', () => {
  fetch('Paginas/navbar.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('navbar').innerHTML = html;

      // Cargar contenido correspondiente a la URL actual
      const rutas = {
        '/principal': 'pagina1-principal.html',
        '/coinflip': 'pagina2-juego1.html',
        '/coinflip-juego': 'coinflip-juego.html',
        '/buscaminas': 'pagina3-juego2.html',
        '/sorteo': 'pagina4-sorteo.html',
        '/perfil': 'pagina5-perfil.html'
      };
      const path = window.location.pathname;
      const archivo = rutas[path] || 'pagina1-principal.html';
      cargarPagina(archivo, path);
    });
});

// Manejo de botones Atrás / Adelante del navegador
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.archivo) {
    fetch(`Paginas/${e.state.archivo}`)
      .then(res => res.text())
      .then(html => {
        document.getElementById('contenido').innerHTML = html;
        if (e.state.archivo === 'pagina5-perfil.html') {
          if (typeof inicializarPerfil === 'function') {
            inicializarPerfil();
          }
        }
      });
  }
});

window.cargarPagina = cargarPagina;
