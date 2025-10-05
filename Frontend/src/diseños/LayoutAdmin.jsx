// LayoutAdmin.jsx - SIMPLIFICADO
import React from "react";
import { Outlet } from "react-router-dom";
import IntegratedLayout from "../componentes/IntegratedLayout";

const LayoutAdmin = () => {
  return (
    <IntegratedLayout>
      <Outlet /> {/* Esto renderiza PerfilAdmin */}
    </IntegratedLayout>
  );
};

export default LayoutAdmin;