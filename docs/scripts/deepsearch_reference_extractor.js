const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configurações
const ROOT_DIR = process.argv[2] || ".";
const OUTPUT_FILE = "deepsearch_ui_reference.json";
const EXTENSIONS_TO_PARSE = [".js", ".css", ".html", ".json", ".svg"];
const DIRECTORIES_TO_SKIP = ["node_modules", "dist", "coverage", ".git"];

// Estrutura principal
const referenceDoc = {
  project: "deepsearch-ui-jina",
  version: "1.0.0",
  createdAt: new Date().toISOString().split("T")[0],
  description:
    "Documentação completa do projeto deepsearch-ui-jina para referência e integração",
  structure: {
    components: {},
    styles: {},
    endpoints: {},
    configs: {},
    assets: {},
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
  extractHtmlElements();
  extractJavaScriptComponents();
  extractCssClasses();

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
    type: getFileType(filePath, extension),
    size: fs.statSync(filePath).size,
    extension: extension,
    modifiedAt: fs.statSync(filePath).mtime.toISOString(),
  };

  // Extrair informações adicionais com base no tipo de arquivo
  if (extension === ".js") {
    fileInfo.functions = extractFunctions(content);
    fileInfo.variables = extractVariables(content);
    fileInfo.eventListeners = extractEventListeners(content);
  } else if (extension === ".json") {
    try {
      fileInfo.jsonSummary = summarizeJson(content);
    } catch (error) {
      fileInfo.error = "Falha ao analisar JSON";
    }
  } else if (extension === ".html") {
    fileInfo.htmlSummary = summarizeHtml(content);
  } else if (extension === ".css") {
    fileInfo.cssSummary = summarizeCss(content);
  } else if ([".svg", ".png", ".ico"].includes(extension)) {
    fileInfo.assetType = "image";
  }

  // Categorizar o arquivo com base no tipo
  categorizeFile(fileInfo, relativePath);

  // Adicionar à lista de arquivos
  referenceDoc.files.push(fileInfo);
}

/**
 * Determina o tipo de arquivo com base no caminho e extensão
 */
function getFileType(filePath, extension) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const basename = path.basename(filePath);

  if (extension === ".js") return "javascript";
  if (extension === ".css") return "stylesheet";
  if (extension === ".html") return "html";
  if (extension === ".json") return "data";
  if ([".svg", ".png", ".ico"].includes(extension)) return "asset";

  // Verificações específicas por nome
  if (basename === "i18n.json") return "translation";
  if (basename.includes("config")) return "config";

  return "other";
}

/**
 * Extrai funções de arquivos JavaScript
 */
function extractFunctions(content) {
  const functions = [];

  // Padrão para funções normais
  const functionPattern =
    /function\s+(\w+)\s*\((.*?)\)|const\s+(\w+)\s*=\s*(?:async)?\s*(?:function)?\s*\((.*?)\)\s*=>?/g;

  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    const name = match[1] || match[3];
    const params = match[2] || match[4] || "";

    if (name) {
      functions.push({
        name: name,
        params: params
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p),
      });
    }
  }

  return functions;
}

/**
 * Extrai variáveis de arquivos JavaScript
 */
function extractVariables(content) {
  const variables = [];
  const variablePattern = /(const|let|var)\s+(\w+)\s*=/g;

  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    variables.push({
      type: match[1],
      name: match[2],
    });
  }

  return variables;
}

/**
 * Extrai event listeners de arquivos JavaScript
 */
