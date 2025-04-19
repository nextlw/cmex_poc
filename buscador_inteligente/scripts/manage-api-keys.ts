import { generateApiKey, validateApiKey } from "../src/middleware/auth";
import fs from "fs/promises";
import path from "path";

const API_KEYS_FILE = path.join(process.cwd(), "config", "api-keys.json");

async function listApiKeys() {
  try {
    const content = await fs.readFile(API_KEYS_FILE, "utf-8");
    const keys = JSON.parse(content);
    console.log("\nChaves de API existentes:");
    console.table(
      keys.map((k) => ({
        Projeto: k.project,
        Chave: k.key,
        "Criado em": new Date(k.createdAt).toLocaleString(),
        "Último uso": k.lastUsed
          ? new Date(k.lastUsed).toLocaleString()
          : "Nunca",
        Permissões: k.permissions.join(", "),
      }))
    );
  } catch (error) {
    console.log("Nenhuma chave encontrada");
  }
}

async function createNewKey(project: string, permissions: string[] = ["*"]) {
  try {
    const apiKey = await generateApiKey(project, permissions);
    console.log("\nNova chave de API gerada:");
    console.log("------------------------");
    console.log(`Projeto: ${apiKey.project}`);
    console.log(`Chave: ${apiKey.key}`);
    console.log(`Criada em: ${new Date(apiKey.createdAt).toLocaleString()}`);
    console.log(`Permissões: ${apiKey.permissions.join(", ")}`);
    console.log("\nInstruções de uso:");
    console.log("----------------");
    console.log("Adicione o seguinte header em suas requisições:");
    console.log("x-api-key: " + apiKey.key);
  } catch (error) {
    console.error("Erro ao gerar nova chave:", error);
  }
}

async function deleteKey(key: string) {
  try {
    const content = await fs.readFile(API_KEYS_FILE, "utf-8");
    let keys = JSON.parse(content);
    keys = keys.filter((k) => k.key !== key);
    await fs.writeFile(API_KEYS_FILE, JSON.stringify(keys, null, 2));
    console.log(`Chave ${key} removida com sucesso`);
  } catch (error) {
    console.error("Erro ao remover chave:", error);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "create":
      if (!args[1]) {
        console.error(
          "Especifique o nome do projeto: node manage-api-keys.ts create <projeto>"
        );
        process.exit(1);
      }
      await createNewKey(args[1], args[2] ? args[2].split(",") : ["*"]);
      break;

    case "list":
      await listApiKeys();
      break;

    case "delete":
      if (!args[1]) {
        console.error(
          "Especifique a chave a ser removida: node manage-api-keys.ts delete <chave>"
        );
        process.exit(1);
      }
      await deleteKey(args[1]);
      break;

    case "validate":
      if (!args[1]) {
        console.error(
          "Especifique a chave a ser validada: node manage-api-keys.ts validate <chave>"
        );
        process.exit(1);
      }
      const isValid = await validateApiKey(args[1]);
      console.log(isValid ? "Chave válida" : "Chave inválida");
      break;

    default:
      console.log(`
Uso: node manage-api-keys.ts <comando> [argumentos]

Comandos disponíveis:
  create <projeto> [permissões]  Cria uma nova chave de API para o projeto
  list                          Lista todas as chaves existentes
  delete <chave>                Remove uma chave específica
  validate <chave>              Verifica se uma chave é válida

Exemplos:
  node manage-api-keys.ts create meu-projeto
  node manage-api-keys.ts create meu-projeto read,write
  node manage-api-keys.ts list
  node manage-api-keys.ts delete abc123
  node manage-api-keys.ts validate abc123
      `);
  }
}

main().catch(console.error);
