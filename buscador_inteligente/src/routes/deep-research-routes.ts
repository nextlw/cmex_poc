import express, { Router, Request, Response, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { DeepResearchService } from "../services/deep-research-service";
import { TokenTracker } from "../utils/token-tracker";
import { ActionTracker } from "../utils/action-tracker";

const router = Router();
const deepResearchService = DeepResearchService.getInstance();

// Mapa para armazenar contexto de rastreadores por requestId
const trackers = new Map<
  string,
  {
    tokenTracker: TokenTracker;
    actionTracker: ActionTracker;
    outputs: string[];
  }
>();

/**
 * @swagger
 * /deep-research:
 *   post:
 *     tags:
 *       - DeepResearch
 *     summary: Inicia uma pesquisa profunda
 *     description: Inicia um processo de pesquisa profunda com base em uma consulta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Consulta a ser pesquisada
 *                 example: "Como funciona a tributação de importação de smartphones?"
 *     responses:
 *       "200":
 *         description: Pesquisa iniciada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *                   description: ID da requisição para acompanhamento
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       "400":
 *         description: Parâmetros inválidos
 *       "500":
 *         description: Erro interno do servidor
 */
router.post("/", ((req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      res.status(400).json({
        error: "Query é obrigatória para iniciar uma pesquisa profunda",
      });
      return;
    }

    // Gerar ID único para a pesquisa
    const requestId = uuidv4();

    // Configurar rastreadores
    const tokenTracker = new TokenTracker();
    const actionTracker = new ActionTracker({ requestId }); // Passando o requestId necessário
    trackers.set(requestId, {
      tokenTracker,
      actionTracker,
      outputs: [],
    });

    // Iniciar pesquisa profunda
    deepResearchService.startResearch({
      query,
      requestId,
      options: {
        autoSelectModel: true,
        includeReferences: true,
      },
    });

    // Retornar ID da pesquisa
    res.status(200).json({
      requestId,
      message: "Pesquisa profunda iniciada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao iniciar pesquisa profunda:", error);
    res.status(500).json({
      error: "Erro ao iniciar pesquisa profunda",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}) as RequestHandler);

/**
 * @swagger
 * /deep-research/{requestId}:
 *   get:
 *     tags:
 *       - DeepResearch
 *     summary: Obtém o resultado de uma pesquisa profunda
 *     description: Retorna o resultado de uma pesquisa profunda com base no ID da requisição
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da requisição de pesquisa profunda
 *     responses:
 *       "200":
 *         description: Resultado obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, error]
 *                   description: Status da pesquisa
 *                 result:
 *                   type: object
 *                   description: Resultado da pesquisa (quando completada)
 *       "404":
 *         description: Pesquisa não encontrada
 *       "500":
 *         description: Erro interno do servidor
 */
router.get("/:requestId", ((req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      res.status(400).json({
        error: "ID da pesquisa é obrigatório",
      });
      return;
    }

    // Obter resultado
    const result = deepResearchService.getResearchResult(requestId);

    if (!result) {
      res.status(404).json({
        error: "Pesquisa não encontrada ou expirada",
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao obter resultado da pesquisa:", error);
    res.status(500).json({
      error: "Erro ao obter resultado da pesquisa",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}) as RequestHandler);

/**
 * @swagger
 * /deep-research/{requestId}:
 *   delete:
 *     tags:
 *       - DeepResearch
 *     summary: Cancela uma pesquisa profunda
 *     description: Cancela uma pesquisa profunda em andamento
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da requisição de pesquisa profunda
 *     responses:
 *       "200":
 *         description: Pesquisa cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       "404":
 *         description: Pesquisa não encontrada ou já concluída
 *       "500":
 *         description: Erro interno do servidor
 */
router.delete("/:requestId", ((req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      res.status(400).json({
        error: "ID da pesquisa é obrigatório",
      });
      return;
    }

    // Cancelar pesquisa
    const canceled = deepResearchService.cancelResearch(requestId);

    if (!canceled) {
      res.status(404).json({
        error: "Pesquisa não encontrada, já concluída ou já cancelada",
      });
      return;
    }

    res.status(200).json({
      message: "Pesquisa cancelada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao cancelar pesquisa:", error);
    res.status(500).json({
      error: "Erro ao cancelar pesquisa",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}) as RequestHandler);

export default router;
