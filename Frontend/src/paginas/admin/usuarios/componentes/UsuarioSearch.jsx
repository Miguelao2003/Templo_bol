import React, { useState, useRef, useEffect } from "react";
import { 
  RiSearchLine, 
  RiCloseLine, 
  RiUserLine, 
  RiMailLine,
  RiFilterLine,
  RiKeyboardLine 
} from "react-icons/ri";

const UsuarioSearch = ({ searchTerm, setSearchTerm }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);

  // Cargar historial de búsqueda desde localStorage al montar
  useEffect(() => {
    const savedHistory = localStorage.getItem('usuario_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
      }
    }
  }, []);

  // Guardar en historial cuando se realiza una búsqueda
  const saveToHistory = (term) => {
    if (term.trim().length > 2) {
      const updatedHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('usuario_search_history', JSON.stringify(updatedHistory));
    }
  };

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      saveToHistory(searchTerm.trim());
      setIsFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const selectFromHistory = (term) => {
    setSearchTerm(term);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const getSearchType = (term) => {
    if (term.includes('@')) return { type: 'email', icon: RiMailLine, label: 'Email' };
    if (!isNaN(term)) return { type: 'age', icon: RiUserLine, label: 'Edad' };
    return { type: 'name', icon: RiUserLine, label: 'Nombre' };
  };

  const searchType = getSearchType(searchTerm);

  return (
    <div className="relative w-full">
      {/* Input container */}
      <div className={`relative transition-all duration-300 ${
        isFocused 
          ? 'transform scale-[1.02] shadow-lg shadow-yellow-400/20' 
          : 'transform scale-100'
      }`}>
        {/* Input field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            className={`
              w-full py-4 pl-12 pr-12 rounded-xl text-white placeholder-gray-600
              bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm
              border transition-all duration-300 outline-none
              ${isFocused 
                ? 'border-yellow-400/50 bg-yellow-400/5 shadow-lg shadow-yellow-400/10' 
                : 'border-gray-600/50 hover:border-gray-500/50'
              }
              focus:border-yellow-400/50 focus:bg-yellow-400/5
            `}
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          {/* Search icon */}
          <div className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-300 ${
            isFocused ? 'text-yellow-400' : 'text-gray-500'
          }`}>
            <RiSearchLine className="w-5 h-5" />
          </div>

          {/* Clear button and search type indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
            {/* Search type indicator */}
            {searchTerm && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                searchType.type === 'email' ? 'bg-blue-500/20 text-blue-400' :
                searchType.type === 'age' ? 'bg-green-500/20 text-green-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                <searchType.icon className="w-3 h-3" />
                <span>{searchType.label}</span>
              </div>
            )}

            {/* Clear button */}
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="p-1.5 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-300 group"
                title="Limpiar búsqueda"
              >
                <RiCloseLine className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </button>
            )}
          </div>
        </div>

        {/* Search suggestions dropdown */}
        {isFocused && (searchHistory.length > 0 || searchTerm.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Search tips when no term */}
            {!searchTerm && (
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <RiFilterLine className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Consejos de búsqueda</span>
                </div>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <RiUserLine className="w-3 h-3 text-green-400" />
                    <span>Busca por nombre: "Juan", "María López"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiMailLine className="w-3 h-3 text-blue-400" />
                    <span>Busca por email: "usuario@ejemplo.com"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiKeyboardLine className="w-3 h-3 text-purple-400" />
                    <span>Presiona Enter para guardar búsqueda</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search history */}
            {searchHistory.length > 0 && !searchTerm && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RiSearchLine className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Búsquedas recientes</span>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => selectFromHistory(term)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700/50 rounded-lg transition-colors text-gray-300 hover:text-white group"
                    >
                      <RiSearchLine className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-sm truncate">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick search suggestions based on current term */}
            {searchTerm && searchTerm.length > 1 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <searchType.icon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">
                    Buscando por {searchType.label.toLowerCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {searchType.type === 'email' && "Se buscarán usuarios con emails similares"}
                  {searchType.type === 'age' && "Se buscarán usuarios con esta edad"}
                  {searchType.type === 'name' && "Se buscarán usuarios con nombres/apellidos similares"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search stats */}
      {searchTerm && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Búsqueda en tiempo real activa</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Presiona Esc para cancelar</span>
            <span>Enter para guardar</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuarioSearch;