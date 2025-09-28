export const BodyMetricsCard = ({ usuario }) => {
  const { peso, altura, edad, genero, objetivo, categoria } = usuario;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">

      <div className="space-y-2">
        <p><strong>Peso:</strong> {peso} kg</p>
        <p><strong>Altura:</strong> {altura} m</p>
        <p><strong>Edad:</strong> {edad} años</p>
        <p><strong>Género:</strong> {genero}</p>
        <p><strong>Objetivo:</strong> {objetivo}</p>
        <p><strong>Categoría:</strong> {categoria}</p>
      </div>
    </div>
  );
};