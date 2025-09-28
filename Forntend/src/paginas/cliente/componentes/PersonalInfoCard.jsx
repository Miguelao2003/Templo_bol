export const PersonalInfoCard = ({ usuario }) => {
  const { correo, nombre, apellido_p, apellido_m, rol, nivel } = usuario;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
      <div className="space-y-2">
        <p><strong>Nombre:</strong> {nombre} {apellido_p} {apellido_m}</p>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Rol:</strong> {rol}</p>
        <p><strong>Nivel:</strong> <span className="capitalize">{nivel || "No especificado"}</span></p>
      </div>
    </div>
  );
};