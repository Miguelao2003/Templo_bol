import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export const MetricsRadarChart = ({ metrics }) => {
  // Definir rangos mínimos y máximos
  const ranges = {
    tmb: { min: 1000, max: 2500 },
    imc: { min: 10, max: 40 },
    grasa: { min: 5, max: 40 },
    pesoIdeal: { min: 40, max: 120 },
  };

  // Función para normalizar un valor según rango
  const normalize = (value, min, max) => {
    if (value === undefined || value === null) return 0;
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  };

  const data = {
    labels: ["TMB", "IMC", "Grasa %", "Peso Ideal"],
    datasets: [
      {
        label: "Métricas Corporales",
        data: [
          normalize(metrics?.tmb, ranges.tmb.min, ranges.tmb.max),
          normalize(metrics?.imc, ranges.imc.min, ranges.imc.max),
          normalize(metrics?.grasa_corporal_estimada, ranges.grasa.min, ranges.grasa.max),
          normalize(metrics?.peso_ideal, ranges.pesoIdeal.min, ranges.pesoIdeal.max),
        ],
        backgroundColor: "rgba(234, 179, 8, 0.4)",
        borderColor: "rgba(234, 179, 8, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      r: {
        angleLines: { color: "#555" },
        grid: { color: "#444" },
        pointLabels: { color: "#fff", font: { size: 12 } },
        ticks: {
          color: "#ddd",
          backdropColor: "transparent",
          beginAtZero: true,
          max: 1,          // escala de 0 a 1 porque normalizamos
          stepSize: 0.2,
          callback: (value) => `${value * 100}%`, // opcional: mostrar en %
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#fff",
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const index = context.dataIndex;
            const rawValue = [
              metrics?.tmb,
              metrics?.imc,
              metrics?.grasa_corporal_estimada,
              metrics?.peso_ideal,
            ][index];
            return `${context.label}: ${rawValue}`;
          }
        }
      }
    },
  };

  return <Radar data={data} options={options} />;
};
