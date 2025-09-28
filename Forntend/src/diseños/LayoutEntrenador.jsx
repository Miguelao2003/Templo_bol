import React from "react";
import { Outlet } from "react-router-dom";
import IntegratedLayoutEntrenador from "../componentes/IntegratedLayoutEntrenador";

const LayoutEntrenador = () => {
  return (
    <IntegratedLayoutEntrenador>
      <Outlet /> {/* Esto renderiza PerfilCliente */}
    </IntegratedLayoutEntrenador>
  );
};

export default LayoutEntrenador;
