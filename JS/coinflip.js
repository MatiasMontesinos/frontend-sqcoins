(function() {
    const CreateButton = document.getElementById("CreateButton");
    const createMenu = document.getElementById("createMenu");

    if (CreateButton && createMenu) {
        function toggleMenu() {
            createMenu.style.display = (createMenu.style.display === 'block') ? 'none' : 'block';
        }
        CreateButton.addEventListener("click", toggleMenu);
        document.getElementById('CrearSala').addEventListener('click', crearSala);
    }
})();

fetch('/coinflip/salas')
  .then(res => res.json())
  .then(salas => {
    const contenedor = document.getElementById('salas');
    contenedor.innerHTML = '';

    if (salas.length === 0) {
      contenedor.innerHTML = '<p>No hay salas activas.</p>';
      return;
    }

    salas.forEach(sala => {
      const div = document.createElement('div');
      div.className = 'sala';

      div.innerHTML = `
        <p><strong>Creador:</strong> ${sala.creador}</p>
        <p><strong>Apuesta:</strong> ${sala.cant_apostada} SQCoins</p>
        <button onclick="unirseASalaSPA(${sala.id_sala_juego1})">Unirse</button>
      `;

      contenedor.appendChild(div);
    });
  })
  .catch(err => console.error('Error al listar salas:', err));

function crearSala() {
  const monto = parseInt(document.getElementById('montoApuesta').value);
  if (isNaN(monto) || monto <= 0) {
    alert('Ingresá un monto válido');
    return;
  }

  fetch('/coinflip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_usuario: getUsuarioID(),
      monto: monto
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'sala_creada') {
      if (data.sala && data.sala.id_sala_juego1) {
        localStorage.setItem('salaCoinflip', data.sala.id_sala_juego1);
        cargarPagina('coinflip-juego.html', '/coinflip-juego');
      } else {
        alert('Error: ID de sala no disponible.');
      }
    } else {
      alert('Error creando sala: ' + (data.error || 'desconocido'));
    }
  })
  .catch(err => console.error('Error al crear sala:', err));
}

function getUsuarioID() {
  const id = localStorage.getItem('usuarioID');
  if (!id) {
    alert('Usuario no logueado. No se pudo obtener el ID.');
    throw new Error('Usuario no logueado');
  }
  return parseInt(id);
}

function unirseASalaSPA(idSala) {
  if (idSala) {
    localStorage.setItem('salaCoinflip', idSala);
    cargarPagina('coinflip-juego.html', '/coinflip-juego');
  } else {
    alert('Error: ID de sala no válido.');
  }
}
