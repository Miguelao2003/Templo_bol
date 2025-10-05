import { MetricsRadarChart } from "./charts/MetricsRadarChart";

export const CalculatedMetrics = ({ metrics }) => {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <ul className="space-y-2">
          <li>
            <strong>TMB:</strong> {metrics?.tmb}
          </li>
          <li>
            <strong>IMC:</strong> {metrics?.imc}
          </li>
          <li>
            <strong>Rango IMC:</strong> {metrics?.rango_imc}
          </li>
          <li>
            <strong>Grasa Estimada:</strong> {metrics?.grasa_corporal_estimada}%
          </li>
          <li>
            <strong>Peso Ideal:</strong> {metrics?.peso_ideal} kg
          </li>
        </ul>

        {/* Contenedor que limita el gráfico */}
        <div className="w-full max-w-[350px] mx-auto">
          <MetricsRadarChart metrics={metrics} />
        </div>
      </div>
    </div>
  );
};
