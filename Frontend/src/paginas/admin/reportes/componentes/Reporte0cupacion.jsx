import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Filter,
  Clock,
  Activity,
  Target,
  AlertTriangle,
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
  TimeScale,
  Filler
);

// Importar servicios
import ReservaService from "../../../../services/reservas";
import { equipoService } from "../../../../services/equipos";
import { horarioService } from "../../../../services/horarios";

// Componente para KPIs
const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "yellow",
  trend = null,
  loading = false,
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
          <p className="text-xl font-bold text-white">{value}</p>
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
const ChartCard = ({
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
          <p className="text-gray-400 text-sm">Análisis de ocupación</p>
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

// Componente Heatmap personalizado
const HeatmapCard = ({ data, loading }) => {
  const dias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  const horas = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const getIntensity = (dia, hora) => {
    const key = `${dia}-${hora}`;
    const count = data[key] || 0;
    const maxCount = Math.max(...Object.values(data));
    return maxCount > 0 ? count / maxCount : 0;
  };

  const getColor = (intensity) => {
    if (intensity === 0) return "bg-gray-800";
    if (intensity <= 0.3) return "bg-blue-900/50";
    if (intensity <= 0.6) return "bg-yellow-600/70";
    return "bg-yellow-400";
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 104 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-700 rounded"></div>
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
          <Activity className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            Mapa de Calor - Horarios
          </h3>
          <p className="text-gray-400 text-sm">
            Intensidad de ocupación por día y hora
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-max">
          {/* Header con horas */}
          <div></div>
          {horas.map((hora) => (
            <div
              key={hora}
              className="text-xs text-gray-400 text-center p-1 font-medium"
            >
              {hora}
            </div>
          ))}

          {/* Filas por día */}
          {dias.map((dia) => (
            <React.Fragment key={dia}>
              <div className="text-xs text-gray-400 text-right p-1 font-medium pr-2">
                {dia.slice(0, 3)}
              </div>
              {horas.map((hora) => {
                const intensity = getIntensity(dia, hora);
                const count = data[`${dia}-${hora}`] || 0;
                return (
                  <div
                    key={`${dia}-${hora}`}
                    className={`h-8 rounded ${getColor(
                      intensity
                    )} hover:ring-2 hover:ring-yellow-400 transition-all cursor-pointer group relative`}
                    title={`${dia} ${hora}: ${count} reservas`}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded z-10">
                      {count}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-800 rounded"></div>
          <div className="w-3 h-3 bg-blue-900/50 rounded"></div>
          <div className="w-3 h-3 bg-yellow-600/70 rounded"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
        </div>
        <span>Más</span>
      </div>
    </div>
  );
};

const ReporteOcupacion = () => {
  const [data, setData] = useState({
    reservas: [],
    equipos: [],
    horarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    fin: new Date().toISOString().split("T")[0],
  });

  // Referencias para gráficos
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // Instancias de gráficos
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [reservasResult, equiposResult, horariosResult] =
        await Promise.allSettled([
          ReservaService.obtenerTodasLasReservas(),
          equipoService.getAll(),
          horarioService.getAll(),
        ]);

      const newData = {
        reservas:
          reservasResult.status === "fulfilled" && reservasResult.value.success
            ? reservasResult.value.data.reservas || []
            : [],
        equipos:
          equiposResult.status === "fulfilled" ? equiposResult.value || [] : [],
        horarios:
          horariosResult.status === "fulfilled"
            ? horariosResult.value || []
            : [],
      };

      setData(newData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Procesar datos para gráficos
  const processData = () => {
    if (!Array.isArray(data.reservas)) return {};

    // Filtrar por rango de fechas
    const reservasFiltradas = data.reservas.filter((r) => {
      const fechaReserva = r.horario_fecha;
      return fechaReserva >= dateRange.inicio && fechaReserva <= dateRange.fin;
    });

    // 1. Datos por día de la semana
    const diasSemana = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const ocupacionPorDia = diasSemana.reduce((acc, dia) => {
      acc[dia] = reservasFiltradas.filter((r) => {
        const fecha = new Date(r.horario_fecha + "T00:00:00");
        const diaSemana = fecha.toLocaleDateString("es", { weekday: "long" });
        return diaSemana.toLowerCase() === dia.toLowerCase();
      }).length;
      return acc;
    }, {});

    // 2. Datos para heatmap (día-hora)
    const heatmapData = {};
    reservasFiltradas.forEach((r) => {
      const fecha = new Date(r.horario_fecha + "T00:00:00");
      const dia = fecha.toLocaleDateString("es", { weekday: "long" });
      const hora = r.horario_hora_inicio.slice(0, 5); // "HH:MM"
      const key = `${dia}-${hora}`;
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    });

    // 3. Tendencia mensual
    const tendenciaMensual = {};
    reservasFiltradas.forEach((r) => {
      const fecha = new Date(r.horario_fecha);
      const mesAno = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;
      tendenciaMensual[mesAno] = (tendenciaMensual[mesAno] || 0) + 1;
    });

    // 4. Ocupación por equipo
    const ocupacionPorEquipo = {};
    reservasFiltradas.forEach((r) => {
      const equipo = r.equipo_nombre || "Sin equipo";
      ocupacionPorEquipo[equipo] = (ocupacionPorEquipo[equipo] || 0) + 1;
    });

    return {
      ocupacionPorDia,
      heatmapData,
      tendenciaMensual,
      ocupacionPorEquipo,
      totalReservas: reservasFiltradas.length,
    };
  };

  // Calcular KPIs
  const calculateKPIs = () => {
    const { totalReservas, ocupacionPorEquipo } = processData();
    const totalCapacidad = Array.isArray(data.horarios)
      ? data.horarios.reduce((acc, h) => acc + (h.capacidad || 0), 0)
      : 0;

    const tasaOcupacion =
      totalCapacidad > 0
        ? ((totalReservas / totalCapacidad) * 100).toFixed(1)
        : 0;

    const equipoMasUsado =
      Object.keys(ocupacionPorEquipo).length > 0
        ? Object.keys(ocupacionPorEquipo).reduce((a, b) =>
            ocupacionPorEquipo[a] > ocupacionPorEquipo[b] ? a : b
          )
        : "N/A";

    const reservasCanceladas = Array.isArray(data.reservas)
      ? data.reservas.filter((r) => r.estado === "cancelada").length
      : 0;

    const tasaCancelacion =
      totalReservas > 0
        ? ((reservasCanceladas / totalReservas) * 100).toFixed(1)
        : 0;

    return {
      tasaOcupacion,
      equipoMasUsado,
      tasaCancelacion,
      totalReservas,
    };
  };

  // Crear gráficos
  const createCharts = () => {
    const { ocupacionPorDia, tendenciaMensual } = processData();

    // Destruir gráficos existentes
    if (barChartInstance.current) barChartInstance.current.destroy();
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    // Gráfico de barras - Ocupación por día
    if (barChartRef.current && Object.keys(ocupacionPorDia).length > 0) {
      const ctx = barChartRef.current.getContext("2d");
      barChartInstance.current = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(ocupacionPorDia),
          datasets: [
            {
              label: "Reservas",
              data: Object.values(ocupacionPorDia),
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

    // Gráfico de líneas - Tendencia mensual
    if (lineChartRef.current && Object.keys(tendenciaMensual).length > 0) {
      const ctx = lineChartRef.current.getContext("2d");
      lineChartInstance.current = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: Object.keys(tendenciaMensual),
          datasets: [
            {
              label: "Reservas Mensuales",
              data: Object.values(tendenciaMensual),
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
  }, [loading, data, dateRange]);

  // Función mejorada para exportar PDF de Ocupación
  const exportToPDF = async () => {
    try {
      // Importar jsPDF dinámicamente
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdf = new jsPDF("p", "mm", "a4");
      const kpis = calculateKPIs();
      const { ocupacionPorDia, tendenciaMensual, ocupacionPorEquipo } =
        processData();

      // Configuración
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Función para agregar nueva página si es necesario
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
        // Intentar cargar el logo desde /templo.png
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.crossOrigin = "anonymous";
          logoImg.src = "/templo.png?" + new Date().getTime(); // Cache busting
        });

        // Si el logo se carga correctamente, agregarlo al PDF
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        ctx.drawImage(logoImg, 0, 0);
        const logoDataUrl = canvas.toDataURL("image/png");

        // Agregar logo grande en la parte superior
        const logoSize = 25; // Tamaño más grande
        pdf.addImage(logoDataUrl, "PNG", margin, yPosition, logoSize, logoSize);

        // Texto del logo al lado
        pdf.setFontSize(24);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Templo.Bol", margin + logoSize + 10, yPosition + 8);

        yPosition += logoSize + 10;
      } catch (error) {
        console.warn("No se pudo cargar el logo, usando texto alternativo");
        // Fallback sin logo
        pdf.setFontSize(24);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Templo.Bol", margin, yPosition);
        pdf.setFontSize(16);
        pdf.setTextColor(245, 158, 11);
        yPosition += 20;
      }

      // === TÍTULO DEL REPORTE ===
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40);
      const titulo = "REPORTE DE OCUPACIÓN";
      const tituloWidth = pdf.getTextWidth(titulo);
      pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition);

      yPosition += 8;
      pdf.setFontSize(14);
      pdf.setTextColor(245, 158, 11);
      const subtitulo = "Análisis detallado de la utilización de recursos";
      const subtituloWidth = pdf.getTextWidth(subtitulo);
      pdf.text(subtitulo, (pageWidth - subtituloWidth) / 2, yPosition);

      yPosition += 15;

      // === INFORMACIÓN DEL REPORTE ===
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generado: ${new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        margin,
        yPosition
      );

      const totalReservasText = `Total de reservas analizadas: ${kpis.totalReservas}`;
      const totalWidth = pdf.getTextWidth(totalReservasText);
      pdf.text(totalReservasText, pageWidth - margin - totalWidth, yPosition);

      yPosition += 15;

      // === FILTROS APLICADOS ===
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("FILTROS APLICADOS", margin, yPosition);

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);

      // Crear caja para filtros
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
        `• Período: ${dateRange.inicio} al ${dateRange.fin}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `• Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `• Estado de reservas: Todas (confirmadas, pendientes, canceladas)`,
        margin + 5,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `• Equipos incluidos: Todos los equipos disponibles`,
        margin + 5,
        yPosition
      );

      yPosition += 15;

      // === RESUMEN EJECUTIVO ===
      checkNewPage(30);
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("RESUMEN EJECUTIVO", margin, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      // Texto del resumen con análisis inteligente
      const resumenTexto = [
        `El análisis de ocupación de ${kpis.totalReservas} reservas revela una tasa de ocupación del ${kpis.tasaOcupacion}%,`,
        `indicando un ${
          kpis.tasaOcupacion > 70
            ? "alto"
            : kpis.tasaOcupacion > 50
            ? "moderado"
            : "bajo"
        } nivel de utilización de recursos.`,
        ``,
        `El equipo más utilizado es "${kpis.equipoMasUsado}", lo cual sugiere una alta demanda por este recurso.`,
        `La tasa de cancelación del ${kpis.tasaCancelacion}% se encuentra ${
          kpis.tasaCancelacion < 10
            ? "dentro de parámetros normales"
            : "por encima del promedio recomendado"
        }.`,
        ``,
        `Esta información proporciona una base sólida para la optimización de horarios y`,
        `la planificación de recursos futuros.`,
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

      yPosition += 10;

      // === INDICADORES CLAVE ===
      checkNewPage(50);
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("INDICADORES CLAVE DE RENDIMIENTO", margin, yPosition);
      yPosition += 12;

      // Crear tabla de KPIs con mejor diseño
      const kpiData = [
        [
          "Tasa de Ocupación",
          `${kpis.tasaOcupacion}%`,
          "Porcentaje de capacidad utilizada",
        ],
        [
          "Total de Reservas",
          `${kpis.totalReservas}`,
          "Reservas en el período analizado",
        ],
        [
          "Equipo Más Utilizado",
          `${kpis.equipoMasUsado}`,
          "Recurso con mayor demanda",
        ],
        [
          "Tasa de Cancelación",
          `${kpis.tasaCancelacion}%`,
          "Porcentaje de reservas canceladas",
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
      kpiData.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        pdf.setFillColor(...bgColor);
        pdf.rect(margin, yPosition, contentWidth, 7, "F");

        pdf.text(row[0], margin + 2, yPosition + 4);
        pdf.text(row[1], margin + 60, yPosition + 4);
        pdf.text(row[2], margin + 90, yPosition + 4);
        yPosition += 7;
      });

      yPosition += 10;

      // === ANÁLISIS POR DÍA DE LA SEMANA ===
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("OCUPACIÓN POR DÍA DE LA SEMANA", margin, yPosition);
      yPosition += 10;

      // Crear gráfico de barras simple en PDF
      const maxReservas = Math.max(...Object.values(ocupacionPorDia));
      const barWidth = 20;
      const barMaxHeight = 30;
      const chartStartX = margin + 10;
      let currentX = chartStartX;

      Object.entries(ocupacionPorDia).forEach(([dia, reservas]) => {
        const barHeight =
          maxReservas > 0 ? (reservas / maxReservas) * barMaxHeight : 0;

        // Dibujar barra
        pdf.setFillColor(245, 158, 11);
        pdf.rect(
          currentX,
          yPosition + barMaxHeight - barHeight,
          barWidth,
          barHeight,
          "F"
        );

        // Etiqueta del día
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const diaCorto = dia.slice(0, 3);
        const textWidth = pdf.getTextWidth(diaCorto);
        pdf.text(
          diaCorto,
          currentX + (barWidth - textWidth) / 2,
          yPosition + barMaxHeight + 5
        );

        // Valor
        pdf.setFontSize(7);
        pdf.text(
          reservas.toString(),
          currentX + (barWidth - pdf.getTextWidth(reservas.toString())) / 2,
          yPosition - 2
        );

        currentX += barWidth + 5;
      });

      yPosition += barMaxHeight + 15;

      // === TENDENCIA MENSUAL ===
      if (Object.keys(tendenciaMensual).length > 0) {
        checkNewPage(30);
        pdf.setFontSize(14);
        pdf.text("TENDENCIA MENSUAL", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text("Mes", margin, yPosition);
        pdf.text("Reservas", margin + 40, yPosition);
        pdf.text("Tendencia", margin + 80, yPosition);
        yPosition += 5;

        const mesesOrdenados = Object.keys(tendenciaMensual).sort();
        mesesOrdenados.forEach((mes, index) => {
          const reservas = tendenciaMensual[mes];
          let tendencia = "";

          if (index > 0) {
            const mesAnterior = tendenciaMensual[mesesOrdenados[index - 1]];
            const cambio = (
              ((reservas - mesAnterior) / mesAnterior) *
              100
            ).toFixed(1);
            tendencia = `${cambio > 0 ? "+" : ""}${cambio}%`;
          }

          pdf.setTextColor(60, 60, 60);
          pdf.text(mes, margin, yPosition);
          pdf.text(reservas.toString(), margin + 40, yPosition);
          pdf.setTextColor(cambio > 0 ? [34, 197, 94] : [239, 68, 68]);
          pdf.text(tendencia, margin + 80, yPosition);
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

      // Agregar pie de página a todas las páginas
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i);
      }

      // Guardar PDF
      pdf.save(
        `reporte-ocupacion-${new Date().toISOString().split("T")[0]}.pdf`
      );

      // Mostrar notificación de éxito
      console.log("✅ PDF de ocupación exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al generar el PDF. Asegúrate de tener conexión a internet.");
    }
  };

  const exportToExcel = async () => {
    try {
      // Importar SheetJS dinámicamente
      const XLSX = await import("xlsx");

      const kpis = calculateKPIs();
      const {
        ocupacionPorDia,
        tendenciaMensual,
        ocupacionPorEquipo,
        heatmapData,
      } = processData();

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Resumen Ejecutivo
      const resumenData = [
        ["REPORTE DE OCUPACIÓN - POWERPLATE", "", ""],
        [`Período: ${dateRange.inicio} al ${dateRange.fin}`, "", ""],
        [`Generado: ${new Date().toLocaleDateString("es-ES")}`, "", ""],
        ["", "", ""],
        ["INDICADORES CLAVE", "", ""],
        ["Métrica", "Valor", "Descripción"],
        [
          "Tasa de Ocupación",
          `${kpis.tasaOcupacion}%`,
          "Porcentaje de capacidad utilizada",
        ],
        ["Total Reservas", kpis.totalReservas, "Reservas en el período"],
        ["Equipo Más Usado", kpis.equipoMasUsado, "Recurso con mayor demanda"],
        [
          "Tasa de Cancelación",
          `${kpis.tasaCancelacion}%`,
          "Porcentaje de reservas canceladas",
        ],
      ];

      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

      // Hoja 2: Ocupación por Día
      const ocupacionDiaData = [
        ["DÍA DE LA SEMANA", "NÚMERO DE RESERVAS"],
        ...Object.entries(ocupacionPorDia).map(([dia, reservas]) => [
          dia,
          reservas,
        ]),
      ];

      const ocupacionDiaSheet = XLSX.utils.aoa_to_sheet(ocupacionDiaData);
      XLSX.utils.book_append_sheet(
        workbook,
        ocupacionDiaSheet,
        "Ocupación por Día"
      );

      // Hoja 3: Tendencia Mensual
      if (Object.keys(tendenciaMensual).length > 0) {
        const tendenciaData = [
          ["MES", "TOTAL RESERVAS"],
          ...Object.entries(tendenciaMensual).map(([mes, reservas]) => [
            mes,
            reservas,
          ]),
        ];

        const tendenciaSheet = XLSX.utils.aoa_to_sheet(tendenciaData);
        XLSX.utils.book_append_sheet(
          workbook,
          tendenciaSheet,
          "Tendencia Mensual"
        );
      }

      // Hoja 4: Ocupación por Equipo
      if (Object.keys(ocupacionPorEquipo).length > 0) {
        const equipoData = [
          ["EQUIPO", "NÚMERO DE RESERVAS", "PORCENTAJE"],
          ...Object.entries(ocupacionPorEquipo).map(([equipo, reservas]) => {
            const porcentaje =
              kpis.totalReservas > 0
                ? ((reservas / kpis.totalReservas) * 100).toFixed(1) + "%"
                : "0%";
            return [equipo, reservas, porcentaje];
          }),
        ];

        const equipoSheet = XLSX.utils.aoa_to_sheet(equipoData);
        XLSX.utils.book_append_sheet(
          workbook,
          equipoSheet,
          "Ocupación por Equipo"
        );
      }

      // Hoja 5: Detalle de Reservas
      const reservasDetalle = data.reservas
        .filter(
          (r) =>
            r.horario_fecha >= dateRange.inicio &&
            r.horario_fecha <= dateRange.fin
        )
        .map((r) => ({
          "ID Reserva": r.id_reserva,
          Cliente: `${r.usuario_nombre} ${r.usuario_apellido_p}`,
          Fecha: r.horario_fecha,
          "Hora Inicio": r.horario_hora_inicio,
          "Hora Fin": r.horario_hora_fin,
          Estado: r.estado,
          Entrenador: `${r.entrenador_nombre} ${r.entrenador_apellido_p}`,
          Equipo: r.equipo_nombre,
          Tipo: r.horario_tipo,
          Comentarios: r.comentarios || "Sin comentarios",
        }));

      if (reservasDetalle.length > 0) {
        const detalleSheet = XLSX.utils.json_to_sheet(reservasDetalle);
        XLSX.utils.book_append_sheet(
          workbook,
          detalleSheet,
          "Detalle Reservas"
        );
      }

      // Aplicar estilos básicos
      const sheets = workbook.SheetNames;
      sheets.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet["!cols"]) sheet["!cols"] = [];

        // Ajustar ancho de columnas
        for (let i = 0; i < 10; i++) {
          if (!sheet["!cols"][i]) sheet["!cols"][i] = {};
          sheet["!cols"][i].wch = 15;
        }
      });

      // Guardar archivo
      const fileName = `reporte-ocupacion-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      // Mostrar notificación de éxito
      console.log("✅ Excel exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert(
        "Error al generar el archivo Excel. Asegúrate de tener conexión a internet."
      );
    }
  };

  const kpis = calculateKPIs();
  const { heatmapData } = processData();

  return (
    <div className="relative z-10 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                <BarChart3 className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Reporte de Ocupación
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Análisis detallado de la utilización de recursos
              </p>
            </div>
          </div>

          {/* Acciones de exportación */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToPDF}
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
              onClick={loadData}
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

        {/* Filtros de fecha */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
              <Filter className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">Filtros de Fecha</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.inicio}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, inicio: e.target.value }))
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.fin}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, fin: e.target.value }))
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Tasa de Ocupación"
          value={`${kpis.tasaOcupacion}%`}
          subtitle="Capacidad utilizada"
          icon={Target}
          color="yellow"
          loading={loading}
          trend="+8% vs mes anterior"
        />
        <KPICard
          title="Total Reservas"
          value={kpis.totalReservas}
          subtitle="En el período"
          icon={Calendar}
          color="blue"
          loading={loading}
        />
        <KPICard
          title="Equipo Más Usado"
          value={kpis.equipoMasUsado}
          subtitle="Mayor demanda"
          icon={Activity}
          color="green"
          loading={loading}
        />
        <KPICard
          title="Tasa Cancelación"
          value={`${kpis.tasaCancelacion}%`}
          subtitle="Reservas canceladas"
          icon={AlertTriangle}
          color="red"
          loading={loading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Ocupación por Día de la Semana"
          loading={loading}
          icon={BarChart3}
        >
          <canvas ref={barChartRef}></canvas>
        </ChartCard>

        <ChartCard
          title="Tendencia Mensual"
          loading={loading}
          icon={TrendingUp}
        >
          <canvas ref={lineChartRef}></canvas>
        </ChartCard>
      </div>

      {/* Heatmap */}
      <HeatmapCard data={heatmapData} loading={loading} />
    </div>
  );
};

export default ReporteOcupacion;
