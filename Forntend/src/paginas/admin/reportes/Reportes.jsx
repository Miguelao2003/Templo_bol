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
  Users,
  Heart,
  Scale,
  PieChart,
  ChevronRight,
  BarChart4,
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
  ArcElement,
  DoughnutController,
  BarController,
  PieController,
} from "chart.js";
import "chartjs-adapter-date-fns";

// Importar servicios
import ReservaService from "../../../services/reservas";
import { equipoService } from "../../../services/equipos";
import { horarioService } from "../../../services/horarios";
import { userService } from "../../../services/usuarios";

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
  Filler,
  ArcElement,
  DoughnutController,
  BarController,
  PieController
);

// ===== COMPONENTES AUXILIARES =====

// Función robusta para cargar logo desde public folder
const loadLogoFromPublic = async () => {
  const logoSources = [
    "/templo.png",
    "/logo.png",
    "/assets/templo.png",
    "/assets/logo.png",
    "/images/templo.png",
    "/images/logo.png",
  ];

  for (const src of logoSources) {
    try {
      console.log(`🔍 Intentando cargar logo desde: ${src}`);
      const response = await fetch(src, {
        method: "GET",
        cache: "no-cache",
      });

      if (response.ok && response.status === 200) {
        const blob = await response.blob();
        if (blob.size > 0 && blob.type.startsWith("image/")) {
          console.log(`✅ Logo cargado exitosamente desde: ${src}`);
          console.log(`📊 Tamaño: ${blob.size} bytes, Tipo: ${blob.type}`);

          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => {
              console.error("❌ Error al convertir blob a base64");
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        } else {
          console.warn(
            `⚠️ Archivo encontrado pero inválido: ${src} (${blob.size} bytes, ${blob.type})`
          );
        }
      } else {
        console.warn(
          `⚠️ Respuesta no válida desde ${src}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.warn(`❌ No se pudo cargar logo desde ${src}:`, error.message);
    }
  }

  console.log("📋 No se encontró ningún logo, usando fallback de solo texto");
  return null;
};

// Función para agregar header con logo al PDF
const addPDFHeaderOcupacion = async (pdf, yPosition, margin, pageWidth) => {
  try {
    const logoDataUrl = await loadLogoFromPublic();

    if (logoDataUrl) {
      const logoSize = 25;
      pdf.addImage(logoDataUrl, "PNG", margin, yPosition, logoSize, logoSize);

      // Texto junto al logo
      pdf.setFontSize(24);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Templo.Bol", margin + logoSize + 10, yPosition + 8);

      console.log("🖼️ Header con logo agregado exitosamente al PDF");
      return yPosition + logoSize + 10;
    } else {
      // Fallback: solo texto sin logo
      console.log("📝 Sin logo disponible, usando solo texto");
      pdf.setFontSize(28);
      pdf.setTextColor(40, 40, 40);
      pdf.text("TEMPLO.BOL", margin, yPosition);

      return yPosition + 25;
    }
  } catch (error) {
    console.error("❌ Error al agregar header:", error);

    // Fallback completo
    pdf.setFontSize(28);
    pdf.setTextColor(40, 40, 40);
    pdf.text("TEMPLO.BOL", margin, yPosition);

    return yPosition + 25;
  }
};

// Componente para KPIs genérico
const KPICard = ({
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
const ChartCard = ({
  title,
  children,
  loading = false,
  icon: Icon = BarChart3,
  onExport,
  subtitle = "Análisis de datos",
}) => (
  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm">{subtitle}</p>
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

// Componente Heatmap para ocupación
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
          <div></div>
          {horas.map((hora) => (
            <div
              key={hora}
              className="text-xs text-gray-400 text-center p-1 font-medium"
            >
              {hora}
            </div>
          ))}

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
                {data.femenino.imc?.toFixed(1) || "N/A"}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.imc?.toFixed(1) || "N/A"}
              </td>
              <td className="py-3 text-center text-gray-300">
                {data.femenino.imc && data.masculino.imc
                  ? Math.abs(data.femenino.imc - data.masculino.imc).toFixed(1)
                  : "N/A"}
              </td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">
                Peso Promedio (kg)
              </td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.peso?.toFixed(1) || "N/A"}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.peso?.toFixed(1) || "N/A"}
              </td>
              <td className="py-3 text-center text-gray-300">
                {data.femenino.peso && data.masculino.peso
                  ? Math.abs(data.femenino.peso - data.masculino.peso).toFixed(
                      1
                    )
                  : "N/A"}
              </td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">
                Altura Promedio (m)
              </td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.altura?.toFixed(2) || "N/A"}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.altura?.toFixed(2) || "N/A"}
              </td>
              <td className="py-3 text-center text-gray-300">
                {data.femenino.altura && data.masculino.altura
                  ? Math.abs(
                      data.femenino.altura - data.masculino.altura
                    ).toFixed(2)
                  : "N/A"}
              </td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">Edad Promedio</td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.edad?.toFixed(0) || "N/A"}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.edad?.toFixed(0) || "N/A"}
              </td>
              <td className="py-3 text-center text-gray-300">
                {data.femenino.edad && data.masculino.edad
                  ? Math.abs(data.femenino.edad - data.masculino.edad).toFixed(
                      0
                    )
                  : "N/A"}
              </td>
            </tr>
            <tr className="hover:bg-gray-800/50">
              <td className="py-3 text-white font-medium">TMB Promedio</td>
              <td className="py-3 text-center text-pink-300">
                {data.femenino.tmb?.toFixed(0) || "N/A"}
              </td>
              <td className="py-3 text-center text-blue-300">
                {data.masculino.tmb?.toFixed(0) || "N/A"}
              </td>
              <td className="py-3 text-center text-gray-300">
                {data.femenino.tmb && data.masculino.tmb
                  ? Math.abs(data.femenino.tmb - data.masculino.tmb).toFixed(0)
                  : "N/A"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====

const Reportes = () => {
  // ===== ESTADOS =====
  const [tipoReporte, setTipoReporte] = useState("ocupacion"); // 'ocupacion' o 'salud'
  const [loading, setLoading] = useState(false);

  // Estados para datos de ocupación
  const [dataOcupacion, setDataOcupacion] = useState({
    reservas: [],
    equipos: [],
    horarios: [],
  });
  const [dateRange, setDateRange] = useState({
    inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    fin: new Date().toISOString().split("T")[0],
  });

  // Estados para datos de salud
  const [usuarios, setUsuarios] = useState([]);
  const [filtrosSalud, setFiltrosSalud] = useState({
    genero: "todos",
    rangoEdad: "todos",
    categoria: "todos",
  });

  // ===== REFERENCIAS PARA GRÁFICOS =====
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const imcChartRef = useRef(null);
  const objetivosChartRef = useRef(null);
  const evolucionChartRef = useRef(null);

  // Instancias de gráficos
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);
  const imcChartInstance = useRef(null);
  const objetivosChartInstance = useRef(null);
  const evolucionChartInstance = useRef(null);

  // ===== FUNCIONES DE CARGA DE DATOS =====

  // Función para cargar datos de ocupación
  const loadDataOcupacion = async () => {
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

      setDataOcupacion(newData);
    } catch (error) {
      console.error("Error al cargar datos de ocupación:", error);
      setDataOcupacion({ reservas: [], equipos: [], horarios: [] });
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar datos de salud
  const loadDataSalud = async () => {
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

  // ===== EFECTOS =====

  // Cargar datos según el tipo de reporte
  // Cargar datos según el tipo de reporte
  useEffect(() => {
    if (tipoReporte === "ocupacion") {
      loadDataOcupacion();
    } else {
      loadDataSalud();
    }

    // Probar carga del logo al inicializar
    loadLogoFromPublic().then((logoUrl) => {
      if (logoUrl) {
        console.log("✅ Logo disponible para PDFs en Reportes.jsx");
      } else {
        console.log("❌ Logo no disponible, se usará fallback en PDFs");
      }
    });
  }, [tipoReporte]);

  // Crear gráficos cuando cambien los datos
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(createCharts, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, tipoReporte, dataOcupacion, dateRange, usuarios, filtrosSalud]);

  // ===== FUNCIONES DE PROCESAMIENTO DE DATOS =====

  // Procesamiento de datos de ocupación
  const processOcupacionData = () => {
    if (!Array.isArray(dataOcupacion.reservas)) return {};

    const reservasFiltradas = dataOcupacion.reservas.filter((r) => {
      const fechaReserva = r.horario_fecha;
      return fechaReserva >= dateRange.inicio && fechaReserva <= dateRange.fin;
    });

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

    const heatmapData = {};
    reservasFiltradas.forEach((r) => {
      const fecha = new Date(r.horario_fecha + "T00:00:00");
      const dia = fecha.toLocaleDateString("es", { weekday: "long" });
      const hora = r.horario_hora_inicio.slice(0, 5);
      const key = `${dia}-${hora}`;
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    });

    const tendenciaMensual = {};
    reservasFiltradas.forEach((r) => {
      const fecha = new Date(r.horario_fecha);
      const mesAno = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;
      tendenciaMensual[mesAno] = (tendenciaMensual[mesAno] || 0) + 1;
    });

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

  // Procesamiento de datos de salud
  const processSaludData = () => {
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return {
        imcDistribution: {},
        metricasPorGenero: { femenino: {}, masculino: {} },
        objetivosComunes: {},
        evolucionTemporal: {},
        totalUsuarios: 0,
      };
    }

    let usuariosFiltrados = usuarios.filter((u) => u.metricas);

    if (filtrosSalud.genero !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter(
        (u) =>
          u.genero &&
          u.genero.toLowerCase() === filtrosSalud.genero.toLowerCase()
      );
    }

    if (filtrosSalud.categoria !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter(
        (u) => u.categoria === filtrosSalud.categoria
      );
    }

    if (filtrosSalud.rangoEdad !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter((u) => {
        const edad = u.edad;
        switch (filtrosSalud.rangoEdad) {
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

    const imcDistribution = usuariosFiltrados.reduce((acc, user) => {
      if (user.metricas && user.metricas.rango_imc) {
        const rango = user.metricas.rango_imc;
        acc[rango] = (acc[rango] || 0) + 1;
      }
      return acc;
    }, {});

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
            metricas.reduce((sum, m) => sum + (parseFloat(m.imc) || 0), 0) /
            metricas.length,
          peso: users.reduce((sum, u) => sum + (u.peso || 0), 0) / users.length,
          altura:
            users.reduce((sum, u) => sum + (parseFloat(u.altura) || 0), 0) /
            users.length,
          edad: users.reduce((sum, u) => sum + (u.edad || 0), 0) / users.length,
          tmb:
            metricas.reduce((sum, m) => sum + (m.tmb || 0), 0) /
            metricas.length,
          count: users.length,
        };
      }
    });

    const objetivosComunes = usuariosFiltrados.reduce((acc, user) => {
      if (user.objetivo) {
        acc[user.objetivo] = (acc[user.objetivo] || 0) + 1;
      }
      return acc;
    }, {});

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

  // ===== FUNCIONES DE CÁLCULO DE KPIs =====

  // KPIs para ocupación
  const calculateOcupacionKPIs = () => {
    const { totalReservas, ocupacionPorEquipo } = processOcupacionData();
    const totalCapacidad = Array.isArray(dataOcupacion.horarios)
      ? dataOcupacion.horarios.reduce((acc, h) => acc + (h.capacidad || 0), 0)
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

    const reservasCanceladas = Array.isArray(dataOcupacion.reservas)
      ? dataOcupacion.reservas.filter((r) => r.estado === "cancelada").length
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

  // KPIs para salud
  const calculateSaludKPIs = () => {
    const { totalUsuarios, metricasPorGenero, imcDistribution } =
      processSaludData();

    const todosUsuarios = usuarios.filter((u) => u.metricas && u.metricas.imc);
    const imcPromedio =
      todosUsuarios.length > 0
        ? todosUsuarios.reduce(
            (sum, u) => sum + parseFloat(u.metricas.imc),
            0
          ) / todosUsuarios.length
        : 0;

    const usuariosSaludables = imcDistribution["Normal"] || 0;
    const porcentajeSaludable =
      totalUsuarios > 0
        ? ((usuariosSaludables / totalUsuarios) * 100).toFixed(1)
        : 0;

    const edadPromedio =
      usuarios.length > 0
        ? usuarios.reduce((sum, u) => sum + (u.edad || 0), 0) / usuarios.length
        : 0;

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

  // ===== FUNCIONES DE CREACIÓN DE GRÁFICOS =====

  // Crear gráficos
  const createCharts = () => {
    // Destruir gráficos existentes
    [
      barChartInstance,
      lineChartInstance,
      imcChartInstance,
      objetivosChartInstance,
      evolucionChartInstance,
    ].forEach((chart) => {
      if (chart.current) chart.current.destroy();
    });

    if (tipoReporte === "ocupacion") {
      const { ocupacionPorDia, tendenciaMensual } = processOcupacionData();

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
    } else {
      const { imcDistribution, objetivosComunes, evolucionTemporal } =
        processSaludData();

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
                    const total = context.dataset.data.reduce(
                      (a, b) => a + b,
                      0
                    );
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
      if (
        objetivosChartRef.current &&
        Object.keys(objetivosComunes).length > 0
      ) {
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
    }
  };

  // ===== FUNCIONES DE EXPORTACIÓN MEJORADAS =====

  // Exportación mejorada a PDF para ocupación
  const exportOcupacionToPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const kpis = calculateOcupacionKPIs();
      const { ocupacionPorDia, tendenciaMensual, ocupacionPorEquipo } =
        processOcupacionData();

      const pdf = new jsPDF("p", "mm", "a4");
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 7;

      // Función para verificar si necesitamos nueva página
      const checkNewPage = (neededSpace = 20) => {
        if (yPosition + neededSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Función para agregar línea separadora
      const addSeparator = () => {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      };

      // ========== PORTADA ==========
      // Título principal
      // ========== HEADER CON LOGO ==========
      yPosition = await addPDFHeaderOcupacion(
        pdf,
        yPosition,
        margin,
        pageWidth
      );

      // ========== TÍTULO DEL REPORTE ==========
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40);
      const titulo = "REPORTE DE OCUPACIÓN";
      const tituloWidth = pdf.getTextWidth(titulo);
      pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition);

      // Información del reporte
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Período de análisis: ${dateRange.inicio} al ${dateRange.fin}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 8;
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 30;

      addSeparator();

      // ========== RESUMEN EJECUTIVO ==========
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text("RESUMEN EJECUTIVO", margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);

      // Crear un resumen ejecutivo más detallado
      const totalDias = Math.ceil(
        (new Date(dateRange.fin) - new Date(dateRange.inicio)) /
          (1000 * 60 * 60 * 24)
      );
      const promedioDiario =
        totalDias > 0 ? (kpis.totalReservas / totalDias).toFixed(1) : 0;

      const resumenTexto = [
        `Durante el período analizado (${totalDias} días), se registraron un total de ${kpis.totalReservas} reservas,`,
        `lo que representa un promedio de ${promedioDiario} reservas por día. La tasa de ocupación`,
        `general alcanzó el ${kpis.tasaOcupacion}%, indicando un ${
          parseFloat(kpis.tasaOcupacion) > 70
            ? "alto"
            : parseFloat(kpis.tasaOcupacion) > 50
            ? "moderado"
            : "bajo"
        } nivel de utilización`,
        `de las instalaciones.`,
        ``,
        `El equipo con mayor demanda fue "${kpis.equipoMasUsado}", mientras que la tasa de`,
        `cancelación se mantuvo en ${kpis.tasaCancelacion}%, ${
          parseFloat(kpis.tasaCancelacion) < 10
            ? "dentro de parámetros aceptables"
            : "requiriendo atención"
        }.`,
      ];

      resumenTexto.forEach((linea) => {
        if (linea === "") {
          yPosition += 5;
        } else {
          pdf.text(linea, margin, yPosition);
          yPosition += lineHeight;
        }
      });

      yPosition += 10;
      addSeparator();

      // ========== INDICADORES CLAVE ==========
      checkNewPage(60);

      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("INDICADORES CLAVE DE RENDIMIENTO (KPIs)", margin, yPosition);
      yPosition += 15;

      // Tabla de KPIs mejorada
      const kpiTableData = [
        {
          metrica: "Tasa de Ocupación General",
          valor: `${kpis.tasaOcupacion}%`,
          descripcion: "Porcentaje de capacidad total utilizada",
          estado:
            parseFloat(kpis.tasaOcupacion) > 70
              ? "Excelente"
              : parseFloat(kpis.tasaOcupacion) > 50
              ? "Bueno"
              : "Mejorable",
        },
        {
          metrica: "Total de Reservas",
          valor: kpis.totalReservas.toString(),
          descripcion: "Número total de reservas registradas",
          estado: "Información",
        },
        {
          metrica: "Promedio Diario",
          valor: promedioDiario,
          descripcion: "Reservas promedio por día",
          estado: "Información",
        },
        {
          metrica: "Equipo Más Demandado",
          valor: kpis.equipoMasUsado,
          descripcion: "Recurso con mayor utilización",
          estado: "Información",
        },
        {
          metrica: "Tasa de Cancelación",
          valor: `${kpis.tasaCancelacion}%`,
          descripcion: "Porcentaje de reservas canceladas",
          estado:
            parseFloat(kpis.tasaCancelacion) < 10
              ? "Excelente"
              : parseFloat(kpis.tasaCancelacion) < 20
              ? "Aceptable"
              : "Requiere atención",
        },
      ];

      // Encabezados de tabla
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(40, 40, 40);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

      pdf.text("MÉTRICA", margin + 2, yPosition + 5);
      pdf.text("VALOR", margin + 60, yPosition + 5);
      pdf.text("DESCRIPCIÓN", margin + 85, yPosition + 5);
      pdf.text("ESTADO", margin + 140, yPosition + 5);
      yPosition += 8;

      // Datos de la tabla
      pdf.setTextColor(60, 60, 60);
      kpiTableData.forEach((row, index) => {
        // Alternar colores de fila
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
        }

        pdf.setFontSize(9);
        pdf.text(row.metrica, margin + 2, yPosition + 5);
        pdf.text(row.valor, margin + 60, yPosition + 5);
        pdf.text(row.descripcion, margin + 85, yPosition + 5);

        // Color del estado
        switch (row.estado) {
          case "Excelente":
            pdf.setTextColor(0, 150, 0);
            break;
          case "Bueno":
          case "Aceptable":
            pdf.setTextColor(200, 150, 0);
            break;
          case "Mejorable":
          case "Requiere atención":
            pdf.setTextColor(200, 0, 0);
            break;
          default:
            pdf.setTextColor(60, 60, 60);
        }

        pdf.text(row.estado, margin + 140, yPosition + 5);
        pdf.setTextColor(60, 60, 60);
        yPosition += 8;
      });

      yPosition += 15;
      addSeparator();

      // ========== ANÁLISIS POR DÍA DE LA SEMANA ==========
      checkNewPage(80);

      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("ANÁLISIS POR DÍA DE LA SEMANA", margin, yPosition);
      yPosition += 15;

      // Tabla detallada de ocupación por día
      const diasData = Object.entries(ocupacionPorDia);
      const totalSemanal = diasData.reduce(
        (sum, [_, reservas]) => sum + reservas,
        0
      );

      // Encabezados
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(40, 40, 40);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

      pdf.text("DÍA DE LA SEMANA", margin + 2, yPosition + 5);
      pdf.text("RESERVAS", margin + 60, yPosition + 5);
      pdf.text("PORCENTAJE", margin + 90, yPosition + 5);
      pdf.text("TENDENCIA", margin + 120, yPosition + 5);
      pdf.text("RECOMENDACIÓN", margin + 150, yPosition + 5);
      yPosition += 8;

      // Datos por día
      pdf.setTextColor(60, 60, 60);
      diasData.forEach(([dia, reservas], index) => {
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
        }

        const porcentaje =
          totalSemanal > 0 ? ((reservas / totalSemanal) * 100).toFixed(1) : 0;
        const promedio = totalSemanal / 7;
        let tendencia =
          reservas > promedio * 1.2
            ? "Alta"
            : reservas < promedio * 0.8
            ? "Baja"
            : "Normal";
        let recomendacion =
          reservas > promedio * 1.2
            ? "Aumentar capacidad"
            : reservas < promedio * 0.8
            ? "Promocionar"
            : "Mantener";

        pdf.setFontSize(9);
        pdf.text(dia, margin + 2, yPosition + 5);
        pdf.text(reservas.toString(), margin + 60, yPosition + 5);
        pdf.text(`${porcentaje}%`, margin + 90, yPosition + 5);

        // Color de tendencia
        if (tendencia === "Alta") pdf.setTextColor(0, 150, 0);
        else if (tendencia === "Baja") pdf.setTextColor(200, 0, 0);
        else pdf.setTextColor(200, 150, 0);

        pdf.text(tendencia, margin + 120, yPosition + 5);
        pdf.setTextColor(60, 60, 60);
        pdf.text(recomendacion, margin + 150, yPosition + 5);
        yPosition += 8;
      });

      yPosition += 15;

      // Insights del análisis semanal
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Insights del Análisis Semanal:", margin, yPosition);
      yPosition += 10;

      const diaMasOcupado = diasData.reduce((max, current) =>
        current[1] > max[1] ? current : max
      );
      const diaMenosOcupado = diasData.reduce((min, current) =>
        current[1] < min[1] ? current : min
      );

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const insights = [
        `• El día más ocupado es ${diaMasOcupado[0]} con ${diaMasOcupado[1]} reservas`,
        `• El día menos ocupado es ${diaMenosOcupado[0]} con ${diaMenosOcupado[1]} reservas`,
        `• Diferencia entre día más y menos ocupado: ${
          diaMasOcupado[1] - diaMenosOcupado[1]
        } reservas`,
        `• Promedio semanal: ${(totalSemanal / 7).toFixed(1)} reservas por día`,
      ];

      insights.forEach((insight) => {
        pdf.text(insight, margin, yPosition);
        yPosition += lineHeight;
      });

      yPosition += 10;
      addSeparator();

      // ========== ANÁLISIS DE EQUIPOS ==========
      if (Object.keys(ocupacionPorEquipo).length > 0) {
        checkNewPage(60);

        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text("ANÁLISIS DE UTILIZACIÓN POR EQUIPO", margin, yPosition);
        yPosition += 15;

        const equiposOrdenados = Object.entries(ocupacionPorEquipo).sort(
          ([, a], [, b]) => b - a
        );

        // Encabezados
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(40, 40, 40);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

        pdf.text("EQUIPO", margin + 2, yPosition + 5);
        pdf.text("RESERVAS", margin + 70, yPosition + 5);
        pdf.text("% DEL TOTAL", margin + 100, yPosition + 5);
        pdf.text("RANKING", margin + 130, yPosition + 5);
        pdf.text("ESTADO", margin + 155, yPosition + 5);
        yPosition += 8;

        // Datos de equipos
        pdf.setTextColor(60, 60, 60);
        equiposOrdenados.forEach(([equipo, reservas], index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
          }

          const porcentaje = ((reservas / kpis.totalReservas) * 100).toFixed(1);
          const ranking = `#${index + 1}`;
          const promedio = kpis.totalReservas / equiposOrdenados.length;
          const estado =
            reservas > promedio * 1.5
              ? "Muy alta demanda"
              : reservas > promedio
              ? "Alta demanda"
              : reservas > promedio * 0.5
              ? "Demanda normal"
              : "Baja demanda";

          pdf.setFontSize(9);
          pdf.text(
            equipo.length > 25 ? equipo.substring(0, 25) + "..." : equipo,
            margin + 2,
            yPosition + 5
          );
          pdf.text(reservas.toString(), margin + 70, yPosition + 5);
          pdf.text(`${porcentaje}%`, margin + 100, yPosition + 5);
          pdf.text(ranking, margin + 130, yPosition + 5);

          // Color del estado
          if (estado.includes("Muy alta")) pdf.setTextColor(200, 0, 0);
          else if (estado.includes("Alta")) pdf.setTextColor(200, 100, 0);
          else if (estado.includes("normal")) pdf.setTextColor(0, 150, 0);
          else pdf.setTextColor(150, 150, 150);

          pdf.text(estado, margin + 155, yPosition + 5);
          pdf.setTextColor(60, 60, 60);
          yPosition += 8;
        });
      }

      yPosition += 15;

      yPosition += 15;

      // ========== PIE DE PÁGINA EN ÚLTIMA PÁGINA ==========
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        "Reporte generado automáticamente por PowerPlate Management System",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Guardar PDF
      pdf.save(
        `reporte-ocupacion-detallado-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      console.log("✅ PDF detallado exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al generar el PDF. Asegúrate de tener conexión a internet.");
    }
  };

  // Exportación mejorada a PDF para salud
  const exportSaludToPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const kpis = calculateSaludKPIs();
      const {
        imcDistribution,
        objetivosComunes,
        metricasPorGenero,
        evolucionTemporal,
      } = processSaludData();

      const pdf = new jsPDF("p", "mm", "a4");
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 7;

      // Función para verificar si necesitamos nueva página
      const checkNewPage = (neededSpace = 20) => {
        if (yPosition + neededSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Función para agregar línea separadora
      const addSeparator = () => {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      };

      // ========== PORTADA ==========
      // ========== HEADER CON LOGO ==========
      yPosition = await addPDFHeaderOcupacion(
        pdf,
        yPosition,
        margin,
        pageWidth
      );

      // ========== TÍTULO DEL REPORTE ==========
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40);
      const titulo = "REPORTE DE SALUD DE USUARIOS";
      const tituloWidth = pdf.getTextWidth(titulo);
      pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPosition);
      yPosition += 15;

      pdf.setFontSize(20);
      pdf.setTextColor(245, 158, 11);
      yPosition += 20;

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 8;
      pdf.text(
        `Total de usuarios analizados: ${kpis.totalUsuarios}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 30;

      addSeparator();

      // ========== RESUMEN EJECUTIVO ==========
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text("RESUMEN EJECUTIVO DE SALUD", margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);

      const resumenSalud = [
        `El análisis de salud de ${kpis.totalUsuarios} usuarios revela un IMC promedio de ${kpis.imcPromedio},`,
        `indicando un estado de salud general ${
          parseFloat(kpis.imcPromedio) < 25
            ? "saludable"
            : "que requiere atención"
        }.`,
        `El ${kpis.porcentajeSaludable}% de los usuarios mantienen un IMC dentro del rango normal,`,
        `lo cual ${
          parseFloat(kpis.porcentajeSaludable) > 70
            ? "refleja una comunidad saludable"
            : "sugiere oportunidades de mejora"
        }.`,
        ``,
        `La edad promedio de ${kpis.edadPromedio} años y la tasa metabólica basal promedio`,
        `de ${kpis.tmbPromedio} kcal proporcionan una base sólida para programas personalizados.`,
      ];

      resumenSalud.forEach((linea) => {
        if (linea === "") {
          yPosition += 5;
        } else {
          pdf.text(linea, margin, yPosition);
          yPosition += lineHeight;
        }
      });

      yPosition += 10;
      addSeparator();

      // ========== INDICADORES CLAVE DE SALUD ==========
      checkNewPage(80);

      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("INDICADORES CLAVE DE SALUD", margin, yPosition);
      yPosition += 15;

      const healthKpiData = [
        {
          metrica: "Índice de Masa Corporal Promedio",
          valor: kpis.imcPromedio,
          descripcion: "IMC general de la población",
          estado:
            parseFloat(kpis.imcPromedio) < 18.5
              ? "Bajo peso"
              : parseFloat(kpis.imcPromedio) <= 24.9
              ? "Normal"
              : parseFloat(kpis.imcPromedio) <= 29.9
              ? "Sobrepeso"
              : "Obesidad",
        },
        {
          metrica: "Usuarios con IMC Saludable",
          valor: `${kpis.porcentajeSaludable}%`,
          descripcion: "Porcentaje en rango normal",
          estado:
            parseFloat(kpis.porcentajeSaludable) > 70
              ? "Excelente"
              : parseFloat(kpis.porcentajeSaludable) > 50
              ? "Bueno"
              : "Requiere mejora",
        },
        {
          metrica: "Edad Promedio de Usuarios",
          valor: `${kpis.edadPromedio} años`,
          descripcion: "Demografía de la población",
          estado: "Información",
        },
        {
          metrica: "Tasa Metabólica Basal Promedio",
          valor: `${kpis.tmbPromedio} kcal`,
          descripcion: "Metabolismo basal diario",
          estado: "Información",
        },
      ];

      // Tabla de KPIs de salud
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(40, 40, 40);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

      pdf.text("INDICADOR", margin + 2, yPosition + 5);
      pdf.text("VALOR", margin + 60, yPosition + 5);
      pdf.text("DESCRIPCIÓN", margin + 85, yPosition + 5);
      pdf.text("ESTADO", margin + 140, yPosition + 5);
      yPosition += 8;

      // Datos de KPIs de salud
      pdf.setTextColor(60, 60, 60);
      healthKpiData.forEach((row, index) => {
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
        }

        pdf.setFontSize(9);
        pdf.text(row.metrica, margin + 2, yPosition + 5);
        pdf.text(row.valor, margin + 60, yPosition + 5);
        pdf.text(row.descripcion, margin + 85, yPosition + 5);

        // Color del estado
        switch (row.estado) {
          case "Excelente":
          case "Normal":
            pdf.setTextColor(0, 150, 0);
            break;
          case "Bueno":
            pdf.setTextColor(200, 150, 0);
            break;
          case "Sobrepeso":
          case "Requiere mejora":
            pdf.setTextColor(200, 100, 0);
            break;
          case "Obesidad":
          case "Bajo peso":
            pdf.setTextColor(200, 0, 0);
            break;
          default:
            pdf.setTextColor(60, 60, 60);
        }

        pdf.text(row.estado, margin + 140, yPosition + 5);
        pdf.setTextColor(60, 60, 60);
        yPosition += 8;
      });

      yPosition += 15;
      addSeparator();

      // ========== DISTRIBUCIÓN DE IMC ==========
      checkNewPage(100);

      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("ANÁLISIS DE DISTRIBUCIÓN DE IMC", margin, yPosition);
      yPosition += 15;

      // Tabla detallada de IMC
      const imcData = Object.entries(imcDistribution);
      const totalUsuarios = imcData.reduce((sum, [_, count]) => sum + count, 0);

      if (imcData.length > 0) {
        // Encabezados
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(40, 40, 40);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

        pdf.text("CATEGORÍA IMC", margin + 2, yPosition + 5);
        pdf.text("USUARIOS", margin + 50, yPosition + 5);
        pdf.text("PORCENTAJE", margin + 80, yPosition + 5);
        pdf.text("RANGO IMC", margin + 115, yPosition + 5);
        pdf.text("RECOMENDACIÓN", margin + 150, yPosition + 5);
        yPosition += 8;

        // Datos de IMC
        pdf.setTextColor(60, 60, 60);
        const imcRangos = {
          "Bajo peso": "< 18.5",
          Normal: "18.5 - 24.9",
          Sobrepeso: "25.0 - 29.9",
          Obesidad: "30.0 - 34.9",
          "Obesidad mórbida": "≥ 35.0",
        };

        const recomendacionesIMC = {
          "Bajo peso": "Aumentar masa muscular",
          Normal: "Mantener peso actual",
          Sobrepeso: "Reducir peso gradualmente",
          Obesidad: "Programa de pérdida de peso",
          "Obesidad mórbida": "Consulta médica urgente",
        };

        imcData.forEach(([categoria, usuarios], index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
          }

          const porcentaje = ((usuarios / totalUsuarios) * 100).toFixed(1);
          const rango = imcRangos[categoria] || "N/A";
          const recomendacion =
            recomendacionesIMC[categoria] || "Consultar profesional";

          pdf.setFontSize(9);
          pdf.text(categoria, margin + 2, yPosition + 5);
          pdf.text(usuarios.toString(), margin + 50, yPosition + 5);
          pdf.text(`${porcentaje}%`, margin + 80, yPosition + 5);
          pdf.text(rango, margin + 115, yPosition + 5);

          // Color de recomendación según categoría
          if (categoria === "Normal") pdf.setTextColor(0, 150, 0);
          else if (categoria === "Sobrepeso") pdf.setTextColor(200, 150, 0);
          else if (categoria.includes("Obesidad")) pdf.setTextColor(200, 0, 0);
          else pdf.setTextColor(100, 100, 100);

          pdf.text(recomendacion, margin + 150, yPosition + 5);
          pdf.setTextColor(60, 60, 60);
          yPosition += 8;
        });

        yPosition += 15;

        // Análisis de distribución
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Análisis de la Distribución:", margin, yPosition);
        yPosition += 10;

        const usuariosNormales = imcDistribution["Normal"] || 0;
        const usuariosSobrepeso = imcDistribution["Sobrepeso"] || 0;
        const usuariosObesidad =
          (imcDistribution["Obesidad"] || 0) +
          (imcDistribution["Obesidad mórbida"] || 0);

        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const analisisIMC = [
          `• ${usuariosNormales} usuarios (${(
            (usuariosNormales / totalUsuarios) *
            100
          ).toFixed(1)}%) mantienen un peso saludable`,
          `• ${usuariosSobrepeso} usuarios (${(
            (usuariosSobrepeso / totalUsuarios) *
            100
          ).toFixed(1)}%) presentan sobrepeso`,
          `• ${usuariosObesidad} usuarios (${(
            (usuariosObesidad / totalUsuarios) *
            100
          ).toFixed(1)}%) requieren atención especializada`,
          `• Recomendación: ${
            usuariosNormales / totalUsuarios > 0.7
              ? "Mantener programas actuales"
              : "Intensificar programas de pérdida de peso"
          }`,
        ];

        analisisIMC.forEach((linea) => {
          pdf.text(linea, margin, yPosition);
          yPosition += lineHeight;
        });
      }

      yPosition += 15;
      addSeparator();

      // ========== ANÁLISIS POR GÉNERO ==========
      if (Object.keys(metricasPorGenero).length >= 2) {
        checkNewPage(80);

        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text("ANÁLISIS COMPARATIVO POR GÉNERO", margin, yPosition);
        yPosition += 15;

        const femenino = metricasPorGenero.femenino || {};
        const masculino = metricasPorGenero.masculino || {};

        // Tabla comparativa
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(40, 40, 40);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");

        pdf.text("MÉTRICA", margin + 2, yPosition + 5);
        pdf.text("FEMENINO", margin + 50, yPosition + 5);
        pdf.text("MASCULINO", margin + 90, yPosition + 5);
        pdf.text("DIFERENCIA", margin + 130, yPosition + 5);
        pdf.text("OBSERVACIÓN", margin + 165, yPosition + 5);
        yPosition += 8;

        const metricasComparativas = [
          {
            nombre: "IMC Promedio",
            femenino: femenino.imc?.toFixed(1) || "N/A",
            masculino: masculino.imc?.toFixed(1) || "N/A",
            diferencia:
              femenino.imc && masculino.imc
                ? Math.abs(femenino.imc - masculino.imc).toFixed(1)
                : "N/A",
          },
          {
            nombre: "Peso Promedio (kg)",
            femenino: femenino.peso?.toFixed(1) || "N/A",
            masculino: masculino.peso?.toFixed(1) || "N/A",
            diferencia:
              femenino.peso && masculino.peso
                ? Math.abs(femenino.peso - masculino.peso).toFixed(1)
                : "N/A",
          },
          {
            nombre: "Altura Promedio (m)",
            femenino: femenino.altura?.toFixed(2) || "N/A",
            masculino: masculino.altura?.toFixed(2) || "N/A",
            diferencia:
              femenino.altura && masculino.altura
                ? Math.abs(femenino.altura - masculino.altura).toFixed(2)
                : "N/A",
          },
          {
            nombre: "Edad Promedio",
            femenino: femenino.edad?.toFixed(0) || "N/A",
            masculino: masculino.edad?.toFixed(0) || "N/A",
            diferencia:
              femenino.edad && masculino.edad
                ? Math.abs(femenino.edad - masculino.edad).toFixed(0)
                : "N/A",
          },
          {
            nombre: "TMB Promedio (kcal)",
            femenino: femenino.tmb?.toFixed(0) || "N/A",
            masculino: masculino.tmb?.toFixed(0) || "N/A",
            diferencia:
              femenino.tmb && masculino.tmb
                ? Math.abs(femenino.tmb - masculino.tmb).toFixed(0)
                : "N/A",
          },
        ];

        pdf.setTextColor(60, 60, 60);
        metricasComparativas.forEach((metrica, index) => {
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
          }

          pdf.setFontSize(9);
          pdf.text(metrica.nombre, margin + 2, yPosition + 5);
          pdf.text(metrica.femenino, margin + 50, yPosition + 5);
          pdf.text(metrica.masculino, margin + 90, yPosition + 5);
          pdf.text(metrica.diferencia, margin + 130, yPosition + 5);

          // Observación basada en diferencias típicas
          let observacion = "Normal";
          if (
            metrica.nombre.includes("TMB") &&
            parseFloat(metrica.diferencia) > 200
          ) {
            observacion = "Diferencia esperada";
          } else if (
            metrica.nombre.includes("Peso") &&
            parseFloat(metrica.diferencia) > 10
          ) {
            observacion = "Diferencia notable";
          } else if (
            metrica.nombre.includes("Altura") &&
            parseFloat(metrica.diferencia) > 0.1
          ) {
            observacion = "Diferencia típica";
          }

          pdf.text(observacion, margin + 165, yPosition + 5);
          yPosition += 8;
        });

        yPosition += 15;

        // Insights del análisis por género
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Insights del Análisis por Género:", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const insightsGenero = [
          `• Usuarios femeninos analizados: ${femenino.count || 0}`,
          `• Usuarios masculinos analizados: ${masculino.count || 0}`,
          `• Las diferencias en TMB reflejan las variaciones metabólicas naturales`,
          `• Los programas de entrenamiento pueden personalizarse según estas métricas`,
        ];

        insightsGenero.forEach((insight) => {
          pdf.text(insight, margin, yPosition);
          yPosition += lineHeight;
        });
      }

      yPosition += 15;

      // ========== PIE DE PÁGINA ==========
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        "Reporte de Salud generado automáticamente por PowerPlate Management System",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Guardar PDF
      pdf.save(
        `reporte-salud-detallado-${new Date().toISOString().split("T")[0]}.pdf`
      );
      console.log("✅ PDF detallado de salud exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF de salud:", error);
      alert("Error al generar el PDF de salud.");
    }
  };

  // Exportación a Excel para ocupación (mantener la función original)
  const exportOcupacionToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const kpis = calculateOcupacionKPIs();
      const { ocupacionPorDia, tendenciaMensual, ocupacionPorEquipo } =
        processOcupacionData();

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
      const reservasDetalle = dataOcupacion.reservas
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

        for (let i = 0; i < 10; i++) {
          if (!sheet["!cols"][i]) sheet["!cols"][i] = {};
          sheet["!cols"][i].wch = 15;
        }
      });

      const fileName = `reporte-ocupacion-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log("✅ Excel de ocupación exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al generar el archivo Excel.");
    }
  };

  // Exportación a Excel para salud (mantener la función original)
  const exportSaludToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const kpis = calculateSaludKPIs();
      const {
        imcDistribution,
        objetivosComunes,
        metricasPorGenero,
        evolucionTemporal,
      } = processSaludData();

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
          IMC: u.metricas.imc?.toFixed
            ? u.metricas.imc.toFixed(1)
            : u.metricas.imc || "N/A",
          "Clasificación IMC": u.metricas.rango_imc || "N/A",
          TMB: u.metricas.tmb?.toFixed
            ? u.metricas.tmb.toFixed(0)
            : u.metricas.tmb || "N/A",
          "Grasa Corporal (%)": u.metricas.grasa_corporal_estimada?.toFixed
            ? u.metricas.grasa_corporal_estimada.toFixed(1)
            : u.metricas.grasa_corporal_estimada || "N/A",
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

  // ===== OBTENER DATOS ACTUALES =====

  // Obtener datos y KPIs según el tipo de reporte
  const getCurrentData = () => {
    if (tipoReporte === "ocupacion") {
      return {
        kpis: calculateOcupacionKPIs(),
        processedData: processOcupacionData(),
      };
    } else {
      return {
        kpis: calculateSaludKPIs(),
        processedData: processSaludData(),
      };
    }
  };

  const { kpis, processedData } = getCurrentData();

  // ===== RENDER DEL COMPONENTE =====

  return (
    <div className="relative z-10 py-8">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Principal */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                  <BarChart4 className="w-8 h-8 text-black" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                  Centro de Reportes
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Análisis integral y métricas avanzadas
                </p>
              </div>
            </div>

            {/* Selector de tipo de reporte */}
            <div className="flex gap-3">
              <button
                onClick={() => setTipoReporte("ocupacion")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  tipoReporte === "ocupacion"
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-400/25"
                    : "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Ocupación
              </button>
              <button
                onClick={() => setTipoReporte("salud")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  tipoReporte === "salud"
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-400/25"
                    : "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700"
                }`}
              >
                <Heart className="w-5 h-5" />
                Salud
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <span>Reportes</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-yellow-400 font-medium">
              {tipoReporte === "ocupacion"
                ? "Análisis de Ocupación"
                : "Análisis de Salud"}
            </span>
          </nav>

          {/* Filtros dinámicos */}
          {tipoReporte === "ocupacion" ? (
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
                  <Filter className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Filtros de Fecha
                </h2>
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
                      setDateRange((prev) => ({
                        ...prev,
                        inicio: e.target.value,
                      }))
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
          ) : (
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
                    value={filtrosSalud.genero}
                    onChange={(e) =>
                      setFiltrosSalud((prev) => ({
                        ...prev,
                        genero: e.target.value,
                      }))
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
                    value={filtrosSalud.rangoEdad}
                    onChange={(e) =>
                      setFiltrosSalud((prev) => ({
                        ...prev,
                        rangoEdad: e.target.value,
                      }))
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
                    value={filtrosSalud.categoria}
                    onChange={(e) =>
                      setFiltrosSalud((prev) => ({
                        ...prev,
                        categoria: e.target.value,
                      }))
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
          )}

          {/* Acciones de exportación */}
          <div className="flex flex-wrap items-center justify-end gap-3 mb-8">
            <button
              onClick={
                tipoReporte === "ocupacion"
                  ? exportOcupacionToPDF
                  : exportSaludToPDF
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={
                tipoReporte === "ocupacion"
                  ? exportOcupacionToExcel
                  : exportSaludToExcel
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </button>
            <button
              onClick={
                tipoReporte === "ocupacion" ? loadDataOcupacion : loadDataSalud
              }
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

        {/* KPIs dinámicos */}
        {tipoReporte === "ocupacion" ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="IMC Promedio"
              value={kpis.imcPromedio}
              subtitle="Índice masa corporal"
              icon={Scale}
              color="yellow"
              loading={loading}
            />
            <KPICard
              title="Usuarios Saludables"
              value={kpis.porcentajeSaludable}
              unit="%"
              subtitle="Con IMC normal"
              icon={Heart}
              color="green"
              loading={loading}
              trend="+5% vs mes anterior"
            />
            <KPICard
              title="Edad Promedio"
              value={kpis.edadPromedio}
              unit=" años"
              subtitle="Edad de usuarios"
              icon={Calendar}
              color="blue"
              loading={loading}
            />
            <KPICard
              title="TMB Promedio"
              value={kpis.tmbPromedio}
              unit=" kcal"
              subtitle="Tasa metabólica basal"
              icon={Activity}
              color="purple"
              loading={loading}
            />
          </div>
        )}

        {/* Gráficos principales */}
        {tipoReporte === "ocupacion" ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title="Ocupación por Día de la Semana"
                loading={loading}
                icon={BarChart3}
                subtitle="Análisis de ocupación"
              >
                <canvas ref={barChartRef}></canvas>
              </ChartCard>

              <ChartCard
                title="Tendencia Mensual"
                loading={loading}
                icon={TrendingUp}
                subtitle="Análisis de ocupación"
              >
                <canvas ref={lineChartRef}></canvas>
              </ChartCard>
            </div>

            {/* Heatmap */}
            <HeatmapCard
              data={processedData.heatmapData || {}}
              loading={loading}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title="Distribución de IMC"
                loading={loading}
                icon={PieChart}
                subtitle="Análisis de salud y bienestar"
              >
                <canvas ref={imcChartRef}></canvas>
              </ChartCard>

              <ChartCard
                title="Objetivos Más Comunes"
                loading={loading}
                icon={Target}
                subtitle="Análisis de salud y bienestar"
              >
                <canvas ref={objetivosChartRef}></canvas>
              </ChartCard>
            </div>

            {/* Evolución temporal y métricas por género */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title="Evolución de Registros"
                loading={loading}
                icon={TrendingUp}
                subtitle="Análisis de salud y bienestar"
              >
                <canvas ref={evolucionChartRef}></canvas>
              </ChartCard>

              <MetricasGeneroTable
                data={{
                  femenino: processedData.metricasPorGenero?.femenino || {
                    imc: 0,
                    peso: 0,
                    altura: 0,
                    edad: 0,
                    tmb: 0,
                  },
                  masculino: processedData.metricasPorGenero?.masculino || {
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
          </>
        )}
      </div>
    </div>
  );
};

export default Reportes;
