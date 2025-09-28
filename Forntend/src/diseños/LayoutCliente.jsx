import React from "react";
import { Outlet } from "react-router-dom";
import IntegratedLayoutCliente from "../componentes/IntegratedLayoutCliente";


const LayoutCliente= () => {
  return (
    <IntegratedLayoutCliente>
      <Outlet /> {/* Esto renderiza PerfilCliente */}
    </IntegratedLayoutCliente>
  );
};

export default LayoutCliente;
