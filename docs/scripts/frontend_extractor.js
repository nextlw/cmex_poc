const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Configurações
const ROOT_DIR = process.argv[2] || __dirname;
const OUTPUT_FILE = "frontend_reference.json";
const EXTENSIONS_TO_PARSE = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".md",
];
const DIRECTORIES_TO_SKIP = [
  "node_modules",
  "dist",
  "coverage",
  ".git",
  "build",
  "test-reports",
];

// Estrutura principal
const referenceDoc = {
  project: "frontend-react",
  version: "1.0.0",
  createdAt: new Date().toISOString().split("T")[0],
  description:
    "Documentação completa do frontend React para referência e integração",
  structure: {
    components: {},
    pages: {},
    hooks: {},
    contexts: {},
    types: {},
    utils: {},
    api: {},
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
  extractReactComponents();
  extractTypeScriptTypes();
  extractAPIEndpoints();
  extractReactHooks();
  extractRoutes();

  // Salvar o documento de referência
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(referenceDoc, null, 2));
  console.log(`✅ Documento de referência salvo em ${OUTPUT_FILE}`);
}

/**
 * Obtém a estrutura básica de diretórios
 */
function getDirectoryStructure(dir, basePath = "") {
  const result = {};
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      if (DIRECTORIES_TO_SKIP.includes(item)) continue;

      const itemPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);

      try {
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          result[item] = getDirectoryStructure(itemPath, relativePath);
        }
      } catch (error) {
        console.log(`⚠️ Ignorando item ${itemPath}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`⚠️ Não foi possível ler o diretório ${dir}: ${error.message}`);
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
  if (extension === ".tsx" || extension === ".jsx") {
    fileInfo.components = extractComponentsFromReactFile(content);
    fileInfo.imports = extractImports(content);
    fileInfo.exports = extractExports(content);
    fileInfo.hooks = extractHooksUsage(content);
    fileInfo.jsdoc = extractJSDocComments(content);
  } else if (extension === ".ts" || extension === ".js") {
    fileInfo.functions = extractFunctions(content);
    fileInfo.imports = extractImports(content);
    fileInfo.exports = extractExports(content);
    fileInfo.hooks = extension === ".ts" ? extractCustomHooks(content) : [];
    fileInfo.jsdoc = extractJSDocComments(content);
  } else if (extension === ".json") {
    try {
      fileInfo.jsonSummary = summarizeJson(content);
    } catch (error) {
      fileInfo.error = "Falha ao analisar JSON";
    }
  } else if (extension === ".md") {
    fileInfo.mdSummary = summarizeMarkdown(content);
  } else if (extension === ".css" || extension === ".scss") {
    fileInfo.cssClasses = extractCSSClasses(content);
    fileInfo.cssVariables = extractCSSVariables(content);
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

  if (extension === ".tsx" || extension === ".jsx") {
    if (relativePath.includes("/pages/") || relativePath.includes("/Pages/")) {
      return "page";
    }
    if (
      relativePath.includes("/components/") ||
      relativePath.includes("/Components/")
    ) {
      return "component";
    }
    return "react";
  }

  if (extension === ".ts" || extension === ".js") {
    if (relativePath.includes("/hooks/") || basename.includes("use")) {
      return "hook";
    }
    if (relativePath.includes("/contexts/") || basename.includes("Context")) {
      return "context";
    }
    if (
      relativePath.includes("/utils/") ||
      relativePath.includes("/helpers/")
    ) {
      return "utility";
    }
    if (
      relativePath.includes("/api/") ||
      basename.includes("api") ||
      basename.includes("service")
    ) {
      return "api";
    }
    if (relativePath.includes("/types/") || relativePath.includes(".d.ts")) {
      return "type";
    }
    if (
      relativePath.includes("/routes/") ||
      basename.includes("route") ||
      basename.includes("router")
    ) {
      return "route";
    }
    return extension === ".ts" ? "typescript" : "javascript";
  }

  if (extension === ".json") {
    if (basename === "package.json") return "package";
    if (basename === "tsconfig.json") return "tsconfig";
    return "data";
  }

  if (extension === ".md") {
    return "documentation";
  }

  if (extension === ".css" || extension === ".scss") {
    return "style";
  }

  return "other";
}

/**
 * Extrai componentes React de arquivos .tsx/.jsx
 */
function extractComponentsFromReactFile(content) {
  const components = [];

  // Função para componentes baseados em função
  const functionComponentPattern =
    /(?:export\s+)?(?:const|function)\s+([A-Z][A-Za-z0-9_]*)\s*(?:=\s*(?:React\.)?(?:memo|forwardRef)?\(?\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>\s*|=\s*\((?:[^)]*)\)\s*=>\s*|=\s*\(\)\s*=>\s*|(?:\(\s*[^)]*\)|\([^)]*\):|)\s*(?:=>|{)|\([^)]*\)\s*{)/g;

  // Função para classes React.Component
  const classComponentPattern =
    /class\s+([A-Z][A-Za-z0-9_]*)\s+extends\s+(?:React\.)?Component/g;

  // Procurar por componentes de função
  let match;
  while ((match = functionComponentPattern.exec(content)) !== null) {
    const componentName = match[1];
    if (componentName && componentName[0] === componentName[0].toUpperCase()) {
      components.push({
        name: componentName,
        type: "function",
        line: getLineNumberFromIndex(content, match.index),
      });
    }
  }

  // Procurar por componentes de classe
  while ((match = classComponentPattern.exec(content)) !== null) {
    components.push({
      name: match[1],
      type: "class",
      line: getLineNumberFromIndex(content, match.index),
    });
  }

  return components;
}

/**
 * Extrai hooks customizados de arquivos .ts/.tsx
 */
function extractCustomHooks(content) {
  const hooks = [];
  const hookPattern =
    /(?:export\s+)?(?:const|function)\s+(use[A-Z][A-Za-z0-9_]*)\s*(?:=|:|\()/g;

  let match;
  while ((match = hookPattern.exec(content)) !== null) {
    hooks.push({
      name: match[1],
      line: getLineNumberFromIndex(content, match.index),
    });
  }

  return hooks;
}

/**
 * Extrai uso de hooks em componentes
 */
function extractHooksUsage(content) {
  const hooksUsage = [];
  const hookUsagePattern = /\b(use[A-Z][A-Za-z0-9_]*)\s*\(/g;

  let match;
  while ((match = hookUsagePattern.exec(content)) !== null) {
    // Não adicionar se já existir
    if (!hooksUsage.some((h) => h.name === match[1])) {
      hooksUsage.push({
        name: match[1],
        line: getLineNumberFromIndex(content, match.index),
      });
    }
  }

  return hooksUsage;
}

/**
 * Extrai funções de arquivos TypeScript/JavaScript
 */
function extractFunctions(content) {
  const functions = [];

  // Padrões para diferentes tipos de declaração de função
  const patterns = [
    // declarações de função
    /function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g,
    // arrow functions atribuídas a constantes/variáveis
    /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g,
    // métodos de classe
    /(?:public|private|protected)?\s*(?:static)?\s*(?:async)?\s*([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // Se for um nome de função válido
      if (match[1] && !match[1].startsWith("use")) {
        functions.push({
          name: match[1],
          params: match[2]
            ? match[2]
                .split(",")
                .map((p) => p.trim())
                .filter((p) => p)
            : [],
          line: getLineNumberFromIndex(content, match.index),
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
      line: getLineNumberFromIndex(content, match.index),
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
    /export\s+(const|let|var|function|class|interface|type|enum)\s+([a-zA-Z0-9_$]+)/g,
    // export default
    /export\s+default\s+([a-zA-Z0-9_$]+)/g,
  ];

  for (const pattern of exportPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (pattern.toString().includes("{")) {
        // export { ... }
        const items = match[1].split(",").map((item) => item.trim());
        exports.push(
          ...items.map((item) => ({
            name: item,
            line: getLineNumberFromIndex(content, match.index),
          }))
        );
      } else if (pattern.toString().includes("default")) {
        // export default
        exports.push({
          name: match[1],
          isDefault: true,
          line: getLineNumberFromIndex(content, match.index),
        });
      } else {
        // export const/let/var/function/class/interface/type
        exports.push({
          type: match[1],
          name: match[2],
          line: getLineNumberFromIndex(content, match.index),
        });
      }
    }
  }

  return exports;
}

/**
 * Extrai comentários JSDoc de arquivos TypeScript/JavaScript
 */
function extractJSDocComments(content) {
  const jsdocComments = [];
  const jsdocPattern = /\/\*\*\s*([\s\S]*?)\s*\*\//g;

  let match;
  while ((match = jsdocPattern.exec(content)) !== null) {
    const comment = match[1]
      .replace(/\n\s*\*/g, "\n") // Remove asteriscos no início das linhas
      .trim();

    jsdocComments.push({
      content: comment,
      line: getLineNumberFromIndex(content, match.index),
    });
  }

  return jsdocComments;
}

/**
 * Extrai classes CSS de arquivos .css/.scss
 */
function extractCSSClasses(content) {
  const classes = [];
  const classPattern = /\.([-A-Za-z0-9_]+)(?:\s*(?:,|{|:))/g;

  let match;
  while ((match = classPattern.exec(content)) !== null) {
    classes.push({
      name: match[1],
      line: getLineNumberFromIndex(content, match.index),
    });
  }

  return classes;
}

/**
 * Extrai variáveis CSS de arquivos .css/.scss
 */
function extractCSSVariables(content) {
  const variables = [];
  const variablePattern = /--([-A-Za-z0-9_]+)\s*:\s*([^;]+);/g;

  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    variables.push({
      name: match[1],
      value: match[2].trim(),
      line: getLineNumberFromIndex(content, match.index),
    });
  }

  return variables;
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
 * Resumo simplificado de arquivos Markdown
 */
function summarizeMarkdown(content) {
  const lines = content.split("\n");
  const headings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        line: i + 1,
      });
    }
  }

  return {
    headings,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    lineCount: lines.length,
  };
}

/**
 * Categoriza um arquivo com base no tipo
 */
function categorizeFile(fileInfo, relativePath) {
  if (fileInfo.type === "component") {
    referenceDoc.structure.components[relativePath] = fileInfo;
  } else if (fileInfo.type === "page") {
    referenceDoc.structure.pages[relativePath] = fileInfo;
  } else if (fileInfo.type === "hook") {
    referenceDoc.structure.hooks[relativePath] = fileInfo;
  } else if (fileInfo.type === "context") {
    referenceDoc.structure.contexts[relativePath] = fileInfo;
  } else if (fileInfo.type === "type") {
    referenceDoc.structure.types[relativePath] = fileInfo;
  } else if (fileInfo.type === "utility") {
    referenceDoc.structure.utils[relativePath] = fileInfo;
  } else if (fileInfo.type === "api") {
    referenceDoc.structure.api[relativePath] = fileInfo;
  }
}

/**
 * Extrai componentes React para referência
 */
function extractReactComponents() {
  const componentFiles = referenceDoc.files.filter(
    (file) => file.type === "component" || file.type === "page"
  );

  console.log(`🔍 Analisando ${componentFiles.length} componentes React`);

  for (const file of componentFiles) {
    console.log(`🔍 Analisando componente em ${file.path}`);

    if (file.components && file.components.length) {
      const componentSummary = {
        components: file.components.map((comp) => comp.name),
        hooksUsed: file.hooks ? file.hooks.map((h) => h.name) : [],
        importsCount: file.imports ? file.imports.length : 0,
        path: file.path,
      };

      if (file.type === "component") {
        referenceDoc.structure.components[file.path] = {
          ...referenceDoc.structure.components[file.path],
          componentSummary,
        };
      } else if (file.type === "page") {
        referenceDoc.structure.pages[file.path] = {
          ...referenceDoc.structure.pages[file.path],
          componentSummary,
        };
      }
    }
  }
}

/**
 * Extrai tipos TypeScript para referência
 */
function extractTypeScriptTypes() {
  const typeFiles = referenceDoc.files.filter(
    (file) =>
      file.type === "type" ||
      file.extension === ".d.ts" ||
      file.path.includes("/types/")
  );

  console.log(`🔍 Analisando ${typeFiles.length} arquivos de tipos TypeScript`);

  for (const file of typeFiles) {
    console.log(`🔍 Analisando tipos em ${file.path}`);

    // Adicionar tipos para referência
    const typeSummary = {
      exports: file.exports ? file.exports.length : 0,
      interfaces: extractInterfacesFromFile(file.path),
      path: file.path,
    };

    referenceDoc.structure.types[file.path] = {
      ...referenceDoc.structure.types[file.path],
      typeSummary,
    };
  }
}

/**
 * Extrai interfaces TypeScript de um arquivo
 */
function extractInterfacesFromFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(ROOT_DIR, filePath), "utf-8");
    const interfaces = [];
    const interfacePattern =
      /interface\s+([A-Za-z0-9_]+)(?:\s+extends\s+([^{]+))?\s*{/g;

    let match;
    while ((match = interfacePattern.exec(content)) !== null) {
      interfaces.push({
        name: match[1],
        extends: match[2] ? match[2].trim() : null,
        line: getLineNumberFromIndex(content, match.index),
      });
    }

    return interfaces;
  } catch (error) {
    console.log(
      `⚠️ Erro ao extrair interfaces de ${filePath}: ${error.message}`
    );
    return [];
  }
}

/**
 * Extrai endpoints de API para referência
 */
function extractAPIEndpoints() {
  const apiFiles = referenceDoc.files.filter(
    (file) =>
      file.type === "api" ||
      file.path.includes("/api/") ||
      file.path.includes("service")
  );

  console.log(`🔍 Analisando ${apiFiles.length} arquivos de API`);

  for (const file of apiFiles) {
    console.log(`🔍 Analisando API em ${file.path}`);

    // Extrair endpoints
    try {
      const content = fs.readFileSync(path.join(ROOT_DIR, file.path), "utf-8");
      const endpoints = extractEndpointsFromContent(content);

      if (endpoints.length) {
        const apiSummary = {
          endpoints,
          functions: file.functions ? file.functions.length : 0,
          path: file.path,
        };

        referenceDoc.structure.api[file.path] = {
          ...referenceDoc.structure.api[file.path],
          apiSummary,
        };
      }
    } catch (error) {
      console.log(
        `⚠️ Erro ao extrair endpoints de ${file.path}: ${error.message}`
      );
    }
  }
}

/**
 * Extrai endpoints de API do conteúdo do arquivo
 */
function extractEndpointsFromContent(content) {
  const endpoints = [];

  // Padrão para chamadas axios, fetch, etc.
  const patterns = [
    // Axios
    /(?:axios|api)\.(?:get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g,
    // Fetch
    /fetch\(\s*(?:[^)]*['"])([^'"]+)['"]/g,
    // Outros padrões específicos do projeto
    /url:\s*['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const endpoint = match[1];

      // Filtrar URLs completas ou rotas relativas
      if (
        endpoint &&
        (endpoint.startsWith("/") ||
          endpoint.startsWith("http") ||
          endpoint.includes("api"))
      ) {
        // Não adicionar duplicatas
        if (!endpoints.some((e) => e.path === endpoint)) {
          endpoints.push({
            path: endpoint,
            method: determineMethodFromContext(content, match.index),
            line: getLineNumberFromIndex(content, match.index),
          });
        }
      }
    }
  }

  return endpoints;
}

/**
 * Determina o método HTTP baseado no contexto
 */
function determineMethodFromContext(content, index) {
  const methodPatterns = {
    GET: /get\(/i,
    POST: /post\(/i,
    PUT: /put\(/i,
    DELETE: /delete\(/i,
    PATCH: /patch\(/i,
  };

  // Verificar 20 caracteres antes para encontrar o método
  const contextBefore = content.substring(Math.max(0, index - 20), index);

  for (const [method, pattern] of Object.entries(methodPatterns)) {
    if (pattern.test(contextBefore)) {
      return method;
    }
  }

  return "GET"; // Método padrão se não encontrado
}

/**
 * Extrai hooks React para referência
 */
function extractReactHooks() {
  const hookFiles = referenceDoc.files.filter(
    (file) => file.type === "hook" || file.path.includes("/hooks/")
  );

  console.log(`🔍 Analisando ${hookFiles.length} hooks React`);

  for (const file of hookFiles) {
    console.log(`🔍 Analisando hook em ${file.path}`);

    const customHooks = file.hooks || [];

    if (
      customHooks.length ||
      (file.functions &&
        file.functions.filter((f) => f.name.startsWith("use")).length)
    ) {
      const hookSummary = {
        hooks:
          customHooks.map((h) => h.name) ||
          (file.functions
            ? file.functions
                .filter((f) => f.name.startsWith("use"))
                .map((f) => f.name)
            : []),
        path: file.path,
      };

      referenceDoc.structure.hooks[file.path] = {
        ...referenceDoc.structure.hooks[file.path],
        hookSummary,
      };
    }
  }
}

/**
 * Extrai rotas para referência
 */
function extractRoutes() {
  const routeFiles = referenceDoc.files.filter(
    (file) =>
      file.type === "route" ||
      file.path.includes("/routes/") ||
      file.path.includes("router") ||
      file.path.includes("Router")
  );

  console.log(`🔍 Analisando ${routeFiles.length} arquivos de rotas`);

  for (const file of routeFiles) {
    console.log(`🔍 Analisando rotas em ${file.path}`);

    try {
      const content = fs.readFileSync(path.join(ROOT_DIR, file.path), "utf-8");
      const routes = extractRoutesFromContent(content);

      if (routes.length) {
        const routeSummary = {
          routes,
          path: file.path,
        };

        // Verificar se existe na estrutura
        if (!referenceDoc.structure.routes) {
          referenceDoc.structure.routes = {};
        }

        referenceDoc.structure.routes[file.path] = routeSummary;
      }
    } catch (error) {
      console.log(`⚠️ Erro ao extrair rotas de ${file.path}: ${error.message}`);
    }
  }
}

/**
 * Extrai rotas do conteúdo do arquivo
 */
function extractRoutesFromContent(content) {
  const routes = [];

  // Padrões para detectar rotas React Router
  const patterns = [
    // Route direto
    /<Route(?:\s+[^>]*?)?\s+path=["']([^"']+)["'][^>]*>/g,
    // Objeto de rota
    /{\s*path:\s*["']([^"']+)["']/g,
    // Outras definições de rotas
    /path:\s*["']([^"']+)["']/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const routePath = match[1];

      // Não adicionar duplicatas
      if (!routes.some((r) => r.path === routePath)) {
        routes.push({
          path: routePath,
          line: getLineNumberFromIndex(content, match.index),
          component: extractComponentForRoute(content, match.index),
        });
      }
    }
  }

  return routes;
}

/**
 * Extrai o componente associado a uma rota
 */
function extractComponentForRoute(content, index) {
  // Procurar por component= ou element= próximo ao índice da rota
  const contextAfter = content.substring(index, index + 200);

  const componentMatch = contextAfter.match(
    /component=\s*\{?\s*([A-Za-z0-9_]+)/
  );
  if (componentMatch) {
    return componentMatch[1];
  }

  const elementMatch = contextAfter.match(
    /element=\s*\{?\s*<\s*([A-Za-z0-9_]+)/
  );
  if (elementMatch) {
    return elementMatch[1];
  }

  return null;
}

/**
 * Obtém o número da linha a partir do índice no conteúdo
 */
function getLineNumberFromIndex(content, index) {
  const lineBreaks = content.substring(0, index).match(/\n/g);
  return lineBreaks ? lineBreaks.length + 1 : 1;
}

// Executa o script
main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
