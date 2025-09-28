import React, { useState, useRef, useEffect } from "react";
import {
  RiSearchLine,
  RiCloseLine,
  RiRunLine,
  RiBodyScanLine,
  RiFilterLine,
  RiKeyboardLine,
  RiRepeatLine,
  RiFunctionLine,
} from "react-icons/ri";

const RutinaSearch = ({ searchTerm, setSearchTerm }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);

  // Cargar historial de búsqueda desde localStorage al montar
  useEffect(() => {
    const savedHistory = localStorage.getItem("rutina_search_history");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Error parsing search history:", error);
      }
    }
  }, []);

  // Guardar en historial
  const saveToHistory = (term) => {
    if (term.trim().length > 2) {
      const updatedHistory = [
        term,
        ...searchHistory.filter((item) => item !== term),
      ].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem(
        "rutina_search_history",
        JSON.stringify(updatedHistory)
      );
    }
  };

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      saveToHistory(searchTerm.trim());
      setIsFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const selectFromHistory = (term) => {
    setSearchTerm(term);
    saveToHistory(term);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const getSearchType = (term) => {
    const lowerTerm = term.toLowerCase();

    // Detectar si es búsqueda por músculo
    const muscleKeywords = [
      "pecho",
      "espalda",
      "pierna",
      "bicep",
      "tricep",
      "hombro",
      "abdomen",
    ];
    if (muscleKeywords.some((muscle) => lowerTerm.includes(muscle))) {
      return { type: "muscle", icon: RiBodyScanLine, label: "Músculo" };
    }

    // Detectar si es búsqueda por números (series/repeticiones)
    if (/\d+/.test(term)) {
      return { type: "number", icon: RiRepeatLine, label: "Series/Reps" };
    }

    // Por defecto, búsqueda por ejercicio
    return { type: "exercise", icon: RiRunLine, label: "Ejercicio" };
  };

  const searchType = getSearchType(searchTerm);

  return (
    <div className="relative w-full">
      <div
        className={`relative transition-all duration-300 ${
          isFocused
            ? "transform scale-[1.02] shadow-lg shadow-yellow-400/20"
            : "transform scale-100"
        }`}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por ejercicio, músculo o número (ej: dominadas pecho 12)..."
            className="w-full py-3 pl-10 pr-10 rounded-xl text-white placeholder-gray-400
              bg-gray-800 border border-gray-600 transition-all duration-300 outline-none
              focus:border-yellow-400 focus:bg-gray-700"
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          <div
            className={`absolute inset-y-0 left-0 flex items-center pl-3 transition-colors duration-300 ${
              isFocused ? "text-yellow-400" : "text-gray-400"
            }`}
          >
            <RiSearchLine className="w-4 h-4" />
          </div>

          {searchTerm && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                onClick={clearSearch}
                className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Limpiar búsqueda"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        
      </div>

      {searchTerm && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <div
            className={`px-2 py-1 rounded-full ${
              searchType.type === "muscle"
                ? "bg-purple-500/20 text-purple-400"
                : searchType.type === "number"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {searchType.label}
          </div>
          <span>•</span>
          <span>Búsqueda en tiempo real</span>
        </div>
      )}
    </div>
  );
};

export default RutinaSearch;
