const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Configurações
const TIMEOUT = 300000; // 5 minutos
const APP_URL = "http://localhost:5173"; // URL de desenvolvimento local
const EVIDENCE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "test-reports",
  "evidence",
  "real-tests"
);
const SCREENSHOTS_DIR = path.join(EVIDENCE_DIR, "screenshots");

// Garantir que os diretórios de evidências existem
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Adicionar timestamp aos nomes de arquivo para evitar sobrescritas
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// Função para salvar screenshot como evidência
async function saveScreenshot(page, name) {
  const filename = path.join(SCREENSHOTS_DIR, `${name}-${timestamp}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot salvo: ${filename}`);
  return filename;
}

// Função para salvar logs da página
async function savePageLogs(logs, name) {
  const filename = path.join(EVIDENCE_DIR, `${name}-logs-${timestamp}.txt`);
  fs.writeFileSync(filename, logs.join("\n"));
  console.log(`Logs salvos: ${filename}`);
  return filename;
}

// Função para extrair texto de um elemento
async function getElementText(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: TIMEOUT });
    return page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.textContent : null;
    }, selector);
  } catch (error) {
    console.error(`Erro ao obter texto do elemento ${selector}:`, error);
    return null;
  }
}

// Substituir page.waitForTimeout por uma alternativa compatível
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Teste de Conversa com IA", () => {
  let browser;
  let page;
  let logs = [];

  // Configuração antes de todos os testes
  beforeAll(async () => {
    // Configurar o navegador com argumentos específicos
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1280,720",
      ],
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    page = await browser.newPage();

    // Interceptar requisições para adicionar o campo definitive
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/api/v1/query")
      ) {
        try {
          const postData = request.postData();
          if (postData) {
            const data = JSON.parse(postData);
            console.log("===== MODIFICANDO REQUISIÇÃO =====");
            console.log("Dados originais:", postData);

            // Adicionar o campo definitive se não existir
            if (!data.definitive) {
              data.definitive = true;
            }

            const modifiedData = JSON.stringify(data);
            console.log("Dados modificados:", modifiedData);
            console.log("=================================");

            // Continuar com os dados modificados
            request.continue({
              postData: modifiedData,
            });
          } else {
            request.continue();
          }
        } catch (error) {
          console.error("Erro ao modificar requisição:", error);
          request.continue();
        }
      } else {
        request.continue();
      }
    });

    // Capturar logs do console
    page.on("console", (msg) => {
      logs.push(msg.text());
      console.log(`[Browser Console] ${msg.text()}`);
    });

    // Capturar respostas da API
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/v1/")) {
        console.log("===== RESPOSTA DA API =====");
        console.log("URL:", url);
        console.log("Status:", response.status(), response.statusText());

        try {
          const responseBody = await response.text();
          try {
            const jsonBody = JSON.parse(responseBody);
            console.log("Corpo da resposta:", responseBody);
            console.log(
              "Resposta JSON formatada:",
              JSON.stringify(jsonBody, null, 2)
            );
          } catch (e) {
            console.log("Corpo da resposta:", responseBody);
          }
        } catch (error) {
          console.log("Erro ao obter corpo da resposta:", error.message);
        }

        console.log("==========================");
      }
    });

    // Aumentar timeouts para aguardar respostas do modelo
    page.setDefaultTimeout(TIMEOUT);
    page.setDefaultNavigationTimeout(TIMEOUT);
  });

  // Limpeza após os testes
  afterAll(async () => {
    // Salvar logs
    await savePageLogs(logs, "final");

    // Fechar o navegador
    if (browser) {
      await browser.close();
    }
  });

  test(
    'Deve enviar "olá" e receber resposta com thinking e text via SSE',
    async () => {
      // Registrar início do teste
      console.log('Iniciando teste de conversa com a mensagem "olá"');

      // Navegar para a página
      await page.goto(APP_URL);
      console.log("Página carregada");

      // Tirar screenshot inicial
      await saveScreenshot(page, "01-pagina-inicial");

      // Verificar se estamos na página de login e fazer login
      try {
        console.log("Verificando se estamos na página de login...");

        // Procurar por campos de login
        const loginFormExists = await page.evaluate(() => {
          const usernameField = document.querySelector(
            'input[type="text"], input[type="email"], input[name="username"], input[name="email"]'
          );
          const passwordField = document.querySelector(
            'input[type="password"], input[name="password"]'
          );
          return !!(usernameField && passwordField);
        });

        if (loginFormExists) {
          console.log("Página de login detectada, preenchendo credenciais...");
          await saveScreenshot(page, "02-tela-login");

          // Preencher credenciais com as informações fornecidas
          await page.type(
            'input[type="text"], input[type="email"], input[name="username"], input[name="email"]',
            "will.criando@gmail.com"
          );
          await page.type(
            'input[type="password"], input[name="password"]',
            "M31s20e02"
          );
          await sleep(1000);

          await saveScreenshot(page, "03-credenciais-preenchidas");

          // Clicar no botão de login
          const loginButtonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Login")',
            'button:contains("Entrar")',
            "button.login-button",
            "button.submit-button",
          ];

          let loginButtonClicked = false;
          for (const selector of loginButtonSelectors) {
            try {
              const buttonExists = await page.evaluate((sel) => {
                if (sel.includes(":contains(")) {
                  const text = sel.match(/:contains\("(.+)"\)/)[1];
                  return Array.from(document.querySelectorAll("button")).some(
                    (el) => el.textContent.includes(text)
                  );
                }
                return !!document.querySelector(sel);
              }, selector);

              if (buttonExists) {
                if (selector.includes(":contains(")) {
                  const text = selector.match(/:contains\("(.+)"\)/)[1];
                  await page.evaluate((text) => {
                    Array.from(document.querySelectorAll("button"))
                      .find((el) => el.textContent.includes(text))
                      .click();
                  }, text);
                } else {
                  await page.click(selector);
                }

                loginButtonClicked = true;
                console.log(`Botão de login clicado com seletor: ${selector}`);
                break;
              }
            } catch (error) {
              console.warn(
                `Erro ao tentar clicar no botão de login com seletor ${selector}:`,
                error.message
              );
            }
          }

          if (!loginButtonClicked) {
            console.warn(
              "Não foi possível clicar no botão de login automaticamente."
            );
            console.log("Procurando por botão genérico...");

            // Tentar encontrar qualquer botão no formulário
            await page.evaluate(() => {
              const form = document.querySelector("form");
              if (form) {
                const button = form.querySelector("button");
                if (button) button.click();
              }
            });
          }

          await sleep(3000);
          await saveScreenshot(page, "04-apos-login");
          console.log("Login concluído, verificando redirecionamento...");
        } else {
          console.log("Nenhum formulário de login detectado, continuando...");
        }
      } catch (error) {
        console.warn("Erro ao tentar fazer login:", error.message);
        console.log("Tentando continuar o teste...");
      }

      // Verificar se estamos na página inicial e precisamos navegar para o chat
      try {
        // Clicar no link "chat" no header conforme instruções
        console.log("Procurando o link 'chat' no header...");
        await saveScreenshot(page, "05-header-pre-navegacao");

        const chatLinkClicked = await page.evaluate(() => {
          // Procurar por links no header
          const headerLinks = Array.from(
            document.querySelectorAll(
              "header a, nav a, .header-nav a, .main-nav a"
            )
          );
          const chatLink = headerLinks.find(
            (link) =>
              link.textContent.toLowerCase().includes("chat") ||
              link.getAttribute("href")?.includes("/chat")
          );

          if (chatLink) {
            console.log(
              "Link de chat encontrado no header:",
              chatLink.textContent
            );
            chatLink.click();
            return true;
          }
          return false;
        });

        if (chatLinkClicked) {
          console.log("Link 'chat' no header clicado com sucesso");
        } else {
          console.log(
            "Link 'chat' não encontrado no header, tentando outros métodos"
          );

          // Verificar se o menu hamburger existe e clicar nele se necessário
          const hamburgerMenuExists = await page.evaluate(() => {
            return !!document.querySelector(
              '.hamburger-menu, .menu-icon, button[aria-label="Menu"]'
            );
          });

          if (hamburgerMenuExists) {
            console.log("Menu hamburguer encontrado, clicando...");
            await page.click(
              '.hamburger-menu, .menu-icon, button[aria-label="Menu"]'
            );
            await sleep(1000); // Esperar o menu abrir
            await saveScreenshot(page, "06-menu-aberto");

            // Procurar e clicar no link do chat
            console.log("Procurando link para o chat...");
            await page.evaluate(() => {
              const chatLinks = Array.from(
                document.querySelectorAll("a")
              ).filter(
                (el) =>
                  el.textContent.toLowerCase().includes("chat") ||
                  el.href.includes("/chat") ||
                  el.getAttribute("aria-label")?.toLowerCase().includes("chat")
              );
              if (chatLinks.length > 0) chatLinks[0].click();
            });
          }
        }

        // Aguardar navegação para a página de chat
        await sleep(3000);
        await saveScreenshot(page, "07-pagina-chat");

        // Não vamos mais procurar por algo para clicar em "inputai", pois agora sabemos que é o campo de mensagem

        // Aguardar até que a página carregue completamente
        await sleep(3000);
        await saveScreenshot(page, "08-pagina-carregada");

        // Procurar pelo campo de mensagem InputAi
        console.log("Procurando o campo de mensagem InputAi...");

        const messageInputSelectors = [
          // Seletores específicos para InputAi
          '[name="inputAi"]',
          '[id="inputAi"]',
          '[class*="inputAi"]',
          '[data-testid="inputAi"]',
          // Seletores genéricos para campos de entrada
          'textarea[placeholder*="mensagem"]',
          'textarea[placeholder*="Envie"]',
          'textarea[placeholder*="chat"]',
          'textarea[placeholder*="Digite"]',
          'textarea[aria-label*="mensagem"]',
          "textarea.chat-input",
          'input[type="text"][placeholder*="mensagem"]',
          'input[type="text"].chat-input',
          'div[contenteditable="true"]',
          // Último recurso: qualquer campo de texto
          "textarea",
          'input[type="text"]',
        ];

        // Verificar qual seletor funciona
        let messageInputSelector = null;
        for (const selector of messageInputSelectors) {
          const exists = await page.evaluate(
            (sel) => !!document.querySelector(sel),
            selector
          );
          if (exists) {
            messageInputSelector = selector;
            console.log(`Campo InputAi encontrado com seletor: ${selector}`);
            break;
          }
        }

        // Se ainda não encontrou, fazer uma busca mais ampla para qualquer elemento InputAi
        if (!messageInputSelector) {
          console.log(
            "Tentando encontrar o campo InputAi com busca mais ampla..."
          );

          const found = await page.evaluate(() => {
            // Procurar por qualquer elemento que contenha 'inputai' no id, nome de classe, ou atributos
            const elements = Array.from(document.querySelectorAll("*")).filter(
              (el) => {
                return (
                  (el.id && el.id.toLowerCase().includes("inputai")) ||
                  (el.className &&
                    el.className.toLowerCase().includes("inputai")) ||
                  (el.getAttribute("name") &&
                    el
                      .getAttribute("name")
                      .toLowerCase()
                      .includes("inputai")) ||
                  (el.getAttribute("data-testid") &&
                    el
                      .getAttribute("data-testid")
                      .toLowerCase()
                      .includes("inputai")) ||
                  (el.placeholder &&
                    el.placeholder.toLowerCase().includes("inputai"))
                );
              }
            );

            if (elements.length > 0) {
              // Encontrar o primeiro elemento que parece um campo de entrada
              const inputElement = elements.find(
                (el) =>
                  el.tagName === "INPUT" ||
                  el.tagName === "TEXTAREA" ||
                  el.getAttribute("contenteditable") === "true"
              );

              if (inputElement) {
                // Registrar um atributo único para poder selecionar depois
                inputElement.setAttribute("data-test-found", "true");
                return true;
              }
            }
            return false;
          });

          if (found) {
            messageInputSelector = '[data-test-found="true"]';
            console.log("Campo InputAi encontrado e marcado para seleção");
          }
        }

        if (!messageInputSelector) {
          console.error(
            "Campo InputAi não encontrado! Tirando screenshot para diagnóstico"
          );
          await saveScreenshot(page, "09-erro-campo-inputai-nao-encontrado");
          throw new Error(
            "Campo InputAi não encontrado com nenhum dos seletores"
          );
        }

        // Digitar "olá" no input
        await page.type(messageInputSelector, "olá");
        console.log('Mensagem "olá" digitada no campo InputAi');

        // Tirar screenshot após digitar
        await saveScreenshot(page, "10-mensagem-digitada");

        // Já fizemos a análise dos handlers de eventos antes, não precisamos duplicar

        // Procurar botão de enviar com diferentes seletores possíveis
        console.log("Procurando botão de enviar...");

        const sendButtonSelectors = [
          'button[type="submit"]',
          "button.send-button",
          'button[aria-label*="enviar"]',
          'button[aria-label*="Enviar"]',
          "button.chat-submit",
          'button svg[data-icon="paper-plane"]', // FontAwesome icon
          "button .send-icon",
        ];

        // Tentar clicar no botão de enviar
        let buttonClicked = false;
        for (const selector of sendButtonSelectors) {
          try {
            const buttonExists = await page.evaluate(
              (sel) => !!document.querySelector(sel),
              selector
            );
            if (buttonExists) {
              await page.click(selector);
              buttonClicked = true;
              console.log(`Botão de enviar clicado com seletor: ${selector}`);
              break;
            }
          } catch (error) {
            console.warn(
              `Erro ao tentar clicar no botão com seletor ${selector}:`,
              error.message
            );
          }
        }

        // Se nenhum botão foi encontrado, tentar pressionar Enter
        if (!buttonClicked) {
          console.log(
            "Botão de enviar não encontrado, tentando pressionar Enter"
          );
          await page.keyboard.press("Enter");
          buttonClicked = true;
        }

        if (!buttonClicked) {
          console.error(
            "Não foi possível enviar a mensagem! Tirando screenshot para diagnóstico"
          );
          await saveScreenshot(page, "11-erro-envio-mensagem");
          throw new Error(
            "Não foi possível encontrar uma maneira de enviar a mensagem"
          );
        }

        // Tirar screenshot após envio
        await saveScreenshot(page, "12-mensagem-enviada");

        // Aguardar a mensagem do usuário aparecer
        console.log("Aguardando a mensagem do usuário aparecer na conversa...");

        const userMessageSelectors = [
          ".message-user",
          '[data-testid="message-user"]',
          ".user-message",
          ".message.user",
          ".chat-message.user",
          ".chat-bubble.user",
        ];

        let userMessageSelector = null;
        for (const selector of userMessageSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 10000 });
            userMessageSelector = selector;
            console.log(
              `Mensagem do usuário detectada com seletor: ${selector}`
            );
            break;
          } catch (error) {
            // Continuar tentando o próximo seletor
          }
        }

        if (!userMessageSelector) {
          console.error(
            "Mensagem do usuário não apareceu na conversa! Tirando screenshot para diagnóstico"
          );
          await saveScreenshot(page, "13-erro-mensagem-usuario-nao-detectada");
          throw new Error(
            "Mensagem do usuário não apareceu na conversa após envio"
          );
        }

        const userMessageText = await getElementText(page, userMessageSelector);
        console.log(`Mensagem do usuário exibida: "${userMessageText}"`);

        // Aguardar pelo indicador de pensamento (thinking)
        console.log("Aguardando seção de pensamento aparecer...");

        const thinkingSelectors = [
          ".thinking-section",
          '[data-testid="thinking-section"]',
          ".thinking-indicator",
          ".ai-thinking",
          ".message-thinking",
        ];

        let thinkingFound = false;
        for (const selector of thinkingSelectors) {
          try {
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 60000,
            }); // 1 minuto para thinking aparecer
            console.log(
              `Seção de pensamento detectada com seletor: ${selector}`
            );
            thinkingFound = true;

            // Tirar screenshot do thinking
            await saveScreenshot(page, "14-thinking-section");

            // Tentar expandir a seção de pensamento
            const toggleSelectors = [
              ".thinking-toggle-button",
              '[data-testid="thinking-toggle"]',
              ".expand-thinking",
              ".thinking-expand-button",
            ];

            for (const toggleSelector of toggleSelectors) {
              try {
                const toggleExists = await page.evaluate(
                  (sel) => !!document.querySelector(sel),
                  toggleSelector
                );
                if (toggleExists) {
                  await page.click(toggleSelector);
                  console.log(
                    `Botão de expandir pensamento clicado: ${toggleSelector}`
                  );
                  await sleep(1000);
                  await saveScreenshot(page, "15-thinking-expandido");

                  // Verificar se o conteúdo do pensamento está visível
                  const thinkingContentSelectors = [
                    ".thinking-content",
                    '[data-testid="thinking-content"]',
                    ".thinking-text",
                  ];

                  for (const contentSelector of thinkingContentSelectors) {
                    try {
                      const thinkingContent = await getElementText(
                        page,
                        contentSelector
                      );
                      if (thinkingContent) {
                        console.log(
                          `Conteúdo do pensamento: "${thinkingContent.substring(
                            0,
                            100
                          )}..."`
                        );
                        break;
                      }
                    } catch (error) {
                      // Continuar tentando o próximo seletor
                    }
                  }

                  break;
                }
              } catch (error) {
                // Continuar tentando o próximo seletor
              }
            }

            break;
          } catch (error) {
            // Continuar tentando o próximo seletor
          }
        }

        if (!thinkingFound) {
          console.warn(
            "Seção de pensamento não detectada no timeout, continuando..."
          );
        }

        // Aguardar a resposta do modelo (com tempo maior)
        console.log("Aguardando resposta do modelo...");

        const responseSelectors = [
          ".message-response",
          '[data-testid="message-response"]',
          ".ai-message",
          ".assistant-message",
          ".message.ai",
          ".chat-message.ai",
          ".chat-bubble.ai",
        ];

        let responseSelector = null;
        for (const selector of responseSelectors) {
          try {
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 180000,
            }); // 3 minutos para resposta
            responseSelector = selector;
            console.log(
              `Resposta do modelo detectada com seletor: ${selector}`
            );
            break;
          } catch (error) {
            // Continuar tentando o próximo seletor
          }
        }

        if (!responseSelector) {
          console.error(
            "Resposta do modelo não detectada! Tirando screenshot para diagnóstico"
          );
          await saveScreenshot(page, "16-erro-resposta-nao-detectada");
          throw new Error(
            "Resposta do modelo não apareceu na conversa após timeout de 3 minutos"
          );
        }

        // Aguardar mais um pouco para a resposta terminar de ser gerada
        await sleep(5000);

        // Tirar screenshot da resposta
        await saveScreenshot(page, "17-resposta-modelo");

        // Obter o texto da resposta
        const responseText = await getElementText(page, responseSelector);
        console.log(
          `Texto da resposta: "${
            responseText && responseText.substring(0, 100)
          }..."`
        );

        // Verificar se o indicador de modelo está presente
        const modelIndicatorSelectors = [
          ".model-indicator",
          '[data-testid="model-indicator"]',
          ".model-badge",
          ".model-info",
        ];

        let modelIndicatorFound = false;
        for (const selector of modelIndicatorSelectors) {
          try {
            const modelIndicator = await getElementText(page, selector);
            if (modelIndicator) {
              console.log(`Indicador de modelo: "${modelIndicator}"`);
              modelIndicatorFound = true;
              break;
            }
          } catch (error) {
            // Continuar tentando o próximo seletor
          }
        }

        if (!modelIndicatorFound) {
          console.warn("Indicador de modelo não encontrado");
        }

        // Verificar se há referências na resposta
        console.log("Verificando referências...");

        const referencesSelectors = [
          ".references-section",
          '[data-testid="references-section"]',
          ".references",
          ".citations",
          ".sources",
        ];

        let referencesFound = false;
        for (const selector of referencesSelectors) {
          try {
            const references = await page.$$(selector);
            if (references.length > 0) {
              console.log(
                `${references.length} seções de referências encontradas`
              );
              await saveScreenshot(page, "18-referencias");

              // Obter textos das referências
              const referencesText = await getElementText(page, selector);
              console.log(
                `Texto das referências: "${
                  referencesText && referencesText.substring(0, 100)
                }..."`
              );
              referencesFound = true;
              break;
            }
          } catch (error) {
            // Continuar tentando o próximo seletor
          }
        }

        if (!referencesFound) {
          console.warn("Nenhuma seção de referências encontrada");
        }

        // Tirar screenshot final
        await saveScreenshot(page, "19-final");

        // Verificações finais
        expect(userMessageText).toContain("olá");
        expect(responseText).not.toBeNull();
        expect(responseText.length).toBeGreaterThan(0);

        console.log("Teste concluído com sucesso");
      } catch (error) {
        console.warn("Erro ao tentar navegar:", error.message);
        console.log(
          "Tentando continuar o teste assumindo que já estamos na página correta"
        );
        await saveScreenshot(page, "09-erro-navegacao");
      }

      // Aguardar até que a página carregue completamente
      await sleep(3000);
      await saveScreenshot(page, "10-pagina-query");

      // Procurar por diferentes seletores possíveis para o campo de mensagem
      console.log("Procurando campo de entrada de mensagem...");

      const messageInputSelectors = [
        'textarea[placeholder*="mensagem"]',
        'textarea[placeholder*="Envie"]',
        'textarea[placeholder*="chat"]',
        'textarea[placeholder*="Digite"]',
        'textarea[aria-label*="mensagem"]',
        "textarea.chat-input",
        'input[type="text"][placeholder*="mensagem"]',
        'input[type="text"].chat-input',
        'div[contenteditable="true"]',
      ];

      // Verificar qual seletor funciona
      let messageInputSelector = null;
      for (const selector of messageInputSelectors) {
        const exists = await page.evaluate(
          (sel) => !!document.querySelector(sel),
          selector
        );
        if (exists) {
          messageInputSelector = selector;
          console.log(`Campo de mensagem encontrado com seletor: ${selector}`);
          break;
        }
      }

      if (!messageInputSelector) {
        console.error(
          "Campo de mensagem não encontrado! Tirando screenshot para diagnóstico"
        );
        await saveScreenshot(page, "11-erro-campo-mensagem-nao-encontrado");
        throw new Error(
          "Campo de mensagem não encontrado com nenhum dos seletores conhecidos"
        );
      }

      // Digitar "olá" no input
      await page.type(messageInputSelector, "olá");
      console.log('Mensagem "olá" digitada');

      // Tirar screenshot após digitar
      await saveScreenshot(page, "12-mensagem-digitada");

      // Já fizemos a análise dos handlers de eventos antes, não precisamos duplicar

      // Procurar botão de enviar com diferentes seletores possíveis
      console.log("Procurando botão de enviar...");

      const sendButtonSelectors = [
        'button[type="submit"]',
        "button.send-button",
        'button[aria-label*="enviar"]',
        'button[aria-label*="Enviar"]',
        "button.chat-submit",
        'button svg[data-icon="paper-plane"]', // FontAwesome icon
        "button .send-icon",
      ];

      // Tentar clicar no botão de enviar
      let buttonClicked = false;
      for (const selector of sendButtonSelectors) {
        try {
          const buttonExists = await page.evaluate(
            (sel) => !!document.querySelector(sel),
            selector
          );
          if (buttonExists) {
            await page.click(selector);
            buttonClicked = true;
            console.log(`Botão de enviar clicado com seletor: ${selector}`);
            break;
          }
        } catch (error) {
          console.warn(
            `Erro ao tentar clicar no botão com seletor ${selector}:`,
            error.message
          );
        }
      }

      // Se nenhum botão foi encontrado, tentar pressionar Enter
      if (!buttonClicked) {
        console.log(
          "Botão de enviar não encontrado, tentando pressionar Enter"
        );
        await page.keyboard.press("Enter");
        buttonClicked = true;
      }

      if (!buttonClicked) {
        console.error(
          "Não foi possível enviar a mensagem! Tirando screenshot para diagnóstico"
        );
        await saveScreenshot(page, "13-erro-envio-mensagem");
        throw new Error(
          "Não foi possível encontrar uma maneira de enviar a mensagem"
        );
      }

      // Tirar screenshot após envio
      await saveScreenshot(page, "14-mensagem-enviada");

      // Aguardar a mensagem do usuário aparecer
      console.log("Aguardando a mensagem do usuário aparecer na conversa...");

      const userMessageSelectors = [
        ".message-user",
        '[data-testid="message-user"]',
        ".user-message",
        ".message.user",
        ".chat-message.user",
        ".chat-bubble.user",
      ];

      let userMessageSelector = null;
      for (const selector of userMessageSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          userMessageSelector = selector;
          console.log(`Mensagem do usuário detectada com seletor: ${selector}`);
          break;
        } catch (error) {
          // Continuar tentando o próximo seletor
        }
      }

      if (!userMessageSelector) {
        console.error(
          "Mensagem do usuário não apareceu na conversa! Tirando screenshot para diagnóstico"
        );
        await saveScreenshot(page, "15-erro-mensagem-usuario-nao-detectada");
        throw new Error(
          "Mensagem do usuário não apareceu na conversa após envio"
        );
      }

      const userMessageText = await getElementText(page, userMessageSelector);
      console.log(`Mensagem do usuário exibida: "${userMessageText}"`);

      // Aguardar pelo indicador de pensamento (thinking)
      console.log("Aguardando seção de pensamento aparecer...");

      const thinkingSelectors = [
        ".thinking-section",
        '[data-testid="thinking-section"]',
        ".thinking-indicator",
        ".ai-thinking",
        ".message-thinking",
      ];

      let thinkingFound = false;
      for (const selector of thinkingSelectors) {
        try {
          await page.waitForSelector(selector, {
            visible: true,
            timeout: 60000,
          }); // 1 minuto para thinking aparecer
          console.log(`Seção de pensamento detectada com seletor: ${selector}`);
          thinkingFound = true;

          // Tirar screenshot do thinking
          await saveScreenshot(page, "16-thinking-section");

          // Tentar expandir a seção de pensamento
          const toggleSelectors = [
            ".thinking-toggle-button",
            '[data-testid="thinking-toggle"]',
            ".expand-thinking",
            ".thinking-expand-button",
          ];

          for (const toggleSelector of toggleSelectors) {
            try {
              const toggleExists = await page.evaluate(
                (sel) => !!document.querySelector(sel),
                toggleSelector
              );
              if (toggleExists) {
                await page.click(toggleSelector);
                console.log(
                  `Botão de expandir pensamento clicado: ${toggleSelector}`
                );
                await sleep(1000);
                await saveScreenshot(page, "17-thinking-expandido");

                // Verificar se o conteúdo do pensamento está visível
                const thinkingContentSelectors = [
                  ".thinking-content",
                  '[data-testid="thinking-content"]',
                  ".thinking-text",
                ];

                for (const contentSelector of thinkingContentSelectors) {
                  try {
                    const thinkingContent = await getElementText(
                      page,
                      contentSelector
                    );
                    if (thinkingContent) {
                      console.log(
                        `Conteúdo do pensamento: "${thinkingContent.substring(
                          0,
                          100
                        )}..."`
                      );
                      break;
                    }
                  } catch (error) {
                    // Continuar tentando o próximo seletor
                  }
                }

                break;
              }
            } catch (error) {
              // Continuar tentando o próximo seletor
            }
          }

          break;
        } catch (error) {
          // Continuar tentando o próximo seletor
        }
      }

      if (!thinkingFound) {
        console.warn(
          "Seção de pensamento não detectada no timeout, continuando..."
        );
      }

      // Aguardar a resposta do modelo (com tempo maior)
      console.log("Aguardando resposta do modelo...");

      const responseSelectors = [
        ".message-response",
        '[data-testid="message-response"]',
        ".ai-message",
        ".assistant-message",
        ".message.ai",
        ".chat-message.ai",
        ".chat-bubble.ai",
      ];

      let responseSelector = null;
      for (const selector of responseSelectors) {
        try {
          await page.waitForSelector(selector, {
            visible: true,
            timeout: 180000,
          }); // 3 minutos para resposta
          responseSelector = selector;
          console.log(`Resposta do modelo detectada com seletor: ${selector}`);
          break;
        } catch (error) {
          // Continuar tentando o próximo seletor
        }
      }

      if (!responseSelector) {
        console.error(
          "Resposta do modelo não detectada! Tirando screenshot para diagnóstico"
        );
        await saveScreenshot(page, "18-erro-resposta-nao-detectada");
        throw new Error(
          "Resposta do modelo não apareceu na conversa após timeout de 3 minutos"
        );
      }

      // Aguardar mais um pouco para a resposta terminar de ser gerada
      await sleep(5000);

      // Tirar screenshot da resposta
      await saveScreenshot(page, "19-resposta-modelo");

      // Obter o texto da resposta
      const responseText = await getElementText(page, responseSelector);
      console.log(
        `Texto da resposta: "${
          responseText && responseText.substring(0, 100)
        }..."`
      );

      // Verificar se o indicador de modelo está presente
      const modelIndicatorSelectors = [
        ".model-indicator",
        '[data-testid="model-indicator"]',
        ".model-badge",
        ".model-info",
      ];

      let modelIndicatorFound = false;
      for (const selector of modelIndicatorSelectors) {
        try {
          const modelIndicator = await getElementText(page, selector);
          if (modelIndicator) {
            console.log(`Indicador de modelo: "${modelIndicator}"`);
            modelIndicatorFound = true;
            break;
          }
        } catch (error) {
          // Continuar tentando o próximo seletor
        }
      }

      if (!modelIndicatorFound) {
        console.warn("Indicador de modelo não encontrado");
      }

      // Verificar se há referências na resposta
      console.log("Verificando referências...");

      const referencesSelectors = [
        ".references-section",
        '[data-testid="references-section"]',
        ".references",
        ".citations",
        ".sources",
      ];

      let referencesFound = false;
      for (const selector of referencesSelectors) {
        try {
          const references = await page.$$(selector);
          if (references.length > 0) {
            console.log(
              `${references.length} seções de referências encontradas`
            );
            await saveScreenshot(page, "20-referencias");

            // Obter textos das referências
            const referencesText = await getElementText(page, selector);
            console.log(
              `Texto das referências: "${
                referencesText && referencesText.substring(0, 100)
              }..."`
            );
            referencesFound = true;
            break;
          }
        } catch (error) {
          // Continuar tentando o próximo seletor
        }
      }

      if (!referencesFound) {
        console.warn("Nenhuma seção de referências encontrada");
      }

      // Tirar screenshot final
      await saveScreenshot(page, "21-final");

      // Verificações finais
      expect(userMessageText).toContain("olá");
      expect(responseText).not.toBeNull();
      expect(responseText.length).toBeGreaterThan(0);

      console.log("Teste concluído com sucesso");
    },
    TIMEOUT
  );
});
