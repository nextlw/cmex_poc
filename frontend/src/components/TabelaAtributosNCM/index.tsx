/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable react/jsx-uses-react */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-empty-function */
// @ts-nocheck

import React from "react";
import {
  FaFileImport,
  FaFileExport,
  FaGlobeAmericas,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  BsListCheck,
  BsToggleOn,
  BsTextParagraph,
  BsCalendarDate,
} from "react-icons/bs";
import { TbNumbers } from "react-icons/tb";
import {
  AtributoNCM,
  FormaPreenchimento,
  Modalidade,
  TabelaAtributosNCMProps,
  IconProps,
} from "./types";
import "./styles.css";
import EmptyTableState from "./EmptyTableState";

const IconContainer: React.FC<IconProps> = ({ title, children, className }) => (
  <div className={`icon-container ${className}`} title={title}>
    {children}
  </div>
);

const TabelaAtributosNCM: React.FC<TabelaAtributosNCMProps> = ({
  atributos = [],
  isLoading = false,
  error = null,
}) => {
  const renderModalidadeIcon = (
    modalidade?: Modalidade
  ): React.ReactElement | null => {
    if (!modalidade) return null;

    switch (modalidade) {
      case Modalidade.IMPORTACAO:
        return (
          <IconContainer title="Importação" className="importacao">
            <FaFileImport />
          </IconContainer>
        );
      case Modalidade.EXPORTACAO:
        return (
          <IconContainer title="Exportação" className="exportacao">
            <FaFileExport />
          </IconContainer>
        );
      case Modalidade.AMBOS:
        return (
          <IconContainer title="Importação e Exportação" className="ambos">
            <FaGlobeAmericas />
          </IconContainer>
        );
      default:
        return null;
    }
  };

  const renderFormaPreenchimentoIcon = (
    forma?: FormaPreenchimento
  ): React.ReactElement | null => {
    if (!forma) return null;

    switch (forma) {
      case FormaPreenchimento.LISTA_ESTATICA:
      case FormaPreenchimento.LISTA_DINAMICA:
      case FormaPreenchimento.LISTA_TABX_FILTRO:
      case FormaPreenchimento.DOMINIO_DINAMICO:
        return (
          <IconContainer title="Lista de opções" className="lista">
            <BsListCheck />
          </IconContainer>
        );
      case FormaPreenchimento.BOOLEANO:
        return (
          <IconContainer title="Booleano (Sim/Não)" className="booleano">
            <BsToggleOn />
          </IconContainer>
        );
      case FormaPreenchimento.TEXTO:
        return (
          <IconContainer title="Texto livre" className="texto">
            <BsTextParagraph />
          </IconContainer>
        );
      case FormaPreenchimento.NUMERO_INTEIRO:
      case FormaPreenchimento.NUMERO_REAL:
        return (
          <IconContainer title="Número" className="numero">
            <TbNumbers />
          </IconContainer>
        );
      case FormaPreenchimento.DATA:
      case FormaPreenchimento.DATA_HORA:
        return (
          <IconContainer title="Data" className="data">
            <BsCalendarDate />
          </IconContainer>
        );
      case FormaPreenchimento.COMPOSTO:
        return (
          <IconContainer title="Composto" className="composto">
            <BsListCheck />
          </IconContainer>
        );
      default:
        // Tratamento para valores desconhecidos
        console.warn(`Forma de preenchimento desconhecida: ${forma}`);
        return (
          <IconContainer title="Tipo desconhecido" className="desconhecido">
            <BsTextParagraph />
          </IconContainer>
        );
    }
  };

  const renderObrigatorioIcon = (
    obrigatorio?: boolean
  ): React.ReactElement | null => {
    if (obrigatorio === undefined) return null;

    return obrigatorio ? (
      <IconContainer title="Preenchimento obrigatório" className="obrigatorio">
        <FaTimes />
      </IconContainer>
    ) : (
      <IconContainer title="Preenchimento opcional" className="opcional">
        <FaCheck />
      </IconContainer>
    );
  };

  const getFormaPreenchimentoText = (forma?: FormaPreenchimento): string => {
    if (!forma) return "";

    switch (forma) {
      case FormaPreenchimento.LISTA_ESTATICA:
        return "Lista estática";
      case FormaPreenchimento.LISTA_DINAMICA:
        return "Lista dinâmica";
      case FormaPreenchimento.LISTA_TABX_FILTRO:
        return "Lista filtrada";
      case FormaPreenchimento.DOMINIO_DINAMICO:
        return "Domínio dinâmico";
      case FormaPreenchimento.BOOLEANO:
        return "Booleano";
      case FormaPreenchimento.TEXTO:
        return "Texto";
      case FormaPreenchimento.NUMERO_INTEIRO:
        return "Número inteiro";
      case FormaPreenchimento.NUMERO_REAL:
        return "Número real";
      case FormaPreenchimento.DATA:
        return "Data";
      case FormaPreenchimento.DATA_HORA:
        return "Data e hora";
      case FormaPreenchimento.COMPOSTO:
        return "Composto";
      default:
        // Tratamento para valores desconhecidos
        return `${forma}`;
    }
  };

  if (isLoading) {
    return (
      <div className="tabela-atributos-container">
        <div className="loading">Carregando atributos NCM...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tabela-atributos-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!atributos || atributos.length === 0) {
    return (
      <div className="tabela-atributos-container tabela-vazia-container">
        <table className="tabela-atributos tabela-vazia">
          <thead>
            <tr>
              <th className="col-codigo">Código</th>
              <th className="col-apresentacao">Apresentação</th>
              <th className="col-orientacao">Orientação</th>
              <th className="col-preenchimento">Preenchimento</th>
              <th className="col-obrigatorio" title="Obrigatório">
                Obr
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5}>
                <EmptyTableState />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="tabela-atributos-container">
      <div className="tabela-wrapper overflow-x-auto">
        <table className="tabela-atributos">
          <thead>
            <tr>
              <th className="col-codigo">Código</th>
              <th className="col-apresentacao">Apresentação</th>
              <th className="col-orientacao">Orientação</th>
              <th className="col-preenchimento">Preenchimento</th>
              <th className="col-obrigatorio" title="Obrigatório">
                Obr
              </th>
            </tr>
          </thead>
          <tbody>
            {atributos.map((atributo) => (
              <tr key={atributo.codigo}>
                <td className="col-codigo">
                  {renderModalidadeIcon(atributo.modalidade)}
                  <span>{atributo.codigo}</span>
                </td>
                <td className="col-apresentacao">
                  {atributo.nomeApresentacao}
                </td>
                <td className="col-orientacao truncate">
                  <div className="orientacao-text" title={atributo.nome}>
                    {atributo.nome}
                  </div>
                </td>
                <td className="col-preenchimento">
                  {renderFormaPreenchimentoIcon(atributo.formaPreenchimento)}
                  <span>
                    {getFormaPreenchimentoText(atributo.formaPreenchimento)}
                  </span>
                </td>
                <td className="col-obrigatorio">
                  {renderObrigatorioIcon(atributo.obrigatorio)}
                  <span>{atributo.obrigatorio ? "SIM" : "NÃO"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabelaAtributosNCM;
