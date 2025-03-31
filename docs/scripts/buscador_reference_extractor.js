const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configurações
const ROOT_DIR = process.argv[2] || ".";
const OUTPUT_FILE = "buscador_inteligente_reference.json";
const EXTENSIONS_TO_PARSE = [".ts", ".js", ".json", ".md"];
const DIRECTORIES_TO_SKIP = ["node_modules", "dist", "coverage", ".git"];

// Estrutura principal
const referenceDoc = {
  project: "buscador_inteligente",
  version: "1.0.0",
  createdAt: new Date().toISOString().split("T")[0],
  description:
    "Documentação completa do projeto buscador_inteligente para referência e integração",
  structure: {
    types: {},
    tools: {},
    services: {},
    endpoints: {},
    configs: {},
  },
  files: [],
};

/**
 * Função principal que executa o script
 */
async function main() {
  console.log(`📁 Analisando diretório: ${ROOT_DIR}`);

  // Obter a estrutura básica de diretórios
  const fileStructure = getDirectoryStructure(ROOT_DIR);
  referenceDoc.fileStructure = fileStructure;

  // Encontrar todos os arquivos relevantes
  const allFiles = findAllFiles(ROOT_DIR);
  console.log(`🔍 Encontrados ${allFiles.length} arquivos para analisar`);

  // Processar cada arquivo
  for (const filePath of allFiles) {
    try {
      processFile(filePath);
    } catch (error) {
      console.error(`❌ Erro ao processar arquivo ${filePath}:`, error.message);
    }
  }

  // Extrair tipos de TypeScript (simplificado nesta versão)
  extractTypes();

  // Extrair endpoints de API
  extractEndpoints();

  // Salvar o documento de referência
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(referenceDoc, null, 2));
  console.log(`✅ Documento de referência salvo em ${OUTPUT_FILE}`);
}

/**
 * Obtém a estrutura básica de diretórios
 */
function getDirectoryStructure(dir, basePath = "") {
  const result = {};
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);

    if (DIRECTORIES_TO_SKIP.includes(item)) continue;

    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      result[item] = getDirectoryStructure(itemPath, relativePath);
    }
  }

  return result;
}

/**
 * Encontra todos os arquivos no diretório que correspondem às extensões desejadas
 */
function findAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (DIRECTORIES_TO_SKIP.includes(item)) continue;

    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      findAllFiles(itemPath, files);
    } else {
      const ext = path.extname(item);
      if (EXTENSIONS_TO_PARSE.includes(ext)) {
        files.push(itemPath);
      }
    }
  }

  return files;
}

/**
 * Processa um arquivo e extrai informações relevantes
 */
function processFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const extension = path.extname(filePath);
  const content = fs.readFileSync(filePath, "utf-8");

  const fileInfo = {
    path: relativePath,
    type: getFileType(filePath),
    size: fs.statSync(filePath).size,
    extension: extension,
    modifiedAt: fs.statSync(filePath).mtime.toISOString(),
  };

  // Extrair informações adicionais com base no tipo de arquivo
  if (extension === ".ts" || extension === ".js") {
    fileInfo.exports = extractExports(content);
    fileInfo.imports = extractImports(content);
    fileInfo.functions = extractFunctions(content);
  } else if (extension === ".json") {
    try {
      fileInfo.jsonSummary = summarizeJson(content);
    } catch (error) {
      fileInfo.error = "Falha ao analisar JSON";
    }
  } else if (extension === ".md") {
    fileInfo.mdSummary = summarizeMarkdown(content);
  }

  // Categorizar o arquivo com base no caminho
  categorizeFile(fileInfo, relativePath);

  // Adicionar à lista de arquivos
  referenceDoc.files.push(fileInfo);
}

/**
 * Determina o tipo de arquivo com base no caminho
 */
function getFileType(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);

  if (relativePath.includes("/types/")) return "type";
  if (relativePath.includes("/tools/")) return "tool";
  if (relativePath.includes("/services/")) return "service";
  if (relativePath.includes("/controllers/")) return "controller";
  if (relativePath.includes("/routes/")) return "route";
  if (relativePath.includes("/middleware/")) return "middleware";
  if (relativePath.includes("/utils/")) return "utility";
  if (relativePath.includes("/config/") || relativePath.includes("config."))
    return "config";
  if (relativePath.endsWith(".md")) return "documentation";

  return "other";
}

/**
 * Extrai exportações de arquivos TypeScript/JavaScript
 */
function extractExports(content) {
  const exports = [];

  // Expressões regulares simplificadas para encontrar exportações
  const exportPatterns = [
    /export\s+(const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
    /export\s+\{([^}]+)\}/g,
    /export\s+default\s+(\w+)/g,
  ];

  for (const pattern of exportPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[2]) {
        exports.push({
          type: match[1],
          name: match[2],
        });
      } else if (match[1] && !match[2]) {
        // Para export default ou export { ... }
        const items = match[1].split(",").map((item) => item.trim());
        exports.push(...items.map((item) => ({ name: item })));
      }
    }
  }

  return exports;
}

/**
 * Extrai importações de arquivos TypeScript/JavaScript
 */
function extractImports(content) {
  const imports = [];
  const importPattern = /import\s+(?:{([^}]+)}\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const items = match[1]
      ? match[1].split(",").map((item) => item.trim())
      : [];
    imports.push({
      source: match[2],
      items: items,
    });
  }

  return imports;
}

/**
 * Extrai funções declaradas no arquivo
 */
function extractFunctions(content) {
  const functions = [];
  const functionPattern =
    /(function|const|let|var)\s+(\w+)\s*=?\s*(async)?\s*(\(.*?\)|=>)/g;

  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    functions.push({
      type: match[1],
      name: match[2],
      isAsync: !!match[3],
      params: extractParams(match[4]),
    });
  }

  return functions;
}

/**
 * Extrai parâmetros de uma função
 */
function extractParams(paramsString) {
  if (!paramsString || paramsString === "()" || paramsString === "=>")
    return [];

  // Remove parênteses e seta
  let cleaned = paramsString.replace(/\(|\)|=>/g, "").trim();

  // Divide pelos parâmetros
  return cleaned.split(",").map((param) => param.trim());
}

/**
 * Resumo simplificado de arquivos JSON
 */
function summarizeJson(content) {
  try {
    const json = JSON.parse(content);
    const keys = Object.keys(json);

    return {
      keys,
      size: Buffer.from(content).length,
      topLevelItemCount: keys.length,
    };
  } catch (error) {
    return { error: "Falha ao analisar JSON" };
  }
}

/**
 * Resumo simplificado de arquivos Markdown
 */
function summarizeMarkdown(content) {
  const headings = [];
  const headingPattern = /^(#{1,6})\s+(.+)$/gm;

  let match;
  while ((match = headingPattern.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }

  return {
    headings,
    charCount: content.length,
    lineCount: content.split("\n").length,
  };
}

/**
 * Categoriza um arquivo com base no caminho
 */
function categorizeFile(fileInfo, relativePath) {
  if (fileInfo.type === "type") {
    referenceDoc.structure.types[relativePath] = fileInfo;
  } else if (fileInfo.type === "tool") {
    referenceDoc.structure.tools[relativePath] = fileInfo;
  } else if (fileInfo.type === "service") {
    referenceDoc.structure.services[relativePath] = fileInfo;
  } else if (fileInfo.type === "config") {
    referenceDoc.structure.configs[relativePath] = fileInfo;
  }
}

/**
 * Extrai tipos de TypeScript de forma simplificada
 */
function extractTypes() {
  const typesFiles = referenceDoc.files.filter((file) => file.type === "type");

  // Esta é uma versão simplificada. Uma versão mais avançada usaria
  // o TypeScript Compiler API para extrair tipos com precisão.
  for (const file of typesFiles) {
    console.log(`🔍 Analisando tipos em ${file.path}`);

    // Adiciona informações de tipo para referência
    referenceDoc.structure.types[file.path] = {
      ...referenceDoc.structure.types[file.path],
      typesSummary: {
        exportCount: file.exports ? file.exports.length : 0,
        path: file.path,
      },
    };
  }
}

/**
 * Extrai endpoints de API com base nos arquivos de rota
 */
function extractEndpoints() {
  const routeFiles = referenceDoc.files.filter(
    (file) =>
      file.type === "route" ||
      file.path.includes("routes") ||
      file.path.includes("server.ts")
  );

  // Padrão simplificado para identificar definições de rota
  const routePattern =
    /(app|router)\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;

  for (const file of routeFiles) {
    const content = fs.readFileSync(path.join(ROOT_DIR, file.path), "utf-8");

    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[2].toUpperCase();
      const endpoint = match[3];

      referenceDoc.structure.endpoints[`${method} ${endpoint}`] = {
        method,
        path: endpoint,
        definedIn: file.path,
      };
    }
  }

  // Verificar também documentação API em arquivos Swagger/OpenAPI
  const swaggerFiles = referenceDoc.files.filter(
    (file) => file.path.includes("swagger") || file.path.includes("openapi")
  );

  for (const file of swaggerFiles) {
    console.log(`🔍 Analisando API docs em ${file.path}`);
    // Em uma versão mais avançada, poderíamos parse arquivos Swagger/OpenAPI
  }
}

// Executa o script
main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
