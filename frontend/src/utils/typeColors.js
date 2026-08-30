const TYPE_COLORS = {
  Planta: '#78C850',
  Veneno: '#A040A0',
  Fuego: '#F08030',
  Agua: '#6890F0',
  Bicho: '#A8B820',
  Normal: '#A8A878',
  Eléctrico: '#F8D030',
  Tierra: '#E0C068',
  Volador: '#A890F0',
  Psíquico: '#F85888',
  Lucha: '#C03028',
  Fantasma: '#705898',
  Acero: '#B8B8D0',
  Hada: '#EE99AC',
  Siniestro: '#705848',
  Dragón: '#7038F8',
  Roca: '#B8A038',
  Hielo: '#98D8D8',
};

export function typeColor(type) {
  return TYPE_COLORS[type] || '#777';
}

export default TYPE_COLORS;