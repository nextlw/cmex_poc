const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configurações
const ROOT_DIR = process.argv[2] || ".";
const OUTPUT_FILE = "node_deepresearch_reference.json";
const EXTENSIONS_TO_PARSE = [".ts", ".js", ".json", ".txt", ".md"];
const DIRECTORIES_TO_SKIP = ["node_modules", "dist", "coverage", ".git"];

// Estrutura principal
const referenceDoc = {
  project: "node-DeepResearch-jina",
  version: "1.0.0",
  createdAt: new Date().toISOString().split("T")[0],
  description:
    "Documentação completa do projeto node-DeepResearch-jina para referência e integração",
  structure: {
    types: {},
    tools: {},
    services: {},
    config: {},
    prompts: {},
    data: {},
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

  // Extrair informações específicas
  extractTypeScriptTypes();
  extractToolDefinitions();
  extractPrompts();

  // Salvar o documento de referência
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(referenceDoc, null, 2));
  console.log(`✅ Documento de referência salvo em ${OUTPUT_FILE}`);
}

/**
 * Obtém a estrutura básica de diretórios
 */
function getDirectoryStructure(dir, basePath = "") {
  const result = {};
  let items;

  try {
    items = fs.readdirSync(dir);
  } catch (error) {
    console.log(`⚠️ Não foi possível ler o diretório ${dir}: ${error.message}`);
    return result;
  }

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);

    if (DIRECTORIES_TO_SKIP.includes(item)) continue;

    try {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        result[item] = getDirectoryStructure(itemPath, relativePath);
      }
    } catch (error) {
      console.log(`⚠️ Ignorando item ${itemPath}: ${error.message}`);
    }
  }

  return result;
}

/**
 * Encontra todos os arquivos no diretório que correspondem às extensões desejadas
 */
function findAllFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      if (DIRECTORIES_TO_SKIP.includes(item)) continue;

      const itemPath = path.join(dir, item);

      try {
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          findAllFiles(itemPath, files);
        } else {
          const ext = path.extname(item);
          if (EXTENSIONS_TO_PARSE.includes(ext)) {
            files.push(itemPath);
          }
        }
      } catch (error) {
        console.log(`⚠️ Ignorando item ${itemPath}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`⚠️ Não foi possível ler o diretório ${dir}: ${error.message}`);
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
  const basename = path.basename(filePath);

  const fileInfo = {
    path: relativePath,
    type: getFileType(filePath, extension, basename),
    size: fs.statSync(filePath).size,
    extension: extension,
    modifiedAt: fs.statSync(filePath).mtime.toISOString(),
  };

  // Extrair informações adicionais com base no tipo de arquivo
  if (extension === ".ts" || extension === ".js") {
    fileInfo.classes = extractClasses(content);
    fileInfo.interfaces = extractInterfaces(content);
    fileInfo.functions = extractFunctions(content);
    fileInfo.imports = extractImports(content);
    fileInfo.exports = extractExports(content);
  } else if (extension === ".json") {
    try {
      fileInfo.jsonSummary = summarizeJson(content);
    } catch (error) {
      fileInfo.error = "Falha ao analisar JSON";
    }
  } else if (extension === ".txt" && basename.startsWith("prompt-")) {
    fileInfo.promptSummary = summarizePrompt(content);
  } else if (extension === ".md") {
    fileInfo.mdSummary = summarizeMarkdown(content);
  }

  // Categorizar o arquivo com base no tipo
  categorizeFile(fileInfo, relativePath);

  // Adicionar à lista de arquivos
  referenceDoc.files.push(fileInfo);
}

/**
 * Determina o tipo de arquivo com base no caminho, extensão e nome
 */
function getFileType(filePath, extension, basename) {
  const relativePath = path.relative(ROOT_DIR, filePath);

  if (extension === ".ts") {
    if (relativePath.includes("/tools/")) return "tool";
    if (relativePath.includes("/types/")) return "type";
    if (relativePath.includes("/services/")) return "service";
    if (relativePath.includes("/agents/") || relativePath.includes("agent.ts"))
      return "agent";
    return "typescript";
  }

  if (extension === ".js") {
    return "javascript";
  }

  if (extension === ".json") {
    if (basename === "config.json") return "config";
    if (basename === "package.json") return "package";
    if (basename === "tsconfig.json") return "tsconfig";
    if (basename === "knowledge.json") return "knowledge";
    if (basename === "queries.json") return "queries";
    return "data";
  }

  if (extension === ".txt" && basename.startsWith("prompt-")) {
    return "prompt";
  }

  if (extension === ".md") {
    return "documentation";
  }

  return "other";
}

/**
 * Extrai classes de arquivos TypeScript/JavaScript
 */
function extractClasses(content) {
  const classes = [];
  const classPattern =
    /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g;

  let match;
  while ((match = classPattern.exec(content)) !== null) {
    classes.push({
      name: match[1],
      extends: match[2] || null,
      implements: match[3] ? match[3].split(",").map((i) => i.trim()) : null,
      position: match.index,
    });
  }

  return classes;
}

/**
 * Extrai interfaces de arquivos TypeScript
 */
function extractInterfaces(content) {
  const interfaces = [];
  const interfacePattern = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?/g;

  let match;
  while ((match = interfacePattern.exec(content)) !== null) {
    interfaces.push({
      name: match[1],
      extends: match[2] ? match[2].split(",").map((e) => e.trim()) : null,
      position: match.index,
    });
  }

  return interfaces;
}

/**
 * Extrai funções de arquivos TypeScript/JavaScript
 */
function extractFunctions(content) {
  const functions = [];

  // Diferentes padrões de declaração de função
  const functionPatterns = [
    // function declaration
    /function\s+(\w+)\s*\(([^)]*)\)/g,
    // arrow function with const/let/var
    /(const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g,
    // method in class
    /(?:public|private|protected)?\s*(?:static)?\s*(?:async)?\s*(\w+)\s*\(([^)]*)\)/g,
    // export function
    /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
  ];

  for (const pattern of functionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // Verificar qual padrão foi encontrado e extrair o nome apropriadamente
      let name, params;
      if (pattern.toString().includes("const|let|var")) {
        name = match[2]; // Nome da variável para arrow functions
        params = match[3]; // Parâmetros para arrow functions
      } else if (pattern.toString().includes("public|private|protected")) {
        name = match[1]; // Nome do método
        params = match[2]; // Parâmetros do método
      } else {
        name = match[1]; // Nome da função
        params = match[2]; // Parâmetros da função
      }

      // Adicionar à lista de funções
      if (name) {
        functions.push({
          name: name,
          params: params
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p),
          isAsync: content
            .slice(Math.max(0, match.index - 20), match.index)
            .includes("async"),
        });
      }
    }
  }

  return functions;
}

/**
 * Extrai importações de arquivos TypeScript/JavaScript
 */
function extractImports(content) {
  const imports = [];
  const importPattern = /import\s+(?:{([^}]+)}\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    imports.push({
      items: match[1] ? match[1].split(",").map((item) => item.trim()) : [],
      source: match[2],
    });
  }

  return imports;
}

/**
 * Extrai exportações de arquivos TypeScript/JavaScript
 */
function extractExports(content) {
  const exports = [];
  const exportPatterns = [
    // export { ... }
    /export\s+{([^}]+)}/g,
    // export const/let/var/function/class/interface/type
    /export\s+(const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
    // export default
    /export\s+default\s+(\w+)/g,
  ];

  for (const pattern of exportPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (pattern.toString().includes("{")) {
        // export { ... }
        const items = match[1].split(",").map((item) => item.trim());
        exports.push(...items.map((item) => ({ name: item })));
      } else if (pattern.toString().includes("default")) {
        // export default
        exports.push({ name: match[1], isDefault: true });
      } else {
        // export const/let/var/function/class/interface/type
        exports.push({ type: match[1], name: match[2] });
      }
    }
  }

  return exports;
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
      topLevelStructure: keys.reduce((acc, key) => {
        const value = json[key];
        if (value === null) {
          acc[key] = "null";
        } else if (Array.isArray(value)) {
          acc[key] = `Array(${value.length})`;
        } else if (typeof value === "object") {
          acc[key] = `Object(${Object.keys(value).length} props)`;
        } else {
          acc[key] = typeof value;
        }
        return acc;
      }, {}),
    };
  } catch (error) {
    return { error: "Falha ao analisar JSON" };
  }
}

/**
 * Resumo simplificado de arquivos de prompt
 */
function summarizePrompt(content) {
  const lines = content.split("\n");
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    lineCount: lines.length,
    wordCount: wordCount,
    charCount: content.length,
    // Tenta extrair os primeiros 100 caracteres como preview
    preview:
      content.slice(0, 100).replace(/\n/g, " ") +
      (content.length > 100 ? "..." : ""),
  };
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
 * Categoriza um arquivo com base no tipo
 */
function categorizeFile(fileInfo, relativePath) {
  if (fileInfo.type === "type") {
    referenceDoc.structure.types[relativePath] = fileInfo;
  } else if (fileInfo.type === "tool") {
    referenceDoc.structure.tools[relativePath] = fileInfo;
  } else if (fileInfo.type === "service") {
    referenceDoc.structure.services[relativePath] = fileInfo;
  } else if (["config", "package", "tsconfig"].includes(fileInfo.type)) {
    referenceDoc.structure.config[relativePath] = fileInfo;
  } else if (fileInfo.type === "prompt") {
    referenceDoc.structure.prompts[relativePath] = fileInfo;
  } else if (["knowledge", "queries", "data"].includes(fileInfo.type)) {
    referenceDoc.structure.data[relativePath] = fileInfo;
  }
}

/**
 * Extrai tipos de TypeScript
 */
function extractTypeScriptTypes() {
  const typeFiles = referenceDoc.files.filter(
    (file) =>
      file.type === "type" ||
      (file.extension === ".ts" &&
        file.interfaces &&
        file.interfaces.length > 0)
  );

  for (const file of typeFiles) {
    console.log(`🔍 Analisando tipos em ${file.path}`);

    // Adicionar tipos para referência
    if (file.interfaces && file.interfaces.length > 0) {
      referenceDoc.structure.types[file.path] = {
        ...referenceDoc.structure.types[file.path],
        typesSummary: {
          interfaceCount: file.interfaces.length,
          classCount: file.classes ? file.classes.length : 0,
          exportCount: file.exports ? file.exports.length : 0,
          path: file.path,
        },
      };
    }
  }
}

/**
 * Extrai definições de ferramentas
 */
function extractToolDefinitions() {
  const toolFiles = referenceDoc.files.filter((file) => file.type === "tool");

  for (const file of toolFiles) {
    console.log(`🔍 Analisando ferramenta em ${file.path}`);

    // Adicionar ferramentas para referência
    referenceDoc.structure.tools[file.path] = {
      ...referenceDoc.structure.tools[file.path],
      toolSummary: {
        classCount: file.classes ? file.classes.length : 0,
        functionCount: file.functions ? file.functions.length : 0,
        exportCount: file.exports ? file.exports.length : 0,
        path: file.path,
      },
    };
  }
}

/**
 * Extrai informações de prompts
 */
function extractPrompts() {
  const promptFiles = referenceDoc.files.filter(
    (file) => file.type === "prompt"
  );

  for (const file of promptFiles) {
    console.log(`🔍 Analisando prompt em ${file.path}`);

    // Adicionar prompts para referência
    if (file.promptSummary) {
      referenceDoc.structure.prompts[file.path] = {
        ...referenceDoc.structure.prompts[file.path],
        summary: file.promptSummary,
      };
    }
  }
}

// Executa o script
main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
