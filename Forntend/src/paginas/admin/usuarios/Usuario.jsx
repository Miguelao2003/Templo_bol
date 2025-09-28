import { useState, useEffect } from "react";
import { userService } from "../../../services/usuarios";
import { useNotification, NotificationMessages } from "../../../hooks/useNotification";
import Notification from "../../../componentes/Notification";
import UsuarioTable from "./componentes/UsuarioTable";
import UsuarioFilters from "./componentes/UsuarioFilters";
import UsuarioSearch from "./componentes/UsuarioSearch";
import CrearUsuarioModal from "./modales/CrearUsuarioModal";
import EditarUsuarioModal from "./modales/EditarUsuarioModal";
import CambiarEstadoModal from "./modales/CambiarEstadoModal";
import {
  RiUserLine,
  RiUserAddLine,
  RiRefreshLine,
  RiTeamLine,
  RiFilterLine,
  RiSearchLine,
  RiSettings3Line,
  RiDownloadLine,
  RiUploadLine,
  RiBarChart2Line,
  RiShieldCheckLine,
  RiCalendarLine,
} from "react-icons/ri";

// Constantes de configuración
const ROLES = {
  ADMINISTRADOR: "administrador",
  ENTRENADOR: "entrenador",
  CLIENTE: "cliente",
};

const CATEGORIAS = {
  POWERPLATE: "powerplate",
  CALISTENIA: "calistenia",
};

const NIVELES = {
  PRINCIPIANTE: "principiante",
  INTERMEDIO: "intermedio",
  AVANZADO: "avanzado",
};

