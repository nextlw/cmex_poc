import React from "react";
import "./styles.css";
import { PageHeaderProps } from "./types";

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, icon_size}) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="page-header-icon">{icon ? React.cloneElement(icon, { size: icon_size}) : null}</div>
        <h1 className="page-header-text text-2xl font-bold text-white">{title}</h1>
      </div>
    </div>
  );
};

export default PageHeader;
