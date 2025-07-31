function iniciarBuscaminas() {
  const container = document.getElementById('buscaminas-container');
  if (!container) return;

  const board = container.querySelector('#board');
  const bombsCountInput = container.querySelector('#bombsCount');
  const coinsBetInput = container.querySelector('#coinsBet');
  const startBtn = container.querySelector('#startBtn');
  const messageDiv = container.querySelector('#message');

  let bombPositions = [];
  let clickedCells = new Set();
  let gameStarted = false;
  let gameOver = true;
  let bombsCount = 1;
  let coinsBet = 0;

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function resetBoard() {
    board.innerHTML = '';
    messageDiv.textContent = '';
    clickedCells.clear();
    bombPositions = [];
  }

  function initializeGame() {
    resetBoard();

    bombsCount = parseInt(bombsCountInput.value);
    coinsBet = parseFloat(coinsBetInput.value);

    if (isNaN(bombsCount) || bombsCount < 1 || bombsCount > 5) {
      alert('Cantidad de bombas inválida (debe ser entre 1 y 5)');
      return false;
    }

    if (isNaN(coinsBet) || coinsBet <= 0) {
      alert('Cantidad de monedas inválida');
      return false;
    }

    // Leer usuarioID desde localStorage y validar
    const usuarioID = localStorage.getItem('usuarioID');
    if (!usuarioID) {
      alert('No hay usuario logueado');
      return Promise.resolve(false);
    }

    // Petición al backend para validar y registrar inicio de juego
    return fetch('/api/buscaminas/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        apuesta: coinsBet,
        id_usuario: parseInt(usuarioID)
      }),
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return false;
      }

      const positions = Array.from({ length: 9 }, (_, i) => i);
      shuffle(positions);
      bombPositions = positions.slice(0, bombsCount);

      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', onCellClick);
        board.appendChild(cell);
      }

      return true;
    })
    .catch(err => {
      console.error('Error al iniciar partida:', err);
      alert('Error al iniciar el juego. Inténtalo nuevamente.');
      return false;
    });
  }

  function onCellClick(e) {
    if (!gameStarted || gameOver) return;

    const cell = e.currentTarget;
    const index = Number(cell.dataset.index);

    if (clickedCells.has(index)) return;

    clickedCells.add(index);
    cell.classList.add('clicked');

    if (bombPositions.includes(index)) {
      cell.textContent = '💣';
      cell.classList.add('bomb');
      gameOver = true;
      revealAllBombs();
      messageDiv.textContent = `💥 ¡Perdiste! Perdiste ${coinsBet} monedas.`;

      // Leer usuarioID para enviar al backend
      const usuarioID = localStorage.getItem('usuarioID');

      // Notificar pérdida al backend
      fetch('/api/buscaminas/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultado: 'perder',
          apuesta: coinsBet,
          id_usuario: usuarioID ? parseInt(usuarioID) : null
        }),
        credentials: 'include'
      });

      finalizeGame();
    } else {
      cell.textContent = '✅';
    }
  }

  function revealAllBombs() {
    for (let i = 0; i < 9; i++) {
      const cell = board.children[i];
      const index = Number(cell.dataset.index);
      if (bombPositions.includes(index)) {
        cell.textContent = '💣';
        cell.classList.add('bomb');
      }
      cell.removeEventListener('click', onCellClick);
      cell.classList.add('clicked');
    }
  }

  function finalizeGame() {
    gameStarted = false;
    gameOver = true;
    startBtn.textContent = 'Comenzar juego';
  }

  function handleStartOrStop() {
    if (!gameStarted) {
      initializeGame().then((ready) => {
        if (!ready) return;
        gameStarted = true;
        gameOver = false;
        startBtn.textContent = 'Detener';
        messageDiv.textContent = '';
      });
    } else {
      if (!gameOver) {
        const safeClicks = clickedCells.size;
        const bonusPerSafe = 0.2;
        const gananciaNeta = coinsBet * bonusPerSafe * safeClicks;        
        messageDiv.textContent = `🎉 ¡Ganaste! Ganaste ${gananciaNeta.toFixed(2)} monedas.`;


        revealAllBombs();

        // Leer usuarioID para enviar al backend
        const usuarioID = localStorage.getItem('usuarioID');

        // Notificar ganancia al backend
        fetch('/api/buscaminas/finalizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resultado: 'ganar',
            ganancia: gananciaNeta,
            reintegro: coinsBet,
            apuesta: coinsBet,
            id_usuario: usuarioID ? parseInt(usuarioID) : null
          }),
          credentials: 'include'
        });
      }
      finalizeGame();
    }
  }

  startBtn.removeEventListener('click', handleStartOrStop);
  startBtn.addEventListener('click', handleStartOrStop);
}

window.iniciarBuscaminas = iniciarBuscaminas;
