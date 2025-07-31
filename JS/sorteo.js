// frontend/JS/sorteo.js

(function () {
  const contenedor = document.getElementById('contenedor-sorteos');
  if (!contenedor) return;

  const CreateButton = document.getElementById("CreateButton");
  const createMenu = document.getElementById("crearMenu");
  if (CreateButton && createMenu) {
    CreateButton.addEventListener("click", () => {
      createMenu.style.display = createMenu.style.display === 'block' ? 'none' : 'block';
    });
    document.getElementById('CrearSorteo').addEventListener('click', crearSorteo);
  }

  listarSorteos();

  async function listarSorteos() {
    try {
      const res = await fetch('/api/sorteos/activos');
      if (!res.ok) throw new Error('Error al listar sorteos');
      const sorteos = await res.json();
      const cont = document.getElementById('sorteos');
      cont.innerHTML = '';
      const id_usuario = getUsuarioID();

      if (sorteos.length === 0) {
        cont.innerHTML = '<p>No hay sorteos activos.</p>';
        return;
      }

      sorteos.forEach(s => {
        const esCreador = s.id_creador === id_usuario;
        const div = document.createElement('div');
        div.className = 'sorteo-card';

        div.innerHTML = `
        <div>
            <p><strong>Creador:</strong> ${s.creador}</p>
            <p><strong>Cantidad sorteada:</strong> <span id="cantidad-${s.id_sorteo}">${s.cantidad_sorteo}</span> SQCoins</p>
            <p><strong>Participantes:</strong> ${s.participantes}/${s.limite_participantes}</p>
        </div>
        <div>
          ${esCreador ? `
            <input type="number" id="nuevaCantidad-${s.id_sorteo}" placeholder="Nueva cantidad" min="${s.cantidad_sorteo}" />
            <button onclick="actualizarCantidad(${s.id_sorteo})">Actualizar</button>
            <button onclick="eliminarSorteo(${s.id_sorteo})">Eliminar</button>
          ` : ''}
          <button onclick="unirseSorteo(${s.id_sorteo})">Unirse</button>
        </div>
      `;
        cont.appendChild(div);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function crearSorteo() {
    const cantidad = parseInt(document.getElementById('cantidadSortear').value, 10);
    const limite = parseInt(document.getElementById('limiteParticipantes').value, 10);
    const id_usuario = getUsuarioID();
    if (!cantidad || !limite) {
      alert("Completá todos los campos");
      return;
    }
    try {
      const res = await fetch('/api/sorteos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad_sorteo: cantidad, limite_participantes: limite, id_creador: id_usuario })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Sorteo creado con éxito');
      listarSorteos();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error desconocido');
    }
  }

  async function actualizarCantidad(idSorteo) {
    const input = document.getElementById(`nuevaCantidad-${idSorteo}`);
    const nuevaCantidad = parseInt(input.value, 10);
    const id_usuario = getUsuarioID();
    if (!nuevaCantidad) return alert("Ingresá una cantidad válida");

    try {
      const res = await fetch('/api/sorteos/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sorteo: idSorteo, nuevaCantidad, id_usuario })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Cantidad actualizada');
      listarSorteos();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al actualizar');
    }
  }

  async function unirseSorteo(idSorteo) {
    const id_usuario = getUsuarioID();
    try {
      const res = await fetch('/api/sorteos/unirse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario, id_sorteo: idSorteo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('¡Te uniste al sorteo!');
      listarSorteos();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al unirse al sorteo');
    }
  }

  async function eliminarSorteo(idSorteo) {
    const confirmar = confirm("¿Estás seguro que querés eliminar este sorteo?");
    if (!confirmar) return;

    const id_usuario = getUsuarioID();
    try {
      const res = await fetch('/api/sorteos/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sorteo: idSorteo, id_usuario })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Sorteo eliminado');
      listarSorteos();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar sorteo');
    }
  }

  function getUsuarioID() {
    const id = localStorage.getItem('usuarioID');
    if (!id) {
      alert('Usuario no logueado.');
      throw new Error('Usuario no logueado');
    }
    return parseInt(id, 10);
  }

  // Exponer para el HTML
  window.unirseSorteo = unirseSorteo;
  window.actualizarCantidad = actualizarCantidad;
  window.eliminarSorteo = eliminarSorteo;
})();
