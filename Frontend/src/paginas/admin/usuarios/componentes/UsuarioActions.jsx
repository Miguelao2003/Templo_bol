import { useState, useEffect } from "react";
import { userService } from "../../../services/api";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../components/Notification";
import UsuarioTable from "./components/UsuarioTable";
import UsuarioFilters from "./components/UsuarioFilters";
import UsuarioSearch from "./components/UsuarioSearch";
import CrearUsuarioModal from "./modals/CrearUsuarioModal";
import EditarUsuarioModal from "./modals/EditarUsuarioModal";
import CambiarEstadoModal from "./modals/CambiarEstadoModal";

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

const Usuario = () => {
  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: null,
    category: null,
    active: null,
  });
  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    estado: false,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState(initialUserState);
  const { notification, showNotification } = useNotification();

  // Efectos
  useEffect(() => {
    loadUsers();
  }, [searchTerm, filters]);

  // Funciones
  const loadUsers = async () => {
    /* ... misma implementación ... */
  };

  const handleCreateUser = async () => {
    /* ... misma implementación ... */
  };

  const handleEditUser = async () => {
    /* ... misma implementación ... */
  };

  const handleChangeStatus = async () => {
    /* ... misma implementación ... */
  };

  const resetForm = () => {
    setNewUser(initialUserState);
  };

  return (
    <div className="p-4">
      <Notification
        notification={notification}
        onClose={() => showNotification(null, null)}
      />

      {/* Header y botón crear */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
        <button
          onClick={() => {
            resetForm();
            setModalState({...modalState, crear: true});
          }}
          className="btn-primary"
        >
          + Crear Usuario
        </button>
      </div>

      {/* Componentes modularizados */}
      <UsuarioSearch 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />
      
      <UsuarioFilters 
        filters={filters} 
        setFilters={setFilters} 
        roles={ROLES} 
        categories={CATEGORIAS} 
      />

      <UsuarioTable
        usuarios={usuarios}
        loading={loading}
        onEdit={(user) => {
          setSelectedUser(user);
          setNewUser(mapUserToForm(user));
          setModalState({...modalState, editar: true});
        }}
        onChangeStatus={(user) => {
          setSelectedUser(user);
          setModalState({...modalState, estado: true});
        }}
      />

      {/* Modales */}
      <CrearUsuarioModal
        isOpen={modalState.crear}
        onClose={() => setModalState({...modalState, crear: false})}
        onCreate={handleCreateUser}
        user={newUser}
        onChange={setNewUser}
        roles={ROLES}
        categories={CATEGORIAS}
      />

      <EditarUsuarioModal
        isOpen={modalState.editar}
        onClose={() => setModalState({...modalState, editar: false})}
        onSave={handleEditUser}
        user={newUser}
        onChange={setNewUser}
        roles={ROLES}
        categories={CATEGORIAS}
      />

      <CambiarEstadoModal
        isOpen={modalState.estado}
        onClose={() => setModalState({...modalState, estado: false})}
        onConfirm={handleChangeStatus}
        user={selectedUser}
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
  peso: 0,
  altura: 0,
  edad: 0,
  contrasena: "",
};

const mapUserToForm = (user) => ({
  nombre: user.nombre,
  apellido_p: user.apellido_p,
  apellido_m: user.apellido_m,
  correo: user.correo,
  rol: user.rol,
  categoria: user.categoria || "powerplate",
  peso: user.peso || 0,
  altura: user.altura || 0,
  edad: user.edad || 0,
});

export default Usuario;