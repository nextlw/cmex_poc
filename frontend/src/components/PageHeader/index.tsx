import React from "react";
import "./styles.css";
import { PageHeaderProps } from "./types";

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, iconSize = 22 }) => {
  return (
    <div className="page-header">
      <div className="flex items-center gap-2">
        <div style={{ fontSize: iconSize }}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
    </div>
  );
};

export default PageHeader;
