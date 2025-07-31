// frontend/JS/perfil.js

// Arranca el flujo inmediatamente (importante para SPA)
inicializarPerfil();

async function inicializarPerfil() {
  // 1) Verificamos sesión y mostramos la vista adecuada
  await verificarSesion();

  // 2) Atachamos listeners SOLO si existen los elementos
  const formRegistro = document.getElementById('formRegistro');
  const formLogin    = document.getElementById('formLogin');
  const btnLogout    = document.getElementById('btnLogout');
  const btnEliminar  = document.getElementById('btnEliminarCuenta');

  // Registro
  if (formRegistro) {
    const errorEdad = document.getElementById('errorEdad');
    formRegistro.addEventListener('submit', async e => {
      e.preventDefault();
      // Validar edad
      const fn = new Date(formRegistro.fechaNacimiento.value);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fn.getFullYear();
      const m = hoy.getMonth() - fn.getMonth();
      const d = hoy.getDate() - fn.getDate();
      if (edad < 18 || (edad === 18 && (m < 0 || (m === 0 && d < 0)))) {
        if (errorEdad) errorEdad.style.display = 'block';
        return;
      }
      if (errorEdad) errorEdad.style.display = 'none';

      const datos = {
        nombre: formRegistro.nombre.value.trim(),
        username: formRegistro.username.value.trim(),
        fechaNacimiento: formRegistro.fechaNacimiento.value,
        password: formRegistro.passwordRegistro.value
      };
      try {
        const res = await fetch('/api/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          alert('Registro exitoso!');
          mostrarUsuario(data.usuario);
        } else {
          alert(data.error || 'Error al registrar');
        }
      } catch (err) {
        console.error(err);
        alert('Error en la conexión');
      }
    });
  }

  // Login
  if (formLogin) {
    formLogin.addEventListener('submit', async e => {
      e.preventDefault();
      const datos = {
        username: formLogin.usernameLogin.value.trim(),
        password: formLogin.passwordLogin.value
      };
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          alert('Ingreso exitoso!');
          mostrarUsuario(data.usuario);
        } else {
          mostrarFormulario();
          alert(data.error || 'Error al iniciar sesión');
        }
      } catch (err) {
        console.error(err);
        alert('Error en la conexión');
      }
    });
  }

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      // Limpio localStorage y UI
      localStorage.removeItem('usuarioID');
      alert('Sesión cerrada correctamente');
      mostrarFormulario();
    });
  }

  // Eliminar cuenta
  if (btnEliminar) {
    btnEliminar.addEventListener('click', async () => {
      if (!confirm('¿Seguro que querés eliminar la cuenta?')) return;
      const res = await fetch('/api/eliminar-cuenta', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('usuarioID');
        alert('Cuenta eliminada.');
        mostrarFormulario();
      } else {
        alert(data.error || 'Error al eliminar cuenta');
      }
    });
  }

  // Editar username
  inicializarEventosPerfil();
}

async function verificarSesion() {
  try {
    const res = await fetch('/api/sesion-activa', { credentials: 'include' });
    if (res.ok) {
      const { usuario } = await res.json();
      mostrarUsuario(usuario);
    } else {
      // 401 u otros: limpiamos cualquier ID viejO
      localStorage.removeItem('usuarioID');
      mostrarFormulario();
    }
  } catch {
    localStorage.removeItem('usuarioID');
    mostrarFormulario();
  }
}

function mostrarUsuario(usuario) {
  // Guardamos en localStorage
  if (usuario.id) localStorage.setItem('usuarioID', usuario.id);

  // Actualizamos UI
  const perfilContainer            = document.querySelector('.perfil-container');
  const contenidoPostLogin         = document.getElementById('contenidoPostLogin');
  const nombreUsuarioSpan          = document.getElementById('nombreUsuario');
  const usernameUsuarioSpan        = document.getElementById('usernameUsuario');
  const fechaNacimientoUsuarioSpan = document.getElementById('fechaNacimientoUsuario');
  const monedasUsuarioSpan         = document.getElementById('monedasUsuario');

  if (nombreUsuarioSpan)          nombreUsuarioSpan.textContent          = usuario.nombre;
  if (usernameUsuarioSpan)        usernameUsuarioSpan.textContent        = usuario.username;
  if (fechaNacimientoUsuarioSpan) fechaNacimientoUsuarioSpan.textContent = usuario.fechaNacimiento;
  if (monedasUsuarioSpan)         monedasUsuarioSpan.textContent         = usuario.monedasTotales ?? '0';

  if (perfilContainer)    perfilContainer.style.display    = 'none';
  if (contenidoPostLogin) contenidoPostLogin.style.display = 'block';
}

function mostrarFormulario() {
  const perfilContainer    = document.querySelector('.perfil-container');
  const contenidoPostLogin = document.getElementById('contenidoPostLogin');
  if (perfilContainer)    perfilContainer.style.display    = 'block';
  if (contenidoPostLogin) contenidoPostLogin.style.display = 'none';
}

function inicializarEventosPerfil() {
  const btnEditar     = document.getElementById('btnEditar');
  const formEditar    = document.getElementById('formEditar');
  const btnConfirmar  = document.getElementById('btnConfirmar');
  const btnCancelar   = document.getElementById('btnCancelar');
  const nuevoUsername = document.getElementById('nuevoUsername');
  const usernameSpan  = document.getElementById('usernameUsuario');

  if (!btnEditar || !formEditar) return;

  btnEditar.addEventListener('click', () => {
    btnEditar.style.display  = 'none';
    formEditar.style.display = 'block';
    nuevoUsername.value      = usernameSpan.textContent.trim();
    nuevoUsername.focus();
  });

  btnCancelar.addEventListener('click', () => {
    formEditar.style.display = 'none';
    btnEditar.style.display  = 'inline-block';
  });

  btnConfirmar.addEventListener('click', () => {
    const nuevo = nuevoUsername.value.trim();
    if (!nuevo) {
      alert('El username no puede quedar vacío');
      return;
    }
    fetch('/api/actualizar-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoUsername: nuevo }),
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Error actualizando');
        return res.json();
      })
      .then(() => {
        usernameSpan.textContent = nuevo;
        formEditar.style.display = 'none';
        btnEditar.style.display  = 'inline-block';
        alert('Username actualizado');
      })
      .catch(err => {
        console.error(err);
        alert('No se pudo actualizar');
      });
  });
}
