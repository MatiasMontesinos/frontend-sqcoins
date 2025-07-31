(function coinflipJuegoModule() {
  if (window.coinflipJuegoInicializado) {
    console.warn("coinflip-juego.js ya estaba activo. Reiniciando...");
  }
  window.coinflipJuegoInicializado = true;

  const API_BASE = 'https://backend-sqcoins-production.up.railway.app';

  let idSala, usuarioID;

  function mostrarControlAjuste(sala) {
    const contenedor = document.getElementById('ajuste-apuesta');
    const input = document.getElementById('nuevoMonto');
    if (usuarioID === sala.id_jugador1 && !sala.id_jugador2) {
      contenedor.style.display = 'block';
      input.value = sala.cant_apostada;
    } else {
      contenedor.style.display = 'none';
    }
  }

  window.volverAlInicio = () => {
    if (typeof cargarPagina === 'function') {
      cargarPagina('pagina2-juego1.html', '/coinflip');
    } else {
      window.location.href = '/coinflip';
    }
  };

  window.cancelarPartida = async () => {
    try {
      await fetch(`${API_BASE}/coinflip/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idSala, idUsuario: usuarioID }),
        credentials: 'include'
      });
    } catch (err) {
      console.error('Error al cancelar:', err);
    }
    volverAlInicio();
  };

  async function coinflipJuegoHandler() {
    const salaRaw = localStorage.getItem('salaCoinflip');
    if (!salaRaw) {
      alert('No hay sala activa. Volviendo al listado de salas.');
      return volverAlInicio();
    }
    idSala = parseInt(salaRaw, 10);
    if (isNaN(idSala)) {
      alert('ID de sala inválido. Redirigiendo...');
      return volverAlInicio();
    }

    const userRaw = localStorage.getItem('usuarioID');
    if (!userRaw) {
      alert('Usuario no logueado');
      throw new Error('No hay usuario');
    }
    usuarioID = parseInt(userRaw, 10);

    const container = document.querySelector('.container');
    const ajusteHTML = `
      <div id="ajuste-apuesta" style="display:none; text-align:center; margin-top:1rem;">
        <input type="number" id="nuevoMonto" min="1" style="width:80px;" />
        <button id="confirmar-btn">Confirmar</button>
      </div>`;
    container.insertAdjacentHTML('beforeend', ajusteHTML);

    document.getElementById('confirmar-btn').addEventListener('click', async () => {
      const valor = parseInt(document.getElementById('nuevoMonto').value, 10);
      if (isNaN(valor) || valor < 1) {
        return alert('El monto mínimo es 1');
      }
      try {
        const res = await fetch(`${API_BASE}/coinflip/actualizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idSala, idUsuario: usuarioID, nuevoMonto: valor }),
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || data.status !== 'ok') {
          throw new Error(data.error || 'Error al actualizar');
        }
        await cargarSala();
        alert(`La apuesta se actualizó a ${valor} SQCoins correctamente`);
      } catch (e) {
        alert(e.message);
      }
    });

    function comenzarEspera() {
      const moneda = document.getElementById('moneda');
      moneda.style.animation = 'girarMoneda 1s linear infinite';
      moneda.style.transform = 'rotateY(0deg)';
    }

    function comenzarPartida(ganoRojo) {
      const moneda = document.getElementById('moneda');
      moneda.style.animation = 'tirarMoneda 1s ease-in-out';
      setTimeout(() => {
        moneda.style.animation = 'none';
        moneda.style.transform = ganoRojo ? 'rotateY(0deg)' : 'rotateY(180deg)';
      }, 1000);
    }

    async function cargarSala() {
      try {
        const res = await fetch(`${API_BASE}/coinflip/sala/${idSala}`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Sala no encontrada');
        const datosSala = await res.json();
        const sala = datosSala;

        document.getElementById('jugador-rojo').textContent = sala.creador || '---';
        document.getElementById('jugador-negro').textContent = sala.oponente || 'Esperando...';

        const btnCancelar = document.getElementById('cancelar-btn');
        if (usuarioID === sala.id_jugador1) {
          btnCancelar.style.display = 'block';
          btnCancelar.disabled = !!sala.id_jugador2;
        } else {
          btnCancelar.style.display = 'none';
        }

        mostrarControlAjuste(sala);

        const moneda = document.getElementById('moneda');
        if (!sala.id_jugador2) {
          comenzarEspera();
          if (usuarioID !== sala.id_jugador1) {
            unirseASala();
          }
        } else if (sala.id_ganador == null) {
          moneda.style.animation = 'none';
          moneda.style.transform = 'rotateY(0deg)';
        } else {
          const ganoRojo = sala.id_ganador === sala.id_jugador1;
          comenzarPartida(ganoRojo);
        }

        const mensaje = document.getElementById('mensaje-resultado');
        if (sala.id_ganador) {
          const ganadorEsCreador = sala.id_ganador === sala.id_jugador1;
          const nombre = ganadorEsCreador ? sala.creador : sala.oponente;
          mensaje.textContent = `¡Ganó ${nombre}!`;
          mensaje.style.display = 'block';
        } else {
          mensaje.style.display = 'none';
        }
      } catch (err) {
        console.error('Error al obtener sala:', err);
        document.getElementById('jugador-rojo').textContent = 'Error';
        document.getElementById('jugador-negro').textContent = 'Error';
      }
    }

    async function unirseASala() {
      try {
        const res = await fetch(`${API_BASE}/coinflip/unirse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_usuario: usuarioID, id_sala_juego1: idSala }),
          credentials: 'include'
        });
        const data = await res.json();
        if (data.status === 'ok' || data.status === 'resuelto') {
          await cargarSala();
        } else {
          alert('Error: ' + (data.error || 'No se pudo unir'));
        }
      } catch (err) {
        console.error('Error al unirse:', err);
        alert('Error al unirse a sala: ' + err.message);
      }
    }

    const btnCancelar = document.getElementById('cancelar-btn');
    if (btnCancelar) btnCancelar.onclick = window.cancelarPartida;

    await cargarSala();
  }

  coinflipJuegoHandler();
})();
