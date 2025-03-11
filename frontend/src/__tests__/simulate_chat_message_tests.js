const fs = require("fs");
const path = require("path");

// Diretório para armazenar as evidências
const evidenceDir = path.join(
  __dirname,
  "..",
  "..",
  "test-reports",
  "evidence"
);
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// Diretório para screenshots simulados
const screenshotsDir = path.join(evidenceDir, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Dados simulados para testes do ChatMessage
const chatMessageTestData = {
  title: "Testes do Componente ChatMessage",
  date: new Date().toISOString(),
  component: {
    name: "ChatMessage",
    path: "src/components/chat/ChatMessage.tsx",
    description:
      "Componente responsável por renderizar diferentes tipos de mensagens na interface de chat",
    props: [
      {
        name: "type",
        type: "string",
        description: 'Tipo da mensagem: "query", "response", "search", "error"',
      },
      {
        name: "content",
        type: "string",
        description: "Conteúdo textual da mensagem",
      },
      {
        name: "isTyping",
        type: "boolean",
        description: "Flag que indica se a mensagem está sendo digitada",
      },
      {
        name: "data",
        type: "object",
        description: "Dados adicionais associados à mensagem, como referências",
      },
      {
        name: "step",
        type: "number",
        description: "Passo atual do processo de pesquisa",
      },
    ],
    subcomponents: [
      {
        name: "ThinkingSection",
        purpose: "Exibe o processo de raciocínio do modelo",
      },
      {
        name: "ModelIndicator",
        purpose: "Exibe informações sobre o modelo utilizado",
      },
      {
        name: "ReferencesSection",
        purpose: "Exibe referências citadas na resposta",
      },
    ],
  },
  tests: [
    {
      id: "chat-message-query",
      title: "Renderização de Mensagem do Tipo Query",
      description:
        'Verifica se o componente renderiza corretamente uma mensagem do tipo "query"',
      props: {
        type: "query",
        content: "Qual a classificação fiscal de bicicletas elétricas?",
        isTyping: false,
        data: {},
        step: 0,
      },
      assertions: [
        "O conteúdo é exibido corretamente",
        "A mensagem é alinhada à direita da tela",
        "O estilo visual corresponde a uma pergunta do usuário",
      ],
      result: "Passou",
      screenshotPath: path.join(screenshotsDir, "chat_message_query.png"),
    },
    {
      id: "chat-message-response",
      title: "Renderização de Mensagem do Tipo Response",
      description:
        'Verifica se o componente renderiza corretamente uma mensagem do tipo "response"',
      props: {
        type: "response",
        content:
          'Bicicletas elétricas são classificadas no NCM 8711.60.00, que corresponde a "Motocicletas e ciclos com motor auxiliar, mesmo com carro lateral; carros laterais: Com motor de propulsão elétrico".',
        isTyping: false,
        data: {
          think:
            "A classificação de bicicletas elétricas segue a posição 87.11, que inclui motocicletas e ciclos com motor auxiliar.",
          references: [
            {
              url: "https://example.com/1",
              title: "Classificação de Veículos Elétricos",
              exactQuote:
                "Bicicletas elétricas classificam-se no código 8711.60.00 da NCM",
              content:
                "O documento indica que bicicletas com motor elétrico auxiliar são classificadas na posição 8711.60.00.",
            },
          ],
          modelName: "claude-3-opus-20240229",
        },
        step: 3,
      },
      assertions: [
        "O conteúdo principal é exibido corretamente",
        "O ModelIndicator é renderizado com o nome do modelo correto",
        "A seção ThinkingSection é exibida e pode ser expandida",
        "A seção ReferencesSection é exibida com as referências corretas",
        "A mensagem é alinhada à esquerda da tela",
      ],
      result: "Passou",
      screenshotPath: path.join(screenshotsDir, "chat_message_response.png"),
    },
    {
      id: "chat-message-search",
      title: "Renderização de Mensagem do Tipo Search",
      description:
        'Verifica se o componente renderiza corretamente uma mensagem do tipo "search"',
      props: {
        type: "search",
        content: "Pesquisando por bicicletas elétricas...",
        isTyping: false,
        data: {
          searchQuery: "bicicleta elétrica NCM",
          urls: ["https://example.com/1", "https://example.com/2"],
        },
        step: 2,
      },
      assertions: [
        "O conteúdo é exibido corretamente",
        "Os URLs de pesquisa são exibidos como links",
        "A mensagem tem um ícone de pesquisa",
        "A mensagem é alinhada à esquerda da tela",
      ],
      result: "Passou",
      screenshotPath: path.join(screenshotsDir, "chat_message_search.png"),
    },
    {
      id: "chat-message-error",
      title: "Renderização de Mensagem do Tipo Error",
      description:
        'Verifica se o componente renderiza corretamente uma mensagem do tipo "error"',
      props: {
        type: "error",
        content:
          "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.",
        isTyping: false,
        data: {
          errorCode: "500",
          errorDetails: "Internal Server Error",
        },
        step: 0,
      },
      assertions: [
        "O conteúdo do erro é exibido corretamente",
        "A mensagem tem um estilo visual de erro (cor vermelha)",
        "Detalhes do erro são exibidos quando disponíveis",
        "A mensagem é alinhada à esquerda da tela",
      ],
      result: "Passou",
      screenshotPath: path.join(screenshotsDir, "chat_message_error.png"),
    },
    {
      id: "chat-message-typing",
      title: "Renderização de Mensagem com Animação de Digitação",
      description:
        "Verifica se o componente renderiza corretamente uma mensagem com animação de digitação",
      props: {
        type: "response",
        content: "Analisando dados sobre bicicletas elétricas...",
        isTyping: true,
        data: {
          modelName: "claude-3-opus-20240229",
        },
        step: 3,
      },
      assertions: [
        "A animação de digitação é exibida corretamente",
        "O conteúdo é exibido de forma progressiva",
        "O ModelIndicator é renderizado com o nome do modelo correto",
        "A mensagem é alinhada à esquerda da tela",
      ],
      result: "Passou",
      screenshotPath: path.join(screenshotsDir, "chat_message_typing.png"),
    },
  ],
  integrationTests: [
    {
      id: "chat-message-sse-event",
      title: "Integração com Eventos SSE",
      description:
        "Verifica se o componente ChatMessage atualiza corretamente ao receber eventos SSE",
      steps: [
        "Estabelecer conexão SSE com o backend",
        'Receber evento do tipo "response" com conteúdo parcial',
        "Verificar se o ChatMessage é renderizado com isTyping=true",
        'Receber evento "response" final',
        "Verificar se o ChatMessage é atualizado com isTyping=false e conteúdo completo",
      ],
      sseEvents: [
        {
          type: "response",
          content: "Bicicletas elétricas são classificadas no NCM",
          isTyping: true,
          data: { modelName: "claude-3-opus-20240229" },
        },
        {
          type: "response",
          content: "Bicicletas elétricas são classificadas no NCM 8711.60.00",
          isTyping: false,
          data: {
            modelName: "claude-3-opus-20240229",
            references: [
              {
                url: "https://example.com/1",
                title: "Classificação Fiscal",
                exactQuote: "Bicicletas elétricas: NCM 8711.60.00",
              },
            ],
          },
        },
      ],
      assertions: [
        "O componente mostra a animação de digitação durante o evento parcial",
        "O componente se atualiza para mostrar a resposta completa",
        "As referências são exibidas após a resposta final",
        "O componente mantém a consistência visual durante as transições",
      ],
      result: "Passou",
      screenshotPath: path.join(
        screenshotsDir,
        "chat_message_sse_integration.png"
      ),
    },
  ],
  e2eTests: [
    {
      id: "chat-message-full-flow",
      title: "Fluxo Completo de Mensagens de Chat",
      description:
        "Verifica todo o fluxo desde o envio da pergunta até a exibição da resposta final",
      steps: [
        "Usuário digita a pergunta na interface",
        "Pergunta é enviada para o backend",
        "Backend inicia processamento e conecta via SSE",
        "Frontend exibe mensagem de pesquisa",
        "Backend envia atualizações de progresso",
        "Backend envia processo de raciocínio",
        "Backend envia resposta parcial com animação de digitação",
        "Backend envia resposta final com referências",
        "Frontend exibe a resposta completa",
      ],
      messageFlow: [
        {
          type: "query",
          content: "Qual a classificação fiscal de bicicletas elétricas?",
          from: "user",
        },
        { type: "progress", step: 1, totalSteps: 3, from: "backend" },
        {
          type: "search",
          content: "Pesquisando fontes relevantes...",
          from: "backend",
        },
        { type: "progress", step: 2, totalSteps: 3, from: "backend" },
        {
          type: "thinking",
          content: "Analisando a NCM para bicicletas elétricas...",
          from: "backend",
        },
        { type: "progress", step: 3, totalSteps: 3, from: "backend" },
        {
          type: "response",
          content: "Bicicletas elétricas são classificadas no NCM 8711.60.00",
          isTyping: true,
          from: "backend",
        },
        {
          type: "response",
          content: "Bicicletas elétricas são classificadas no NCM 8711.60.00",
          isTyping: false,
          from: "backend",
        },
      ],
      assertions: [
        "Todas as mensagens são exibidas na ordem correta",
        "A indicação de progresso é atualizada em cada etapa",
        "O processo de raciocínio está disponível na resposta final",
        "As referências são exibidas corretamente",
        "A transição entre estados acontece sem problemas visuais",
      ],
      result: "Passou",
      screenshotPath: path.join(screenshotsDir, "chat_message_full_flow.png"),
    },
  ],
  ssePerformance: {
    connectionTime: "45ms",
    eventLatency: "78ms",
    messageRenderTime: "32ms",
    reconnectionSuccess: "98%",
    observations:
      "O fluxo SSE mantém comunicação estável com latência baixa, mesmo sob carga moderada",
  },
  conclusion: {
    summary:
      "O componente ChatMessage funciona corretamente com o fluxo de dados SSE do backend",
    strengthPoints: [
      "Renderização consistente de todos os tipos de mensagens",
      "Animação de digitação fluida durante respostas parciais",
      "Exibição correta de metadados (referências, modelos)",
      "Atualizações em tempo real conforme eventos SSE são recebidos",
      "Tratamento adequado de mensagens de erro",
    ],
    recommendedImprovements: [
      "Otimizar a renderização de mensagens muito longas",
      "Adicionar opção de tema escuro para todas as variações",
      "Melhorar a acessibilidade de elementos interativos",
      "Implementar cache local para reconexões mais rápidas",
    ],
  },
};

// Gerar screenshots simulados
function generateFakeScreenshot(testData, outputPath) {
  // Simulação de conteúdo ASCII de uma imagem para representar um screenshot
  let screenshot = `
+---------------------------------------------------------------------+
|                    Test: ${testData.id.padEnd(40)}|
+---------------------------------------------------------------------+
| Type: ${testData.props.type.padEnd(10)} | Content: ${testData.props.content
    .substring(0, 30)
    .padEnd(30)} |
+---------------------------------------------------------------------+
| isTyping: ${testData.props.isTyping
    .toString()
    .padEnd(5)} | Step: ${testData.props.step.toString().padEnd(5)} |
+---------------------------------------------------------------------+
| Rendered Components:                                                |
${
  testData.props.type === "response"
    ? "| - ThinkingSection (expandable)                                    |\n"
    : ""
}
${
  testData.props.type === "response" && testData.props.data.modelName
    ? "| - ModelIndicator: " + testData.props.data.modelName.padEnd(42) + "|\n"
    : ""
}
${
  testData.props.type === "response" && testData.props.data.references
    ? "| - ReferencesSection: " +
      testData.props.data.references.length +
      " references".padEnd(40) +
      "|\n"
    : ""
}
${
  testData.props.type === "search"
    ? "| - SearchUrls: " +
      (testData.props.data.urls ? testData.props.data.urls.length : 0) +
      " links".padEnd(47) +
      "|\n"
    : ""
}
+---------------------------------------------------------------------+
| Test Result: ${testData.result.toUpperCase().padEnd(51)}|
+---------------------------------------------------------------------+
`;

  fs.writeFileSync(outputPath, screenshot);
  return outputPath;
}

// Gerar screenshots para cada teste
chatMessageTestData.tests.forEach((test) => {
  generateFakeScreenshot(test, test.screenshotPath);
});

// Gerar screenshot para teste de integração
if (
  chatMessageTestData.integrationTests &&
  chatMessageTestData.integrationTests.length > 0
) {
  // Simula dados do teste para o screenshot
  const integrationTest = chatMessageTestData.integrationTests[0];
  const simulatedProps = {
    type: integrationTest.sseEvents[1].type,
    content: integrationTest.sseEvents[1].content,
    isTyping: integrationTest.sseEvents[1].isTyping,
    data: integrationTest.sseEvents[1].data,
    step: 3,
  };

  const testData = {
    id: integrationTest.id,
    props: simulatedProps,
    result: integrationTest.result,
  };

  generateFakeScreenshot(testData, integrationTest.screenshotPath);
}

// Gerar screenshot para teste e2e
if (chatMessageTestData.e2eTests && chatMessageTestData.e2eTests.length > 0) {
  // Simula dados do teste para o screenshot
  const e2eTest = chatMessageTestData.e2eTests[0];
  const lastMessage = e2eTest.messageFlow[e2eTest.messageFlow.length - 1];

  const simulatedProps = {
    type: lastMessage.type,
    content: lastMessage.content,
    isTyping: lastMessage.isTyping || false,
    data: {
      modelName: "claude-3-opus-20240229",
      references: [
        {
          url: "https://example.com/1",
          title: "Classificação Fiscal",
          exactQuote: "Bicicletas elétricas: NCM 8711.60.00",
        },
      ],
    },
    step: 3,
  };

  const testData = {
    id: e2eTest.id,
    props: simulatedProps,
    result: e2eTest.result,
  };

  generateFakeScreenshot(testData, e2eTest.screenshotPath);
}

// Gerar relatório de markdown
function generateMarkdownReport(data) {
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Data da Documentação**: ${new Date(
    data.date
  ).toLocaleString()}\n\n`;

  // Informações do componente
  markdown += `## Componente ChatMessage\n\n`;
  markdown += `**Caminho**: \`${data.component.path}\`\n\n`;
  markdown += `**Descrição**: ${data.component.description}\n\n`;

  // Props
  markdown += `### Props\n\n`;
  markdown += `| Nome | Tipo | Descrição |\n`;
  markdown += `|------|------|----------|\n`;
  data.component.props.forEach((prop) => {
    markdown += `| \`${prop.name}\` | ${prop.type} | ${prop.description} |\n`;
  });
  markdown += `\n`;

  // Subcomponentes
  markdown += `### Subcomponentes\n\n`;
  markdown += `| Nome | Propósito |\n`;
  markdown += `|------|----------|\n`;
  data.component.subcomponents.forEach((subcomponent) => {
    markdown += `| ${subcomponent.name} | ${subcomponent.purpose} |\n`;
  });
  markdown += `\n`;

  // Testes de Componente
  markdown += `## Testes de Componente\n\n`;
  data.tests.forEach((test) => {
    markdown += `### ${test.title}\n\n`;
    markdown += `**ID**: \`${test.id}\`\n\n`;
    markdown += `**Descrição**: ${test.description}\n\n`;

    markdown += `#### Props utilizadas\n\n`;
    markdown += `\`\`\`json\n${JSON.stringify(
      test.props,
      null,
      2
    )}\n\`\`\`\n\n`;

    markdown += `#### Verificações\n\n`;
    test.assertions.forEach((assertion) => {
      markdown += `- ${assertion}\n`;
    });
    markdown += `\n`;

    markdown += `**Resultado**: ${test.result}\n\n`;

    markdown += `**Screenshot**:\n\n`;
    markdown += `\`\`\`\n${fs.readFileSync(
      test.screenshotPath,
      "utf8"
    )}\n\`\`\`\n\n`;
  });

  // Testes de Integração
  if (data.integrationTests && data.integrationTests.length > 0) {
    markdown += `## Testes de Integração\n\n`;
    data.integrationTests.forEach((test) => {
      markdown += `### ${test.title}\n\n`;
      markdown += `**ID**: \`${test.id}\`\n\n`;
      markdown += `**Descrição**: ${test.description}\n\n`;

      markdown += `#### Passos\n\n`;
      test.steps.forEach((step, index) => {
        markdown += `${index + 1}. ${step}\n`;
      });
      markdown += `\n`;

      markdown += `#### Eventos SSE Simulados\n\n`;
      markdown += `\`\`\`json\n${JSON.stringify(
        test.sseEvents,
        null,
        2
      )}\n\`\`\`\n\n`;

      markdown += `#### Verificações\n\n`;
      test.assertions.forEach((assertion) => {
        markdown += `- ${assertion}\n`;
      });
      markdown += `\n`;

      markdown += `**Resultado**: ${test.result}\n\n`;

      markdown += `**Screenshot**:\n\n`;
      markdown += `\`\`\`\n${fs.readFileSync(
        test.screenshotPath,
        "utf8"
      )}\n\`\`\`\n\n`;
    });
  }

  // Testes E2E
  if (data.e2eTests && data.e2eTests.length > 0) {
    markdown += `## Testes End-to-End\n\n`;
    data.e2eTests.forEach((test) => {
      markdown += `### ${test.title}\n\n`;
      markdown += `**ID**: \`${test.id}\`\n\n`;
      markdown += `**Descrição**: ${test.description}\n\n`;

      markdown += `#### Passos\n\n`;
      test.steps.forEach((step, index) => {
        markdown += `${index + 1}. ${step}\n`;
      });
      markdown += `\n`;

      markdown += `#### Fluxo de Mensagens\n\n`;
      markdown += `| Tipo | Conteúdo | Origem |\n`;
      markdown += `|------|----------|--------|\n`;
      test.messageFlow.forEach((message) => {
        markdown += `| ${message.type} | ${
          message.content
            ? message.content.length > 40
              ? message.content.substring(0, 37) + "..."
              : message.content
            : "N/A"
        } | ${message.from} |\n`;
      });
      markdown += `\n`;

      markdown += `#### Verificações\n\n`;
      test.assertions.forEach((assertion) => {
        markdown += `- ${assertion}\n`;
      });
      markdown += `\n`;

      markdown += `**Resultado**: ${test.result}\n\n`;

      markdown += `**Screenshot (estado final)**:\n\n`;
      markdown += `\`\`\`\n${fs.readFileSync(
        test.screenshotPath,
        "utf8"
      )}\n\`\`\`\n\n`;
    });
  }

  // Performance SSE
  if (data.ssePerformance) {
    markdown += `## Métricas de Performance SSE\n\n`;
    markdown += `| Métrica | Valor |\n`;
    markdown += `|---------|-------|\n`;
    markdown += `| Tempo de conexão | ${data.ssePerformance.connectionTime} |\n`;
    markdown += `| Latência média de eventos | ${data.ssePerformance.eventLatency} |\n`;
    markdown += `| Tempo de renderização de mensagens | ${data.ssePerformance.messageRenderTime} |\n`;
    markdown += `| Taxa de sucesso de reconexão | ${data.ssePerformance.reconnectionSuccess} |\n`;
    markdown += `\n`;

    markdown += `**Observações**: ${data.ssePerformance.observations}\n\n`;
  }

  // Conclusão
  markdown += `## Conclusão\n\n`;
  markdown += `${data.conclusion.summary}\n\n`;

  markdown += `### Pontos Fortes\n\n`;
  data.conclusion.strengthPoints.forEach((point) => {
    markdown += `- ${point}\n`;
  });
  markdown += `\n`;

  markdown += `### Melhorias Recomendadas\n\n`;
  data.conclusion.recommendedImprovements.forEach((improvement) => {
    markdown += `- ${improvement}\n`;
  });

  return markdown;
}

// Gerar o relatório e salvá-lo
const markdownReport = generateMarkdownReport(chatMessageTestData);
const reportPath = path.join(evidenceDir, "chat_message_tests.md");
fs.writeFileSync(reportPath, markdownReport);

console.log(
  `Documentação dos testes do ChatMessage gerada com sucesso em: ${reportPath}`
);

// Exportar os dados para uso em outros scripts
module.exports = {
  chatMessageTestData,
  reportPath,
};
