import React from 'react';
import { X, UserCheck, UserX, AlertTriangle, User, Mail, Shield, Activity } from 'lucide-react';

const CambiarEstadoModal = ({ isOpen, onClose, onConfirm, usuario }) => {
  if (!isOpen) return null;

  const isActivating = !usuario?.activo;
  const actionText = isActivating ? "Activar" : "Desactivar";
  const confirmText = isActivating ? "Confirmar Activación" : "Confirmar Desactivación";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-[9999] backdrop-blur-sm p-4 pt-20">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl shadow-yellow-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isActivating ? 'bg-green-500' : 'bg-red-500'}`}>
              {isActivating ? (
                <UserCheck className="h-5 w-5 text-white" />
              ) : (
                <UserX className="h-5 w-5 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-yellow-400">
              {actionText} Usuario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="flex items-start space-x-3 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-200 font-medium">
              ¿Estás seguro que deseas {actionText.toLowerCase()} este usuario?
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {isActivating 
                ? "El usuario podrá acceder nuevamente al sistema."
                : "El usuario perderá acceso al sistema inmediatamente."
              }
            </p>
          </div>
        </div>
        
        {/* User Details Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <User className="h-4 w-4 text-yellow-400 mr-2" />
            <p className="font-semibold text-yellow-400">Detalles del Usuario</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-300 text-sm">Nombre:</span>
              <span className="text-gray-100 font-medium ml-2">
                {usuario?.nombre} {usuario?.apellido_p} {usuario?.apellido_m}
              </span>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-300 text-sm">Email:</span>
              <span className="text-gray-100 font-medium ml-2">
                {usuario?.correo}
              </span>
            </div>
            
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-300 text-sm">Rol:</span>
              <span className="text-gray-100 font-medium ml-2 capitalize">
                {usuario?.rol}
              </span>
            </div>
            
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-300 text-sm">Estado actual:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${
                usuario?.activo
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {usuario?.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Impact */}
        <div className={`p-4 rounded-lg mb-6 border ${
          isActivating 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-red-500/10 border-red-500/30"
        }`}>
          <p className={`text-sm font-medium ${
            isActivating ? "text-green-400" : "text-red-400"
          }`}>
            {isActivating ? "Al activar este usuario:" : "Al desactivar este usuario:"}
          </p>
          <ul className={`text-sm mt-2 space-y-1 ${
            isActivating ? "text-green-300" : "text-red-300"
          }`}>
            {isActivating ? (
              <>
                <li>• Podrá iniciar sesión en el sistema</li>
                <li>• Recuperará acceso a todas sus funciones</li>
                <li>• Recibirá notificaciones del sistema</li>
              </>
            ) : (
              <>
                <li>• No podrá iniciar sesión en el sistema</li>
                <li>• Perderá acceso a todas las funciones</li>
                <li>• Sus datos se mantendrán pero inaccesibles</li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg ${
              isActivating
                ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/25 hover:shadow-green-500/40"
                : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 hover:shadow-red-500/40"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CambiarEstadoModal;