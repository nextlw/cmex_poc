import React, { useState } from "react";
import AtributosAnalyzer from "../AtributosAnalyzer";
import { AtributoNCM } from "../../types/atributos";
import "./styles.css"; // Vamos usar um arquivo CSS externo

/**
 * Componente de exemplo para demonstrar o uso do AtributosAnalyzer
 */
const AtributosExample: React.FC = () => {
  const [ncmCode, setNcmCode] = useState<string>("33079000");
  const [contexto, setContexto] = useState<Record<string, any>>({
    categoriaProduto: "Cosméticos",
    finalidadeProduto: "Perfumaria",
    modalidadeOperacao: "Importação",
  });
  const [atributosSelecionados, setAtributosSelecionados] = useState<
    AtributoNCM[]
  >([]);

  const handleNcmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNcmCode(e.target.value.replace(/\D/g, ""));
  };

  const handleAtributosSelected = (atributos: AtributoNCM[]) => {
    setAtributosSelecionados(atributos);
    console.log(`${atributos.length} atributos selecionados pelo agente`);
  };

  return (
    <div className="atributos-example-container">
      <div className="atributos-example-controls">
        <h2>Analisador de Atributos NCM</h2>
        <p>
          Este exemplo demonstra como o agente especializado analisa e seleciona
          atributos relevantes para um NCM com base no contexto do produto.
        </p>

        <div className="input-group">
          <label htmlFor="ncm-input">Código NCM:</label>
          <input
            id="ncm-input"
            type="text"
            value={ncmCode}
            onChange={handleNcmChange}
            placeholder="Digite o código NCM (8 dígitos)"
            maxLength={8}
          />
          <small>Ex: 33079000 (Cosméticos)</small>
        </div>

        <div className="context-inputs">
          <h3>Contexto do Produto</h3>
          <div className="input-group">
            <label htmlFor="categoria-input">Categoria:</label>
            <input
              id="categoria-input"
              type="text"
              value={contexto.categoriaProduto}
              onChange={(e) =>
                setContexto({ ...contexto, categoriaProduto: e.target.value })
              }
              placeholder="Categoria do produto"
            />
          </div>

          <div className="input-group">
            <label htmlFor="finalidade-input">Finalidade:</label>
            <input
              id="finalidade-input"
              type="text"
              value={contexto.finalidadeProduto}
              onChange={(e) =>
                setContexto({ ...contexto, finalidadeProduto: e.target.value })
              }
              placeholder="Finalidade do produto"
            />
          </div>
        </div>
      </div>

      <div className="atributos-example-result">
        {ncmCode.length === 8 ? (
          <AtributosAnalyzer
            ncmCode={ncmCode}
            contexto={contexto}
            onAtributosSelected={handleAtributosSelected}
          />
        ) : (
          <div className="invalid-ncm-message">
            Digite um código NCM completo (8 dígitos) para ver a análise
          </div>
        )}
      </div>

      <div className="atributos-example-stats">
        <h3>Resumo</h3>
        <p>
          {atributosSelecionados.length > 0
            ? `${atributosSelecionados.length} atributos selecionados pelo agente.`
            : "Nenhum atributo selecionado."}
        </p>
        <p>
          {atributosSelecionados.filter((a) => a.obrigatorio).length > 0
            ? `${
                atributosSelecionados.filter((a) => a.obrigatorio).length
              } atributos são obrigatórios.`
            : "Nenhum atributo obrigatório."}
        </p>
      </div>
    </div>
  );
};

export default AtributosExample;