const Usuario = () => {
  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: null,
    category: null,
    active: null,
    genero: null,
    objetivo: null,
    nivel: null,
  });
  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    estado: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    administradores: 0,
    entrenadores: 0,
    clientes: 0,
  });

  const [newUser, setNewUser] = useState(initialUserState);
  const { notification, showNotification, hideNotification } = useNotification();
  const [selectedUser, setSelectedUser] = useState(null);

  // Efectos
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  useEffect(() => {
    calculateStats();
  }, [usuarios]);

  // Funciones
  const calculateStats = () => {
    if (!usuarios.length) {
      setStats({
        total: 0,
        activos: 0,
        inactivos: 0,
        administradores: 0,
        entrenadores: 0,
        clientes: 0,
      });
      return;
    }

    const newStats = {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo === true).length,
      inactivos: usuarios.filter((u) => u.activo === false).length,
      administradores: usuarios.filter((u) => u.rol === "administrador").length,
      entrenadores: usuarios.filter((u) => u.rol === "entrenador").length,
      clientes: usuarios.filter((u) => u.rol === "cliente").length,
    };

    setStats(newStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
      showNotification("success", NotificationMessages.SUCCESS.UPDATED);
    } catch (error) {
      showNotification("error", NotificationMessages.ERROR.LOAD);
    } finally {
      setRefreshing(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let searchParams = {};
      const trimmedTerm = searchTerm.trim().toLowerCase();

      console.log("🔍 === INICIO loadUsers ===");
      console.log("🔍 filters completo:", filters);

      const matchAllTerms = (usuario, terms) => {
        const fullName =
          `${usuario.nombre} ${usuario.apellido_p} ${usuario.apellido_m}`.toLowerCase();
        return terms.every((term) => fullName.includes(term));
      };

      if (trimmedTerm !== "") {
        console.log("🔍 Entrando en búsqueda por término:", trimmedTerm);

        if (trimmedTerm.includes("@")) {
          searchParams.correo = trimmedTerm;
        } else if (!isNaN(trimmedTerm)) {
          searchParams.edad = parseInt(trimmedTerm);
        } else {
          // Lógica de búsqueda por nombre...
          const terms = trimmedTerm
            .split(/\s+/)
            .filter((term) => term.length > 0);

          const searchPriority = [];

          if (terms.length >= 3) {
            searchPriority.push({
              nombre: terms[0],
              apellido_p: terms[1],
              apellido_m: terms[2],
              exactMatch: true,
            });
          }

          if (terms.length >= 2) {
            searchPriority.push({
              nombre: terms[0],
              apellido_p: terms[1],
              exactMatch: true,
            });
          }

          if (terms.length === 1) {
            terms.forEach((term) => {
              searchPriority.push(
                { nombre: term, exactMatch: true },
                { apellido_p: term, exactMatch: true },
                { apellido_m: term, exactMatch: true }
              );
            });
          }

          if (terms.length >= 3) {
            searchPriority.push({
              nombre: terms[0],
              apellido_p: terms[1],
              apellido_m: terms[2],
            });
          }

          if (terms.length >= 2) {
            searchPriority.push(
              { nombre: terms[0], apellido_p: terms[1] },
              { apellido_p: terms[0], apellido_m: terms[1] },
              { nombre: terms[0], apellido_m: terms[1] }
            );
          }

          terms.forEach((term) => {
            searchPriority.push(
              { nombre: term },
              { apellido_p: term },
              { apellido_m: term }
            );
          });

          let allResults = [];

          for (const option of searchPriority) {
            const { exactMatch, ...params } = option;
            const currentParams = {
              ...params,
              ...(filters.role && { rol: filters.role }),
              ...(filters.category && { categoria: filters.category }),
              ...(filters.active !== null && { activo: filters.active }),
              ...(filters.genero && { genero: filters.genero }),
              ...(filters.objetivo && { objetivo: filters.objetivo }),
              ...(filters.nivel && { nivel: filters.nivel }),
            };

            try {
              const data = await userService.searchUsers(currentParams);
              if (data.length > 0) {
                const filtered = data.filter(
                  (item) =>
                    !allResults.some((r) => r.id_usuario === item.id_usuario)
                );
                allResults = [...allResults, ...filtered];
              }
            } catch (error) {
              console.error("Error en búsqueda:", error);
            }
          }

          const strictFiltered = allResults.filter((usuario) =>
            matchAllTerms(usuario, terms)
          );

          setUsuarios(strictFiltered.slice(0, 20));
          return;
        }
      }

      console.log("🔍 === CONSTRUYENDO searchParams ===");

      if (filters.role) {
        searchParams.rol = filters.role;
      }

      if (filters.category) {
        searchParams.categoria = filters.category;
      }

      if (filters.active !== null) {
        searchParams.activo = filters.active;
      }

      if (filters.objetivo) {
        searchParams.objetivo = filters.objetivo;
      }

      if (filters.genero) {
        searchParams.genero = filters.genero;
      }

      if (filters.nivel) {
        searchParams.nivel = filters.nivel;
      }

      console.log("🔍 searchParams completo:", searchParams);

      const data = await userService.searchUsers(searchParams);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      showNotification("error", NotificationMessages.ERROR.LOAD);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    console.log(`🔧 Cambiando filtro ${name} a:`, value);

    setFilters({
      ...filters,
      [name]: value || null,
    });
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🚨 CREAR USUARIO - CORREGIDO
  const handleCreateUser = async () => {
    try {
      // Validaciones básicas
      if (!newUser.nombre.trim()) {
        showNotification('error', 'El nombre es requerido');
        return;
      }
      if (!newUser.apellido_p.trim()) {
        showNotification('error', 'El apellido paterno es requerido');
        return;
      }
      if (!newUser.correo.trim()) {
        showNotification('error', 'El correo es requerido');
        return;
      }
      if (!newUser.contrasena.trim()) {
        showNotification('error', 'La contraseña es requerida');
        return;
      }

      // Validaciones adicionales del código original
      if (!newUser.rol || !Object.values(ROLES).includes(newUser.rol)) {
        throw new Error("Seleccione un rol válido");
      }

      if (!newUser.categoria || !Object.values(CATEGORIAS).includes(newUser.categoria)) {
        throw new Error("Seleccione una categoría válida");
      }

      if (!["Masculino", "Femenino"].includes(newUser.genero)) {
        throw new Error("Seleccione un género válido");
      }

      if (!["perdida de peso", "aumento de peso"].includes(newUser.objetivo)) {
        throw new Error("Seleccione un objetivo válido");
      }

      const userToCreate = {
        ...newUser,
        peso: parseFloat(newUser.peso) || null,
        altura: parseFloat(newUser.altura) || null,
        edad: parseInt(newUser.edad) || null,
      };

      const createdUser = await userService.createUser(userToCreate);

      // 1. Actualizar lista
      setUsuarios((prev) => [createdUser, ...prev]);
      
      // 2. Resetear formulario
      resetForm();
      
      // 3. CERRAR MODAL PRIMERO
      setModalState((prev) => ({ ...prev, crear: false }));
      
      // 4. MOSTRAR NOTIFICACIÓN DESPUÉS DEL CIERRE
      setTimeout(() => {
        showNotification("success", NotificationMessages.SUCCESS.CREATED);
      }, 200);
      
    } catch (err) {
      console.error("Error al crear usuario:", err);
      // Si hay error, mostrar inmediatamente
      showNotification("error", NotificationMessages.ERROR.CREATE);
    }
  };

  // 🚨 EDITAR USUARIO - CORREGIDO
  const handleEditUser = async () => {
    try {
      if (!selectedUser) return;

      // Validaciones básicas
      if (!newUser.nombre.trim()) {
        showNotification('error', 'El nombre es requerido');
        return;
      }
      if (!newUser.apellido_p.trim()) {
        showNotification('error', 'El apellido paterno es requerido');
        return;
      }
      if (!newUser.correo.trim()) {
        showNotification('error', 'El correo es requerido');
        return;
      }

      const userToUpdate = {
        ...newUser,
        peso: parseFloat(newUser.peso) || null,
        altura: parseFloat(newUser.altura) || null,
        edad: parseInt(newUser.edad) || null,
      };

      const updatedUser = await userService.updateUser(
        selectedUser.id_usuario,
        userToUpdate
      );

      // 1. Actualizar lista
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === selectedUser.id_usuario ? updatedUser : u
        )
      );
      
      // 2. CERRAR MODAL PRIMERO
      setModalState((prev) => ({ ...prev, editar: false }));
      setSelectedUser(null);
      
      // 3. MOSTRAR NOTIFICACIÓN DESPUÉS DEL CIERRE
      setTimeout(() => {
        showNotification("success", NotificationMessages.SUCCESS.UPDATED);
      }, 200);
      
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      showNotification("error", NotificationMessages.ERROR.UPDATE);
    }
  };

  // 🚨 CAMBIAR ESTADO - CORREGIDO
  const handleChangeStatus = async () => {
    try {
      if (!selectedUser) return;

      let updatedUser;
      if (selectedUser.activo) {
        updatedUser = await userService.deactivateUser(selectedUser.id_usuario);
      } else {
        updatedUser = await userService.activateUser(selectedUser.id_usuario);
      }

      // 1. Actualizar lista
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === selectedUser.id_usuario
            ? { ...u, activo: !u.activo }
            : u
        )
      );
      
      // 2. CERRAR MODAL PRIMERO
      setModalState((prev) => ({ ...prev, estado: false }));
      
      // 3. MOSTRAR NOTIFICACIÓN DESPUÉS DEL CIERRE
      const successMessage = selectedUser.activo 
        ? NotificationMessages.SUCCESS.DEACTIVATED 
        : NotificationMessages.SUCCESS.ACTIVATED;
        
      setTimeout(() => {
        showNotification("success", successMessage);
      }, 200);
      
      setSelectedUser(null);
      
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      showNotification("error", NotificationMessages.ERROR.CHANGE_STATUS);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setNewUser({
      nombre: "",
      apellido_p: "",
      apellido_m: "",
      correo: "",
      rol: ROLES.CLIENTE,
      categoria: CATEGORIAS.POWERPLATE,
      peso: "",
      altura: "",
      edad: "",
      genero: "Masculino",
      objetivo: "perdida de peso",
      nivel: NIVELES.PRINCIPIANTE,
      contrasena: "",
    });
  };

  const handleExportData = () => {
    showNotification("info", "Preparando exportación de datos...");
  };

  const handleImportData = () => {
    showNotification("info", "Función de importación próximamente...");
  };

  return (
    <div className="relative z-10 py-8">
      {/* 🚨 NOTIFICATION SIEMPRE VISIBLE CUANDO HAY NOTIFICACIÓN */}
      <Notification
        notification={notification}
        onClose={hideNotification}
      />

      {/* Header principal */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                <RiTeamLine className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Administra y supervisa todos los usuarios del sistema
              </p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-3">

            <button
              onClick={() => {
                resetForm();
                setModalState({ ...modalState, crear: true });
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-yellow-400/25"
            >
              <RiUserAddLine className="w-4 h-4" />
              Crear Usuario
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Usuarios</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiTeamLine className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Total
              </p>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiShieldCheckLine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Activos
              </p>
              <p className="text-lg font-bold text-white">{stats.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCalendarLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Inactivos
              </p>
              <p className="text-lg font-bold text-white">{stats.inactivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiSettings3Line className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Admins
              </p>
              <p className="text-lg font-bold text-white">
                {stats.administradores}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiBarChart2Line className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Entrenadores
              </p>
              <p className="text-lg font-bold text-white">
                {stats.entrenadores}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiUserLine className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Clientes
              </p>
              <p className="text-lg font-bold text-white">{stats.clientes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de búsqueda y filtros */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8 relative z-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
            <RiSearchLine className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white">Búsqueda y Filtros</h2>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <UsuarioSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Filtros */}
        <UsuarioFilters
          filters={filters}
          setFilters={setFilters}
          roles={ROLES}
          categories={CATEGORIAS}
          niveles={NIVELES}
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
              <RiTeamLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Lista de Usuarios
              </h2>
              <p className="text-gray-400 text-sm">
                {loading
                  ? "Cargando usuarios..."
                  : `${usuarios.length} usuarios encontrados`}
              </p>
            </div>
          </div>
        </div>

        <UsuarioTable
          usuarios={usuarios}
          loading={loading}
          onEdit={(user) => {
            setSelectedUser(user);
            setNewUser(mapUserToForm(user));
            setModalState({ ...modalState, editar: true });
          }}
          onChangeStatus={(user) => {
            setSelectedUser(user);
            setModalState({ ...modalState, estado: true });
          }}
        />
      </div>

      {/* Modales */}
      <CrearUsuarioModal
        isOpen={modalState.crear}
        onClose={() => setModalState({ ...modalState, crear: false })}
        onCreate={handleCreateUser}
        usuario={newUser}
        onChange={handleUserInputChange}
        roles={ROLES}
        categorias={CATEGORIAS}
        niveles={NIVELES}
      />

      <EditarUsuarioModal
        isOpen={modalState.editar}
        onClose={() => setModalState({ ...modalState, editar: false })}
        onSave={handleEditUser}
        usuario={newUser}
        onChange={handleEditInputChange}
        roles={ROLES}
        categorias={CATEGORIAS}
        niveles={NIVELES}
      />

      <CambiarEstadoModal
        isOpen={modalState.estado}
        onClose={() => setModalState({ ...modalState, estado: false })}
        onConfirm={handleChangeStatus}
        usuario={selectedUser}
      />
    </div>
  );
};

// Helper functions
const initialUserState = {
  nombre: "",
  apellido_p: "",
  apellido_m: "",
  correo: "",
  rol: "cliente",
  categoria: "powerplate",
  peso: "",
  altura: "",
  edad: "",
  genero: "Masculino",
  objetivo: "perdida de peso",
  nivel: "principiante",
  contrasena: "",
};

const mapUserToForm = (user) => ({
  nombre: user.nombre ?? "",
  apellido_p: user.apellido_p ?? "",
  apellido_m: user.apellido_m ?? "",
  correo: user.correo ?? "",
  rol: user.rol ?? "cliente",
  categoria: user.categoria ?? "powerplate",
  peso: user.peso ?? "",
  altura: user.altura ?? "",
  edad: user.edad ?? "",
  genero: user.genero ?? "Masculino",
  objetivo: user.objetivo ?? "perdida de peso",
  nivel: user.nivel ?? "principiante",
  contrasena: "",
});

export default Usuario;