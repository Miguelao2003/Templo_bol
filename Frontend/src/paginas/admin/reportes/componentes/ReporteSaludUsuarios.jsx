import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Heart,
  TrendingUp,
  Download,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Filter,
  Activity,
  Target,
  Scale,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  BarController,
  PieController,
  TimeScale,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  BarController,
  PieController,
  TimeScale,
  Filler
);

// Importar servicios
import { userService } from "../../../../services/usuarios";

// Componente para KPIs de Salud
const HealthKPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "yellow",
  trend = null,
  loading = false,
  unit = "",
}) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
    <div className="flex items-center gap-3">
      <div
        className={`p-3 bg-gradient-to-br from-${color}-400/20 to-${color}-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-16 mt-1"></div>
          </div>
        ) : (
          <p className="text-xl font-bold text-white">
            {value}
            {unit}
          </p>
        )}
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp
              className={`h-3 w-3 ${
                trend.includes("+") ? "text-green-400" : "text-red-400"
              } mr-1`}
            />
            <span
              className={`text-xs ${
                trend.includes("+") ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Componente para gráficos
const HealthChartCard = ({
  title,
  children,
  loading = false,
  icon: Icon = BarChart3,
  onExport,
}) => (
  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm">Análisis de salud y bienestar</p>
        </div>
      </div>
      {onExport && (
        <button
          onClick={onExport}
          className="p-2 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg hover:from-yellow-400 hover:to-yellow-500 hover:text-black transition-all duration-300"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
    {loading ? (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-700/50 rounded-xl"></div>
      </div>
    ) : (
      <div className="relative h-64">{children}</div>
    )}
  </div>
);

// Componente para tabla de métricas por género
const MetricasGeneroTable = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-700 rounded flex-1"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
          <Users className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            Métricas Promedio por Género
          </h3>
          <p className="text-gray-400 text-sm">
            Comparación de indicadores de salud
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 text-gray-400 font-medium">
                Métrica
              </th>
              <th className="text-center py-3 text-pink-400 font-medium">
                Femenino
              </th>
              <th className="text-center py-3 text-blue-400 font-medium">
                Masculino
              </th>
              <th className="text-center py-3 text-gray-400 font-medium">
                Diferencia
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">IMC Promedio</td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.imc.toFixed(1)}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.imc.toFixed(1)}
              </td>
              <td className="py-3 text-center text-gray-300">
                {Math.abs(data.femenino.imc - data.masculino.imc).toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">
                Peso Promedio (kg)
              </td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.peso.toFixed(1)}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.peso.toFixed(1)}
              </td>
              <td className="py-3 text-center text-gray-300">
                {Math.abs(data.femenino.peso - data.masculino.peso).toFixed(1)}
              </td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">
                Altura Promedio (m)
              </td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.altura.toFixed(2)}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.altura.toFixed(2)}
              </td>
              <td className="py-3 text-center text-gray-300">
                {Math.abs(data.femenino.altura - data.masculino.altura).toFixed(
                  2
                )}
              </td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">Edad Promedio</td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.edad.toFixed(0)}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.edad.toFixed(0)}
              </td>
              <td className="py-3 text-center text-gray-300">
                {Math.abs(data.femenino.edad - data.masculino.edad).toFixed(0)}
              </td>
            </tr>
            <tr className="hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">TMB Promedio</td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.tmb.toFixed(0)}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.tmb.toFixed(0)}
              </td>
              <td className="py-3 text-center text-gray-300">
                {Math.abs(data.femenino.tmb - data.masculino.tmb).toFixed(0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReporteSaludUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    genero: "todos",
    rangoEdad: "todos",
    categoria: "todos",
  });

  // Referencias para gráficos
  const imcChartRef = useRef(null);
  const objetivosChartRef = useRef(null);
  const evolucionChartRef = useRef(null);

  // Instancias de gráficos
  const imcChartInstance = useRef(null);
  const objetivosChartInstance = useRef(null);
  const evolucionChartInstance = useRef(null);

  // Cargar datos de usuarios
  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Procesar datos para análisis
  const processHealthData = () => {
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return {
        imcDistribution: {},
        metricasPorGenero: { femenino: {}, masculino: {} },
        objetivosComunes: {},
        evolucionTemporal: {},
        totalUsuarios: 0,
      };
    }

    // Filtrar usuarios según filtros seleccionados
    let usuariosFiltrados = usuarios.filter((u) => u.metricas); // Solo usuarios con métricas

    if (filtros.genero !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter(
        (u) =>
          u.genero && u.genero.toLowerCase() === filtros.genero.toLowerCase()
      );
    }

    if (filtros.categoria !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter(
        (u) => u.categoria === filtros.categoria
      );
    }

    if (filtros.rangoEdad !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter((u) => {
        const edad = u.edad;
        switch (filtros.rangoEdad) {
          case "18-25":
            return edad >= 18 && edad <= 25;
          case "26-35":
            return edad >= 26 && edad <= 35;
          case "36-45":
            return edad >= 36 && edad <= 45;
          case "46+":
            return edad >= 46;
          default:
            return true;
        }
      });
    }

    // 1. Distribución de IMC
    const imcDistribution = usuariosFiltrados.reduce((acc, user) => {
      if (user.metricas && user.metricas.rango_imc) {
        const rango = user.metricas.rango_imc;
        acc[rango] = (acc[rango] || 0) + 1;
      }
      return acc;
    }, {});

    // 2. Métricas promedio por género
    const usuariosPorGenero = usuariosFiltrados.reduce((acc, user) => {
      const genero = user.genero
        ? user.genero.toLowerCase()
        : "no especificado";
      if (!acc[genero]) acc[genero] = [];
      acc[genero].push(user);
      return acc;
    }, {});

    const metricasPorGenero = {};
    Object.entries(usuariosPorGenero).forEach(([genero, users]) => {
      const metricas = users.filter((u) => u.metricas).map((u) => u.metricas);

      if (metricas.length > 0) {
        metricasPorGenero[genero] = {
          imc:
            metricas.reduce((sum, m) => sum + (m.imc || 0), 0) /
            metricas.length,
          peso: users.reduce((sum, u) => sum + (u.peso || 0), 0) / users.length,
          altura:
            users.reduce((sum, u) => sum + (u.altura || 0), 0) / users.length,
          edad: users.reduce((sum, u) => sum + (u.edad || 0), 0) / users.length,
          tmb:
            metricas.reduce((sum, m) => sum + (m.tmb || 0), 0) /
            metricas.length,
          count: users.length,
        };
      }
    });

    // 3. Objetivos más comunes
    const objetivosComunes = usuariosFiltrados.reduce((acc, user) => {
      if (user.objetivo) {
        acc[user.objetivo] = (acc[user.objetivo] || 0) + 1;
      }
      return acc;
    }, {});

    // 4. Evolución temporal de registros
    const evolucionTemporal = usuariosFiltrados.reduce((acc, user) => {
      if (user.fecha_registro) {
        const fecha = new Date(user.fecha_registro);
        const mesAno = `${fecha.getFullYear()}-${String(
          fecha.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[mesAno] = (acc[mesAno] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      imcDistribution,
      metricasPorGenero,
      objetivosComunes,
      evolucionTemporal,
      totalUsuarios: usuariosFiltrados.length,
    };
  };

  // Calcular KPIs de salud
  const calculateHealthKPIs = () => {
    const { totalUsuarios, metricasPorGenero, imcDistribution } =
      processHealthData();

    // IMC promedio general
    const todosUsuarios = usuarios.filter((u) => u.metricas && u.metricas.imc);
    const imcPromedio =
      todosUsuarios.length > 0
        ? todosUsuarios.reduce((sum, u) => sum + u.metricas.imc, 0) /
          todosUsuarios.length
        : 0;

    // Porcentaje de usuarios saludables (IMC normal)
    const usuariosSaludables = imcDistribution["Normal"] || 0;
    const porcentajeSaludable =
      totalUsuarios > 0
        ? ((usuariosSaludables / totalUsuarios) * 100).toFixed(1)
        : 0;

    // Edad promedio
    const edadPromedio =
      usuarios.length > 0
        ? usuarios.reduce((sum, u) => sum + (u.edad || 0), 0) / usuarios.length
        : 0;

    // TMB promedio
    const tmbPromedio =
      todosUsuarios.length > 0
        ? todosUsuarios.reduce((sum, u) => sum + (u.metricas.tmb || 0), 0) /
          todosUsuarios.length
        : 0;

    return {
      imcPromedio: imcPromedio.toFixed(1),
      porcentajeSaludable,
      edadPromedio: edadPromedio.toFixed(0),
      tmbPromedio: tmbPromedio.toFixed(0),
      totalUsuarios,
    };
  };

  // Crear gráficos
  const createCharts = () => {
    const { imcDistribution, objetivosComunes, evolucionTemporal } =
      processHealthData();

    // Destruir gráficos existentes
    if (imcChartInstance.current) imcChartInstance.current.destroy();
    if (objetivosChartInstance.current)
      objetivosChartInstance.current.destroy();
    if (evolucionChartInstance.current)
      evolucionChartInstance.current.destroy();

    // Gráfico circular - Distribución de IMC
    if (imcChartRef.current && Object.keys(imcDistribution).length > 0) {
      const ctx = imcChartRef.current.getContext("2d");

      const coloresIMC = {
        "Bajo peso": "#3B82F6",
        Normal: "#10B981",
        Sobrepeso: "#F59E0B",
        Obesidad: "#EF4444",
        "Obesidad mórbida": "#7C2D12",
      };

      const labels = Object.keys(imcDistribution);
      const backgroundColors = labels.map(
        (label) => coloresIMC[label] || "#6B7280"
      );

      imcChartInstance.current = new ChartJS(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              data: Object.values(imcDistribution),
              backgroundColor: backgroundColors,
              borderWidth: 2,
              borderColor: "#1F2937",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: 20,
                usePointStyle: true,
                color: "#D1D5DB",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed * 100) / total).toFixed(
                    1
                  );
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    }

    // Gráfico de barras - Objetivos más comunes
    if (objetivosChartRef.current && Object.keys(objetivosComunes).length > 0) {
      const ctx = objetivosChartRef.current.getContext("2d");

      objetivosChartInstance.current = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(objetivosComunes),
          datasets: [
            {
              label: "Número de Usuarios",
              data: Object.values(objetivosComunes),
              backgroundColor: "rgba(245, 158, 11, 0.8)",
              borderColor: "rgba(245, 158, 11, 1)",
              borderWidth: 2,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#9CA3AF" },
              grid: { color: "#374151" },
            },
            x: {
              ticks: { color: "#9CA3AF" },
              grid: { color: "#374151" },
            },
          },
        },
      });
    }

    // Gráfico de línea - Evolución temporal
    if (
      evolucionChartRef.current &&
      Object.keys(evolucionTemporal).length > 0
    ) {
      const ctx = evolucionChartRef.current.getContext("2d");

      evolucionChartInstance.current = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: Object.keys(evolucionTemporal).sort(),
          datasets: [
            {
              label: "Nuevos Registros",
              data: Object.keys(evolucionTemporal)
                .sort()
                .map((mes) => evolucionTemporal[mes]),
              borderColor: "rgba(245, 158, 11, 1)",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgba(245, 158, 11, 1)",
              pointBorderColor: "#1F2937",
              pointBorderWidth: 2,
              pointRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#9CA3AF" },
              grid: { color: "#374151" },
            },
            x: {
              ticks: { color: "#9CA3AF" },
              grid: { color: "#374151" },
            },
          },
        },
      });
    }
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(createCharts, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, usuarios, filtros]);

  // Función mejorada para exportar PDF de Salud
  const exportToPDFSalud = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdf = new jsPDF("p", "mm", "a4");
      const kpis = calculateHealthKPIs();
      const { imcDistribution, objetivosComunes, metricasPorGenero } =
        processHealthData();

      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      const checkNewPage = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // === HEADER CON LOGO ===
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.crossOrigin = "anonymous";
          logoImg.src = "/templo.png?" + new Date().getTime(); // Cache busting
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        ctx.drawImage(logoImg, 0, 0);
        const logoDataUrl = canvas.toDataURL("image/png");

        const logoSize = 25;
        pdf.addImage(logoDataUrl, "PNG", margin, yPosition, logoSize, logoSize);

        pdf.setFontSize(24);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Templo.Bol", margin + logoSize + 10, yPosition + 8);


        yPosition += logoSize + 10;
      } catch (error) {
        console.warn("No se pudo cargar el logo, usando texto alternativo");
        pdf.setFontSize(24);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Templo.Bol", margin, yPosition);
        pdf.setFontSize(16);
        pdf.setTextColor(245, 158, 11);

      }

      // === TÍTULO DEL REPORTE ===
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40);
      const titulo = "REPORTE DE SALUD DE USUARIOS";
      const tituloWidth = pdf.getTextWidth(titulo);
      pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition);

      yPosition += 8;
      pdf.setFontSize(14);
      pdf.setTextColor(245, 158, 11);
      const subtituloWidth = pdf.getTextWidth(subtitulo);
      pdf.text(subtitulo, (pageWidth - subtituloWidth) / 2, yPosition);

      yPosition += 15;

      // === INFORMACIÓN DEL REPORTE ===
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        margin,
        yPosition
      );

      const totalUsuariosText = `Total de usuarios analizados: ${kpis.totalUsuarios}`;
      const totalWidth = pdf.getTextWidth(totalUsuariosText);
      pdf.text(totalUsuariosText, pageWidth - margin - totalWidth, yPosition);

      yPosition += 15;

      // === FILTROS APLICADOS ===
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("FILTROS APLICADOS", margin, yPosition);

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);

      const filtrosHeight = 25;
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(
        margin,
        yPosition,
        contentWidth,
        filtrosHeight,
        3,
        3,
        "FD"
      );

      yPosition += 6;
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `• Género: ${
          filtros.genero === "todos"
            ? "Todos los géneros"
            : filtros.genero.charAt(0).toUpperCase() + filtros.genero.slice(1)
        }`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `• Rango de edad: ${
          filtros.rangoEdad === "todos" ? "Todas las edades" : filtros.rangoEdad
        }`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `• Categoría: ${
          filtros.categoria === "todos"
            ? "Todas las categorías"
            : filtros.categoria.charAt(0).toUpperCase() +
              filtros.categoria.slice(1)
        }`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `• Usuarios con métricas de salud: Solo incluidos`,
        margin + 5,
        yPosition
      );

      yPosition += 15;

      // === RESUMEN EJECUTIVO ===
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("RESUMEN EJECUTIVO DE SALUD", margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      const resumenTexto = [
        `El análisis de salud de ${kpis.totalUsuarios} usuarios revela un IMC promedio de ${kpis.imcPromedio},`,
        `indicando un estado de salud general ${
          kpis.imcPromedio >= 18.5 && kpis.imcPromedio <= 24.9
            ? "saludable"
            : kpis.imcPromedio < 18.5
            ? "por debajo del peso normal"
            : "por encima del peso normal"
        }.`,
        ``,
        `El ${kpis.porcentajeSaludable}% de los usuarios mantienen un IMC dentro del rango normal,`,
        `lo cual refleja una comunidad ${
          kpis.porcentajeSaludable > 70
            ? "muy saludable"
            : kpis.porcentajeSaludable > 50
            ? "moderadamente saludable"
            : "que requiere atención"
        }.`,
        ``,
        `La edad promedio de ${kpis.edadPromedio} años y la tasa metabólica basal promedio`,
        `de ${kpis.tmbPromedio} kcal proporcionan una base sólida para programas personalizados.`,
      ];

      resumenTexto.forEach((linea) => {
        if (linea === "") {
          yPosition += 3;
        } else {
          const palabras = linea.split(" ");
          let lineaActual = "";

          palabras.forEach((palabra) => {
            const lineaTest = lineaActual + (lineaActual ? " " : "") + palabra;
            if (pdf.getTextWidth(lineaTest) > contentWidth - 10) {
              pdf.text(lineaActual, margin + 5, yPosition);
              yPosition += 4;
              lineaActual = palabra;
            } else {
              lineaActual = lineaTest;
            }
          });

          if (lineaActual) {
            pdf.text(lineaActual, margin + 5, yPosition);
            yPosition += 4;
          }
        }
      });

      yPosition += 15;

      // === INDICADORES CLAVE DE SALUD ===
      checkNewPage(50);
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("INDICADORES CLAVE DE SALUD", margin, yPosition);
      yPosition += 12;

      const healthKpiData = [
        [
          "IMC Promedio",
          `${kpis.imcPromedio}`,
          "Índice de masa corporal promedio",
        ],
        [
          "Usuarios Saludables",
          `${kpis.porcentajeSaludable}%`,
          "Porcentaje con IMC normal",
        ],
        [
          "Edad Promedio",
          `${kpis.edadPromedio} años`,
          "Edad promedio de usuarios",
        ],
        [
          "TMB Promedio",
          `${kpis.tmbPromedio} kcal`,
          "Tasa metabólica basal promedio",
        ],
      ];

      // Header de tabla
      pdf.setFillColor(245, 158, 11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.rect(margin, yPosition, contentWidth, 8, "F");
      pdf.text("MÉTRICA", margin + 2, yPosition + 5);
      pdf.text("VALOR", margin + 60, yPosition + 5);
      pdf.text("DESCRIPCIÓN", margin + 90, yPosition + 5);
      yPosition += 8;

      // Datos de tabla
      pdf.setTextColor(60, 60, 60);
      healthKpiData.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        pdf.setFillColor(...bgColor);
        pdf.rect(margin, yPosition, contentWidth, 7, "F");

        pdf.text(row[0], margin + 2, yPosition + 4);
        pdf.text(row[1], margin + 60, yPosition + 4);
        pdf.text(row[2], margin + 90, yPosition + 4);
        yPosition += 7;
      });

      yPosition += 15;

      // === DISTRIBUCIÓN DE IMC ===
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("DISTRIBUCIÓN DE IMC", margin, yPosition);
      yPosition += 10;

      if (Object.keys(imcDistribution).length > 0) {
        Object.entries(imcDistribution).forEach(([categoria, cantidad]) => {
          const porcentaje = ((cantidad / kpis.totalUsuarios) * 100).toFixed(1);
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `${categoria}: ${cantidad} usuarios (${porcentaje}%)`,
            margin,
            yPosition
          );
          yPosition += 5;
        });
      }

      yPosition += 10;

      // === OBJETIVOS DE ENTRENAMIENTO ===
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("OBJETIVOS MÁS COMUNES", margin, yPosition);
      yPosition += 10;

      if (Object.keys(objetivosComunes).length > 0) {
        Object.entries(objetivosComunes).forEach(([objetivo, cantidad]) => {
          const porcentaje = ((cantidad / kpis.totalUsuarios) * 100).toFixed(1);
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `${objetivo}: ${cantidad} usuarios (${porcentaje}%)`,
            margin,
            yPosition
          );
          yPosition += 5;
        });
      }

      // === PIE DE PÁGINA ===
      const addFooter = (pageNum) => {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${pageNum}`, pageWidth - margin - 15, pageHeight - 10);
        pdf.text(
          "Templo.Bol - Sistema de Gestión PowerPlate",
          margin,
          pageHeight - 10
        );
        pdf.text(
          `Confidencial - ${new Date().getFullYear()}`,
          (pageWidth -
            pdf.getTextWidth(`Confidencial - ${new Date().getFullYear()}`)) /
            2,
          pageHeight - 10
        );
      };

      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i);
      }

      pdf.save(
        `reporte-salud-usuarios-${new Date().toISOString().split("T")[0]}.pdf`
      );
      console.log("✅ PDF de salud exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al generar el PDF.");
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const kpis = calculateHealthKPIs();
      const {
        imcDistribution,
        objetivosComunes,
        metricasPorGenero,
        evolucionTemporal,
      } = processHealthData();

      const workbook = XLSX.utils.book_new();

      // Hoja 1: Resumen de Salud
      const resumenData = [
        ["REPORTE DE SALUD DE USUARIOS - POWERPLATE", "", ""],
        [`Generado: ${new Date().toLocaleDateString("es-ES")}`, "", ""],
        [`Total usuarios analizados: ${kpis.totalUsuarios}`, "", ""],
        ["", "", ""],
        ["INDICADORES CLAVE DE SALUD", "", ""],
        ["Métrica", "Valor", "Descripción"],
        ["IMC Promedio", kpis.imcPromedio, "Índice de masa corporal promedio"],
        [
          "Usuarios Saludables",
          `${kpis.porcentajeSaludable}%`,
          "Porcentaje con IMC normal",
        ],
        [
          "Edad Promedio",
          `${kpis.edadPromedio} años`,
          "Edad promedio de usuarios",
        ],
        [
          "TMB Promedio",
          `${kpis.tmbPromedio} kcal`,
          "Tasa metabólica basal promedio",
        ],
      ];

      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen Salud");

      // Hoja 2: Distribución de IMC
      const imcData = [
        ["DISTRIBUCIÓN DE IMC", "USUARIOS", "PORCENTAJE"],
        ...Object.entries(imcDistribution).map(([categoria, cantidad]) => [
          categoria,
          cantidad,
          `${((cantidad / kpis.totalUsuarios) * 100).toFixed(1)}%`,
        ]),
      ];

      const imcSheet = XLSX.utils.aoa_to_sheet(imcData);
      XLSX.utils.book_append_sheet(workbook, imcSheet, "Distribución IMC");

      // Hoja 3: Objetivos de Entrenamiento
      const objetivosData = [
        ["OBJETIVO", "USUARIOS", "PORCENTAJE"],
        ...Object.entries(objetivosComunes).map(([objetivo, cantidad]) => [
          objetivo,
          cantidad,
          `${((cantidad / kpis.totalUsuarios) * 100).toFixed(1)}%`,
        ]),
      ];

      const objetivosSheet = XLSX.utils.aoa_to_sheet(objetivosData);
      XLSX.utils.book_append_sheet(workbook, objetivosSheet, "Objetivos");

      // Hoja 4: Métricas por Género
      if (Object.keys(metricasPorGenero).length > 0) {
        const generoData = [
          ["MÉTRICA", "FEMENINO", "MASCULINO", "DIFERENCIA"],
          [
            "IMC Promedio",
            metricasPorGenero.femenino?.imc?.toFixed(1) || "N/A",
            metricasPorGenero.masculino?.imc?.toFixed(1) || "N/A",
            metricasPorGenero.femenino?.imc && metricasPorGenero.masculino?.imc
              ? Math.abs(
                  metricasPorGenero.femenino.imc -
                    metricasPorGenero.masculino.imc
                ).toFixed(1)
              : "N/A",
          ],
          [
            "Peso Promedio (kg)",
            metricasPorGenero.femenino?.peso?.toFixed(1) || "N/A",
            metricasPorGenero.masculino?.peso?.toFixed(1) || "N/A",
            metricasPorGenero.femenino?.peso &&
            metricasPorGenero.masculino?.peso
              ? Math.abs(
                  metricasPorGenero.femenino.peso -
                    metricasPorGenero.masculino.peso
                ).toFixed(1)
              : "N/A",
          ],
          [
            "Altura Promedio (m)",
            metricasPorGenero.femenino?.altura?.toFixed(2) || "N/A",
            metricasPorGenero.masculino?.altura?.toFixed(2) || "N/A",
            metricasPorGenero.femenino?.altura &&
            metricasPorGenero.masculino?.altura
              ? Math.abs(
                  metricasPorGenero.femenino.altura -
                    metricasPorGenero.masculino.altura
                ).toFixed(2)
              : "N/A",
          ],
          [
            "Edad Promedio",
            metricasPorGenero.femenino?.edad?.toFixed(0) || "N/A",
            metricasPorGenero.masculino?.edad?.toFixed(0) || "N/A",
            metricasPorGenero.femenino?.edad &&
            metricasPorGenero.masculino?.edad
              ? Math.abs(
                  metricasPorGenero.femenino.edad -
                    metricasPorGenero.masculino.edad
                ).toFixed(0)
              : "N/A",
          ],
          [
            "TMB Promedio",
            metricasPorGenero.femenino?.tmb?.toFixed(0) || "N/A",
            metricasPorGenero.masculino?.tmb?.toFixed(0) || "N/A",
            metricasPorGenero.femenino?.tmb && metricasPorGenero.masculino?.tmb
              ? Math.abs(
                  metricasPorGenero.femenino.tmb -
                    metricasPorGenero.masculino.tmb
                ).toFixed(0)
              : "N/A",
          ],
        ];

        const generoSheet = XLSX.utils.aoa_to_sheet(generoData);
        XLSX.utils.book_append_sheet(
          workbook,
          generoSheet,
          "Métricas por Género"
        );
      }

      // Hoja 5: Evolución Temporal
      if (Object.keys(evolucionTemporal).length > 0) {
        const evolucionData = [
          ["MES", "NUEVOS USUARIOS"],
          ...Object.entries(evolucionTemporal)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([mes, cantidad]) => [mes, cantidad]),
        ];

        const evolucionSheet = XLSX.utils.aoa_to_sheet(evolucionData);
        XLSX.utils.book_append_sheet(
          workbook,
          evolucionSheet,
          "Evolución Temporal"
        );
      }

      // Hoja 6: Detalle de Usuarios
      const usuariosDetalle = usuarios
        .filter((u) => u.metricas)
        .map((u) => ({
          ID: u.id_usuario,
          Nombre: `${u.nombre} ${u.apellido_p} ${u.apellido_m || ""}`.trim(),
          Género: u.genero || "No especificado",
          Edad: u.edad,
          "Peso (kg)": u.peso,
          "Altura (m)": u.altura,
          IMC: u.metricas.imc?.toFixed(1) || "N/A",
          "Clasificación IMC": u.metricas.rango_imc || "N/A",
          TMB: u.metricas.tmb?.toFixed(0) || "N/A",
          "Grasa Corporal (%)":
            u.metricas.grasa_corporal_estimada?.toFixed(1) || "N/A",
          "Peso Ideal (kg)": u.metricas.peso_ideal || "N/A",
          Objetivo: u.objetivo || "No especificado",
          Categoría: u.categoria || "No especificado",
          "Fecha Registro": u.fecha_registro
            ? new Date(u.fecha_registro).toLocaleDateString("es-ES")
            : "N/A",
        }));

      if (usuariosDetalle.length > 0) {
        const detalleSheet = XLSX.utils.json_to_sheet(usuariosDetalle);
        XLSX.utils.book_append_sheet(
          workbook,
          detalleSheet,
          "Detalle Usuarios"
        );
      }

      // Aplicar estilos
      const sheets = workbook.SheetNames;
      sheets.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet["!cols"]) sheet["!cols"] = [];

        for (let i = 0; i < 15; i++) {
          if (!sheet["!cols"][i]) sheet["!cols"][i] = {};
          sheet["!cols"][i].wch = 15;
        }
      });

      const fileName = `reporte-salud-usuarios-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log("✅ Excel de salud exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al generar el archivo Excel.");
    }
  };

  const kpis = calculateHealthKPIs();
  const { metricasPorGenero } = processHealthData();

  return (
    <div className="relative z-10 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                <Heart className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Reporte de Salud
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Análisis integral del bienestar de usuarios
              </p>
            </div>
          </div>

          {/* Acciones de exportación */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToPDFSalud}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={loadUsuarios}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-yellow-400/25"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
              <Filter className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Filtros de Análisis
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Género
              </label>
              <select
                value={filtros.genero}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, genero: e.target.value }))
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Rango de Edad
              </label>
              <select
                value={filtros.rangoEdad}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, rangoEdad: e.target.value }))
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="todos">Todas las edades</option>
                <option value="18-25">18-25 años</option>
                <option value="26-35">26-35 años</option>
                <option value="36-45">36-45 años</option>
                <option value="46+">46+ años</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Categoría
              </label>
              <select
                value={filtros.categoria}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, categoria: e.target.value }))
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="todos">Todas</option>
                <option value="powerplate">PowerPlate</option>
                <option value="calistenia">Calistenia</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs de Salud */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <HealthKPICard
          title="IMC Promedio"
          value={kpis.imcPromedio}
          subtitle="Índice masa corporal"
          icon={Scale}
          color="yellow"
          loading={loading}
        />
        <HealthKPICard
          title="Usuarios Saludables"
          value={kpis.porcentajeSaludable}
          unit="%"
          subtitle="Con IMC normal"
          icon={Heart}
          color="green"
          loading={loading}
          trend="+5% vs mes anterior"
        />
        <HealthKPICard
          title="Edad Promedio"
          value={kpis.edadPromedio}
          unit=" años"
          subtitle="Edad de usuarios"
          icon={Calendar}
          color="blue"
          loading={loading}
        />
        <HealthKPICard
          title="TMB Promedio"
          value={kpis.tmbPromedio}
          unit=" kcal"
          subtitle="Tasa metabólica basal"
          icon={Activity}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HealthChartCard
          title="Distribución de IMC"
          loading={loading}
          icon={PieChart}
        >
          <canvas ref={imcChartRef}></canvas>
        </HealthChartCard>

        <HealthChartCard
          title="Objetivos Más Comunes"
          loading={loading}
          icon={Target}
        >
          <canvas ref={objetivosChartRef}></canvas>
        </HealthChartCard>
      </div>

      {/* Evolución temporal y métricas por género */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HealthChartCard
          title="Evolución de Registros"
          loading={loading}
          icon={TrendingUp}
        >
          <canvas ref={evolucionChartRef}></canvas>
        </HealthChartCard>

        <MetricasGeneroTable
          data={{
            femenino: metricasPorGenero.femenino || {
              imc: 0,
              peso: 0,
              altura: 0,
              edad: 0,
              tmb: 0,
            },
            masculino: metricasPorGenero.masculino || {
              imc: 0,
              peso: 0,
              altura: 0,
              edad: 0,
              tmb: 0,
            },
          }}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ReporteSaludUsuarios;