function extractEventListeners(content) {
  const eventListeners = [];
  const eventPattern = /addEventListener\(['"](\w+)['"]/g;

  let match;
  while ((match = eventPattern.exec(content)) !== null) {
    eventListeners.push({
      event: match[1],
      position: match.index,
    });
  }

  return eventListeners;
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
 * Resumo simplificado de arquivos HTML
 */
function summarizeHtml(content) {
  // Contagem de tags importantes
  const tagCounts = {};
  const tagPattern = /<(\w+)[\s>]/g;

  let match;
  while ((match = tagPattern.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  // Identificar elementos por ID
  const idElements = [];
  const idPattern = /id=["']([^"']+)["']/g;

  while ((match = idPattern.exec(content)) !== null) {
    idElements.push(match[1]);
  }

  // Identificar classes
  const classNames = new Set();
  const classPattern = /class=["']([^"']+)["']/g;

  while ((match = classPattern.exec(content)) !== null) {
    match[1].split(/\s+/).forEach((cls) => {
      if (cls.trim()) classNames.add(cls.trim());
    });
  }

  return {
    tagCounts,
    idElements,
    classNames: Array.from(classNames),
    charCount: content.length,
    lineCount: content.split("\n").length,
  };
}

/**
 * Resumo simplificado de arquivos CSS
 */
function summarizeCss(content) {
  // Extrair seletores CSS
  const selectors = [];
  const selectorPattern = /([^{]+)\s*\{/g;

  let match;
  while ((match = selectorPattern.exec(content)) !== null) {
    const selector = match[1].trim();
    selectors.push(selector);
  }

  // Extrair classes
  const classes = new Set();
  const classPattern = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;

  while ((match = classPattern.exec(content)) !== null) {
    classes.add(match[1]);
  }

  // Contar propriedades
  const propertyPattern = /\s*([a-zA-Z-]+)\s*:/g;
  const properties = {};

  while ((match = propertyPattern.exec(content)) !== null) {
    const prop = match[1];
    properties[prop] = (properties[prop] || 0) + 1;
  }

  return {
    selectorCount: selectors.length,
    classes: Array.from(classes),
    properties,
    charCount: content.length,
    lineCount: content.split("\n").length,
  };
}

/**
 * Categoriza um arquivo com base no tipo
 */
function categorizeFile(fileInfo, relativePath) {
  if (fileInfo.type === "javascript") {
    referenceDoc.structure.components[relativePath] = fileInfo;
  } else if (fileInfo.type === "stylesheet") {
    referenceDoc.structure.styles[relativePath] = fileInfo;
  } else if (fileInfo.type === "config") {
    referenceDoc.structure.configs[relativePath] = fileInfo;
  } else if (fileInfo.type === "asset") {
    referenceDoc.structure.assets[relativePath] = fileInfo;
  }
}

/**
 * Extrai elementos HTML do arquivo HTML principal
 */
function extractHtmlElements() {
  const htmlFiles = referenceDoc.files.filter((file) => file.type === "html");

  for (const file of htmlFiles) {
    console.log(`🔍 Analisando elementos HTML em ${file.path}`);

    if (file.htmlSummary) {
      // Adicionar elementos HTML para referência
      referenceDoc.structure.components[file.path] = {
        ...referenceDoc.structure.components[file.path],
        elements: {
          ids: file.htmlSummary.idElements,
          classes: file.htmlSummary.classNames,
          tags: file.htmlSummary.tagCounts,
        },
      };
    }
  }
}

/**
 * Extrai componentes JavaScript
 */
function extractJavaScriptComponents() {
  const jsFiles = referenceDoc.files.filter(
    (file) => file.type === "javascript"
  );

  for (const file of jsFiles) {
    console.log(`🔍 Analisando componentes JavaScript em ${file.path}`);

    // Adicionar componentes JS para referência
    referenceDoc.structure.components[file.path] = {
      ...referenceDoc.structure.components[file.path],
      jsSummary: {
        functionCount: file.functions ? file.functions.length : 0,
        variableCount: file.variables ? file.variables.length : 0,
        eventListenerCount: file.eventListeners
          ? file.eventListeners.length
          : 0,
        path: file.path,
      },
    };
  }
}

/**
 * Extrai classes CSS
 */
function extractCssClasses() {
  const cssFiles = referenceDoc.files.filter(
    (file) => file.type === "stylesheet"
  );

  for (const file of cssFiles) {
    console.log(`🔍 Analisando estilos CSS em ${file.path}`);

    if (file.cssSummary) {
      // Adicionar estilos CSS para referência
      referenceDoc.structure.styles[file.path] = {
        ...referenceDoc.structure.styles[file.path],
        cssSummary: {
          classCount: file.cssSummary.classes
            ? file.cssSummary.classes.length
            : 0,
          selectorCount: file.cssSummary.selectorCount || 0,
          path: file.path,
        },
      };
    }
  }
}

// Executa o script
main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
