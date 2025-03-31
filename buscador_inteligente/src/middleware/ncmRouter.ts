import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { consultarNCM } from "../controllers/ncm";
import { processarDeepResearch } from "../controllers/deepResearchNCM";

// Extende a interface Request para incluir o resultado do FastAPI
declare global {
  namespace Express {
    interface Request {
      fastApiResult?: any;
    }
  }
}

// Configurações de endpoints
const FASTAPI_ENDPOINT =
  process.env.FASTAPI_ENDPOINT || "http://localhost:10000/api/ncm";

/**
 * Middleware para roteamento de requisições NCM.
 * - Se useDeepResearch=false: Direciona diretamente para FastAPI
 * - Se useDeepResearch=true: Consulta FastAPI e passa para processamento adicional no Node.js
 * - Se em ambiente de desenvolvimento com mock: Usa o controlador NCM existente
 */
export async function ncmRouter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Se estamos em modo mock, usa o processamento local diretamente
  if (
    process.env.NODE_ENV === "development" &&
    process.env.MOCK_RESPONSES === "true"
  ) {
    await consultarNCM(req, res);
    return;
  }

  const {
    consulta,
    estadoOrigem,
    operacao,
    regimeTributario,
    tributacao,
    modelo,
    useDeepResearch,
  } = req.body;

  try {
    // Validação básica dos parâmetros
    if (!consulta || !estadoOrigem) {
      res.status(400).json({
        status_code: 400,
        errors: [
          {
            loc: ["body"],
            msg: "Dados obrigatórios não fornecidos",
            type: "error.invalid_request",
            ctx: { dados_fornecidos: Object.keys(req.body) },
          },
        ],
        message: "Requisição inválida",
        error_type: "invalid_request",
      });
      return;
    }

    // Sempre consulta o FastAPI primeiro (fluxo padrão)
    console.log(`Consultando FastAPI para NCM: ${consulta}`);

    try {
      const fastApiResponse = await axios.post(FASTAPI_ENDPOINT, {
        consulta,
        estadoOrigem,
        operacao,
        regimeTributario,
        tributacao,
      });

      // Se DeepResearch não estiver ativado, retorna resposta do FastAPI diretamente
      if (!useDeepResearch) {
        console.log("Fluxo padrão: Retornando resposta direta do FastAPI");
        res.status(200).json(fastApiResponse.data);
        return;
      }

      // Se DeepResearch estiver ativado, envia para processamento adicional
      console.log(
        "Fluxo DeepResearch: Enviando para análise profunda com FastAPI data"
      );
      req.fastApiResult = fastApiResponse.data;
      await processarDeepResearch(req, res);
    } catch (error: any) {
      // Se erro de conexão com FastAPI, tenta rota alternativa com modelo local se DeepResearch ativado
      if (
        useDeepResearch &&
        (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND")
      ) {
        console.log(
          "FastAPI indisponível, processando via DeepResearch diretamente"
        );
        req.fastApiResult = null; // Indica que não temos dados do FastAPI
        await processarDeepResearch(req, res);
        return;
      }

      // Caso contrário, retorna erro
      res.status(500).json({
        status_code: 500,
        errors: [
          {
            loc: ["fastapi"],
            msg: "Erro ao consultar base de dados",
            type: "error.fastapi_error",
            ctx: { error_message: error.message },
          },
        ],
        message: "Erro ao consultar base de dados",
        error_type: "fastapi_error",
      });
    }
  } catch (error: any) {
    console.error("Erro na execução do middleware NCM:", error);
    res.status(500).json({
      status_code: 500,
      errors: [
        {
          loc: ["server"],
          msg: "Erro interno no servidor",
          type: "error.server_error",
          ctx: { error_message: error.message },
        },
      ],
      message: "Erro interno no servidor",
      error_type: "server_error",
    });
  }
}
