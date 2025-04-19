import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

interface ApiKey {
  key: string;
  project: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

interface MCPServer {
  command: string;
  args: string[];
  env: Record<string, string>;
  alwaysAllow?: string[];
}

interface MCPConfig {
  mcpServers: Record<string, MCPServer>;
}

const API_KEYS_FILE = path.join(process.cwd(), "config", "api-keys.json");
const MCP_CONFIG_FILE = path.join(process.cwd(), "config", "mcp.json");

// Função para gerar uma nova chave de API
export async function generateApiKey(
  project: string,
  permissions: string[] = ["*"]
): Promise<ApiKey> {
  const key = crypto.randomBytes(16).toString("hex");
  const apiKey: ApiKey = {
    key,
    project,
    createdAt: new Date().toISOString(),
    permissions,
  };

  // Carregar chaves existentes
  let keys: ApiKey[] = [];
  try {
    const content = await fs.readFile(API_KEYS_FILE, "utf-8");
    keys = JSON.parse(content);
  } catch (error) {
    // Arquivo não existe ainda, começar com array vazio
  }

  // Adicionar nova chave
  keys.push(apiKey);

  // Salvar chaves
  await fs.mkdir(path.dirname(API_KEYS_FILE), { recursive: true });
  await fs.writeFile(API_KEYS_FILE, JSON.stringify(keys, null, 2));

  return apiKey;
}

// Função para validar uma chave de API
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  try {
    const content = await fs.readFile(API_KEYS_FILE, "utf-8");
    const keys: ApiKey[] = JSON.parse(content);

    const apiKey = keys.find((k) => k.key === key);
    if (apiKey) {
      // Atualizar lastUsed
      apiKey.lastUsed = new Date().toISOString();
      await fs.writeFile(API_KEYS_FILE, JSON.stringify(keys, null, 2));
      return apiKey;
    }
  } catch (error) {
    console.error("Erro ao validar API key:", error);
  }
  return null;
}

// Função para validar token MCP
function validateMcpToken(token: string): boolean {
  // Verificar se o token corresponde ao configurado no ambiente
  return token === process.env.MCP_AUTH_TOKEN;
}

// Função para verificar se o endpoint está na lista de always allow
async function isAllowedEndpoint(
  path: string,
  method: string
): Promise<boolean> {
  try {
    const content = await fs.readFile(MCP_CONFIG_FILE, "utf-8");
    const config = JSON.parse(content) as MCPConfig;

    const endpoint = `${method.toLowerCase()}_${path
      .replace(/\//g, "_")
      .slice(1)}`;

    for (const server of Object.values(config.mcpServers)) {
      if (server.alwaysAllow?.includes(endpoint)) {
        return true;
      }
    }
  } catch (error) {
    console.error("Erro ao verificar endpoint permitido:", error);
  }
  return false;
}

// Middleware de autenticação
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Verificar se o endpoint está na lista de always allow
  const isAllowed = await isAllowedEndpoint(req.path, req.method);
  if (isAllowed) {
    return next();
  }

  // Verificar API Key
  const apiKey = req.header("x-api-key");
  if (apiKey) {
    const validApiKey = await validateApiKey(apiKey);
    if (validApiKey) {
      (req as any).apiKey = validApiKey;
      return next();
    }
  }

  // Verificar MCP Token
  const mcpToken = req.header("mcp-auth-token");
  if (mcpToken && validateMcpToken(mcpToken)) {
    (req as any).mcpToken = mcpToken;
    return next();
  }

  // Se nenhuma autenticação for válida
  return res.status(401).json({
    error: "Autenticação inválida",
    message:
      "Forneça uma chave de API válida no header x-api-key ou um token MCP válido no header mcp-auth-token",
  });
}

// Script para gerar uma nova chave de API
export async function createApiKey(project: string): Promise<string> {
  try {
    const apiKey = await generateApiKey(project);
    return apiKey.key;
  } catch (error) {
    console.error("Erro ao gerar chave de API:", error);
    throw error;
  }
}
