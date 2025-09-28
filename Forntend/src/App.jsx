import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// ❌ ELIMINADO: import { AuthProvider } from "./contextos/AuthContext";
import LayoutAuth from "/src/diseños/LayoutAuth";
import LayoutAdmin from "./diseños/LayoutAdmin";
import LayoutCliente from "./diseños/LayoutCliente";
import LayoutEntrenador from "./diseños/LayoutEntrenador";
import Login from "./paginas/auth/Login";
import Registro from "./paginas/auth/Registro";

// Páginas de Admin
import AdminDashboard from "./paginas/admin/AdminDashboard";
import PerfilAdmin from "./paginas/admin/PerfilAdmin";
import Usuario from "./paginas/admin/usuarios/Usuario";
import Horarios from "./paginas/admin/horarios/Horarios"
import HorariosTurno from "./paginas/admin/horarios/HorariosTurno";
import Rutinas from "./paginas/admin/rutinas/Rutinas";
import Equipos from "./paginas/admin/equipos/Equipos";
import Reportes from "./paginas/admin/reportes/Reportes";
import Reservas from "./paginas/admin/reservas/Reservas";

// Páginas de Cliente (compartidas)
import PerfilCliente from "./paginas/cliente/PerfilCliente";
import HorariosTurnoCliente from "./paginas/cliente/horarios/HorariosTurnoCliente";
import EquiposPowerplate from "./paginas/cliente/equipos/EquiposPowerplate";
import ReservasCliente from "./paginas/cliente/reservas/ReservasCliente";
import RutinaIA from "./paginas/cliente/iaroutines/RutinaIA";

// Páginas de Entrenador (si las tienes)
import PerfilEntrenador from "./paginas/entrenador/PerfilEntrenador";
import HorariosEntrenador from "./paginas/entrenador/horarios/HorariosEntrenador";
import RutinasEntrenador from "./paginas/entrenador/rutinas/RutinasEntrenador";
import ProtectedRoute from "./componentes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas */}
        <Route element={<LayoutAuth />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>

        {/* Rutas protegidas - ADMINISTRADOR */}
        <Route element={<ProtectedRoute allowedRoles={["administrador"]} />}>
          <Route path="/administrador/*" element={<LayoutAdmin />}>
            <Route path="admindashboard" element={<AdminDashboard/>}/>
            <Route path="perfil" element={<PerfilAdmin />} />
            <Route path="usuario" element={<Usuario />} />
            <Route path="horario" element={<Horarios/>}/>
            <Route path="horarioturno" element={<HorariosTurno/>}/>
            <Route path="rutina" element={<Rutinas/>}/>
            <Route path="equipo" element={<Equipos/>}/>
            <Route path="reserva" element={<Reservas/>}/>
            <Route path="reporte" element={<Reportes/>}/>
            <Route path="*" element={<Navigate to="/administrador/perfil" replace />} />
          </Route>
        </Route>

        {/* Rutas protegidas - ENTRENADOR */}
        <Route element={<ProtectedRoute allowedRoles={["entrenador"]} />}>
          <Route path="/entrenador/*" element={<LayoutEntrenador />}>
            <Route path="perfil" element={<PerfilEntrenador />} />
            <Route path="horarioentrenador" element={<HorariosEntrenador />} />
            <Route path="rutinaentrenador" element={<RutinasEntrenador />} />
            
            {/* Agregar más rutas de entrenador según necesites */}
            <Route path="*" element={<Navigate to="/entrenador/perfil" replace />} />
          </Route>
        </Route>

        {/* Rutas protegidas - CLIENTE (Unificadas con layout dinámico) */}
        <Route element={<ProtectedRoute allowedRoles={["cliente"]} />}>
          <Route path="/cliente/*" element={<LayoutCliente />}>
            <Route path="perfil" element={<PerfilCliente />} />
            <Route path="horarioturnocliente" element={<HorariosTurnoCliente />} /> 
            <Route path="horarioturnocliente/equipopowerplate" element={<EquiposPowerplate/>}/>
            <Route path="reservacliente" element={<ReservasCliente />} />
            <Route path="rutinaIA" element={<RutinaIA/>} />
            <Route path="*" element={<Navigate to="/cliente/perfil" replace />} />
          </Route>
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-yellow-400 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-white mb-4">Página no encontrada</h2>
              <p className="text-gray-400 mb-8">La página que buscas no existe o ha sido movida.</p>
              <Navigate to="/login" replace />
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;