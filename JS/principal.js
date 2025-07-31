const API_BASE = 'https://backend-sqcoins-production.up.railway.app';

async function cargarRankings() {
  try {
    const res = await fetch(`${API_BASE}/api/rankings`);
    if (!res.ok) throw new Error('Error al obtener rankings');
    const data = await res.json();

    // Función para renderizar cada ranking
    const renderRanking = (rankingArray) => {
      if (!rankingArray.length) {
        return '<li>No hay jugadores que cumplan el mínimo.</li>';
      }
      return rankingArray.map(jugador =>
        `<li><span class="name">${jugador.username}</span><span class="points">${jugador.monedas}</span></li>`
      ).join('');
    };

    // Seleccionamos las cajas de ranking en el mismo orden que en el HTML
    const statBoxes = document.querySelectorAll('.stat-box');
    if (statBoxes.length < 3) return;

    statBoxes[0].querySelector('.ranking-list').innerHTML = renderRanking(data.juego1);
    statBoxes[1].querySelector('.ranking-list').innerHTML = renderRanking(data.juego2);
    statBoxes[2].querySelector('.ranking-list').innerHTML = renderRanking(data.sorteo);

  } catch (error) {
    console.error('Error cargando rankings:', error);
  }
}
