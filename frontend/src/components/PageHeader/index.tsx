import React from "react";
import "./styles.css";
import { PageHeaderProps } from "./types";

const PageHeader: React.FC<PageHeaderProps> = ({ title, icon }) => {
  return (
    <div className="page-header gap-2 display-4 flex items-center">
      {icon}
      <h1 className="gap-2 display-4 flex items-center">{title}</h1>
    </div>
  );
};

export default PageHeader;
