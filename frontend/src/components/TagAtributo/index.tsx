import React from "react";
import { TbSitemap } from "react-icons/tb";
import { IoClose } from "react-icons/io5";
import "./styles.css";
import { TagAtributoProps } from "./types";

const TagAtributo: React.FC<TagAtributoProps> = ({ atributo, onRemove }) => {
  return (
    <li className="item-atributos flex items-center gap-2 list-none w-fit px-2 py-1">
      <TbSitemap /> {atributo}
      <button onClick={() => onRemove(atributo)}>
        <IoClose />
      </button>
    </li>
  );
};

export default TagAtributo;
