"use server";

import { exec, execSync } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

// Tipo para serviços
export type ServiceId =
  | "redis"
  | "fastapi"
  | "node"
  | "frontend"
  | "node-jina"
  | "ui-jina";

interface ServiceConfig {
  command: string;
  port: number;
}

// Função auxiliar para obter porta do .env ou usar valor padrão
function getEnvPort(envVar: string, defaultPort: number): number {
  const portValue = process.env[envVar];
  return portValue ? parseInt(portValue, 10) : defaultPort;
}

// Configuração dos serviços com portas do .env
const serviceConfig: Record<ServiceId, ServiceConfig> = {
  redis: {
    command: `docker start cmex-redis || redis-server --port ${getEnvPort(
      "REDIS_PORT",
      6378
    )}`,
    port: getEnvPort("REDIS_PORT", 6378),
  },
  fastapi: {
    command: `cd ../fastapi && python -m uvicorn app.main:app --reload --port ${getEnvPort(
      "FASTAPI_PORT",
      10000
    )}`,
    port: getEnvPort("FASTAPI_PORT", 10000),
  },
  node: {
    command:
      "cd /Users/williamduarte/Pesquisa_CMEX/cmex_poc/buscador_inteligente && ./start-dev-server.sh > ./node.log 2>&1 &",
    port: 3001,
  },
  frontend: {
    command: "cd ../frontend && pnpm dev",
    port: getEnvPort("FRONTEND_PORT", 5173),
  },
  "node-jina": {
    command:
      "cd ../node-DeepResearch-nexcode && ./start-dev-server.sh > ./node-jina.log 2>&1 &",
    port: 3002,
  },
  "ui-jina": {
    command:
      "cd /Users/williamduarte/Pesquisa_CMEX/cmex_poc/deepsearch-ui-nexcode && ./start-spa.sh > ./ui-jina.log 2>&1 &",
    port: 8080,
  },
};

// Função para verificar e encerrar processos em determinada porta
async function killProcessOnPort(
  port: number
): Promise<{ success: boolean; message: string }> {
  console.log(`Verificando porta ${port}...`);
  let initialPids: string[] = [];

  try {
    // Tenta encontrar processos na porta
    const { stdout } = await execAsync(`lsof -i :${port} -P -n -t`);
    initialPids = stdout
      .trim()
      .split("\n")
      .filter((pid) => pid !== ""); // Filtra PIDs vazios

    if (initialPids.length === 0) {
      // Nenhum processo encontrado, a porta está livre!
      const message = `Porta ${port} já está livre.`;
      console.log(message);
      return { success: true, message };
    }

    // Processos encontrados, continuar para tentar encerrá-los
    console.log(
      `Encontrados ${
        initialPids.length
      } processos na porta ${port}: ${initialPids.join(", ")}`
    );
  } catch (error: any) {
    // Se lsof falhar com código de erro (geralmente porque não encontrou processos), consideramos a porta livre
    if (error.code && error.code !== 0) {
      const message = `Porta ${port} já está livre (lsof falhou, presumindo ausência de processo).`;
      console.log(message);
      return { success: true, message };
    } else {
      // Outro erro inesperado ao verificar a porta
      const message = `Erro inesperado ao verificar porta ${port}: ${
        error.message || error
      }`;
      console.error(message);
      return { success: false, message };
    }
  }

  // Se chegamos aqui, encontramos PIDs e precisamos tentar matá-los
  let allKilled = true;
  for (const pid of initialPids) {
    try {
      console.log(`Tentando encerrar processo ${pid} na porta ${port}`);
      // Tenta SIGTERM
      execSync(`kill ${pid}`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verifica se ainda existe
      try {
        execSync(`ps -p ${pid} > /dev/null`);
        console.log(`Processo ${pid} resistente, usando SIGKILL`);
        execSync(`kill -9 ${pid}`);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Pequeno delay após SIGKILL
        // Re-verifica após SIGKILL
        try {
          execSync(`ps -p ${pid} > /dev/null`);
          console.error(
            `ERRO: Falha ao encerrar processo ${pid} mesmo com SIGKILL.`
          );
          allKilled = false; // Marca como falha se ainda existir
        } catch (e) {
          console.log(`Processo ${pid} encerrado com sucesso via SIGKILL.`);
        }
      } catch (err) {
        console.log(`Processo ${pid} encerrado com sucesso via SIGTERM.`);
      }
    } catch (err: any) {
      // Se kill falhar com 'no such process', está ok, já foi encerrado
      if (err.message?.includes("No such process")) {
        console.log(`Processo ${pid} já não existia.`);
      } else {
        console.error(
          `Falha ao tentar encerrar o processo ${pid}:`,
          err.message || err
        );
        // Consideramos falha se o erro não for 'no such process'
        allKilled = false;
      }
    }
  }

  // Verificação final (opcional, mas boa prática)
  try {
    const { stdout: finalCheck } = await execAsync(`lsof -i :${port} -P -n -t`);
    if (finalCheck.trim() !== "") {
      const message = `AVISO: Processos ainda detectados na porta ${port} após tentativas de encerramento.`;
      console.warn(message);
      // Mesmo com aviso, pode ser considerado 'sucesso' na limpeza se allKilled não foi false
      return {
        success: allKilled,
        message: allKilled
          ? `Processos na porta ${port} encerrados (com possíveis resquícios).`
          : message,
      };
    }
  } catch (err) {
    // Erro aqui significa que não há processos, o que é bom
  }

  const finalMessage = `Porta ${port} liberada com sucesso.`;
  console.log(finalMessage);
  return { success: true, message: finalMessage };
}

// Mapa para rastrear processos em execução
const runningProcesses: Record<string, any> = {};

/**
 * Verifica o status de um serviço
 */
export async function checkServiceStatus(serviceId: ServiceId) {
  try {
    const { port: configPort } = serviceConfig[serviceId];
    let port = configPort;

    // UI-Jina sempre usa porta 8080 fixa
    if (serviceId === "ui-jina") {
      port = 8080; // Porta fixa para UI-Jina

      // Tentativa de leitura do arquivo .port.txt apenas para log
      try {
        const portFilePath = "../deepsearch-ui-jina/.port.txt";
        if (fs.existsSync(portFilePath)) {
          const portFromFile = fs.readFileSync(portFilePath, "utf8").trim();
          // Só loga se a porta no arquivo for diferente da porta fixa
          if (portFromFile !== "8080") {
            console.log(
              `UI-Jina porta no arquivo: ${portFromFile}, usando porta fixa: ${port}`
            );
          }
        }
      } catch (err) {
        console.log(
          "Não foi possível ler o arquivo de porta para UI-Jina, usando porta fixa 8080"
        );
      }
    }

    // Verifica se há um processo rodando na porta especificada
    const { stdout } = await execAsync(`lsof -i :${port} -P -n -t`);

    if (stdout.trim()) {
      const pids = stdout.trim().split("\n");
      const pid = parseInt(pids[0], 10); // Usar o primeiro PID se houver múltiplos
      return { running: true, pid, actualPort: port };
    }

    return { running: false, pid: null, actualPort: port };
  } catch (error) {
    // Se lsof não encontrar nada, retorna código de erro
    return { running: false, pid: null, actualPort: null };
  }
}

/**
 * Inicia um serviço
 */
export async function startService(serviceId: ServiceId) {
  try {
    const { port } = serviceConfig[serviceId];

    // Verifica e encerra processos existentes na porta
    const killResult = await killProcessOnPort(port);

    // Logar a mensagem da limpeza, mas não tratar como erro fatal se success=true
    console.log(`Resultado da limpeza da porta ${port}: ${killResult.message}`);

    if (!killResult.success) {
      // Só retorna erro se a limpeza REALMENTE falhou (não conseguiu matar um processo existente)
      return {
        success: false,
        pid: null,
        message: `Falha ao limpar a porta ${port} antes de iniciar: ${killResult.message}`,
      };
    }

    // Verifica se o serviço já está rodando após a limpeza (pode ter iniciado rapidamente?)
    const status = await checkServiceStatus(serviceId);

    if (status.running) {
      return {
        success: true,
        pid: status.pid,
        message: `Serviço já está em execução (PID: ${status.pid})`,
      };
    }

    const { command } = serviceConfig[serviceId];

    console.log(`Executando comando para ${serviceId}: ${command}`);

    // Executa o comando do serviço em background
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao iniciar ${serviceId}:`, error);
      }

      if (stdout) {
        console.log(`Saída do serviço ${serviceId}:`, stdout);
      }

      if (stderr) {
        console.error(`Erro do serviço ${serviceId}:`, stderr);
      }
    });

    // Armazena a referência ao processo
    runningProcesses[serviceId] = childProcess;

    // Tempo de espera personalizado por serviço
    const waitTimeMap: Record<ServiceId, number> = {
      node: 6000,
      "node-jina": 5000,
      "ui-jina": 4000,
      redis: 3001,
      frontend: 4000,
      fastapi: 5000,
    };

    const waitTime = waitTimeMap[serviceId] || 3001;
    console.log(
      `Aguardando ${
        waitTime / 1000
      } segundos para verificar se o serviço ${serviceId} iniciou...`
    );

    // Espera um pouco para o serviço iniciar e verifica novamente
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    const newStatus = await checkServiceStatus(serviceId);

    // Para interfaces web, tentamos verificar com mais calma
    let attempts = 0;
    const maxAttempts = serviceId === "ui-jina" ? 3 : 1;
    const retryDelay = 2000;

    if (newStatus.running) {
      return {
        success: true,
        pid: newStatus.pid,
        message: `Serviço iniciado com sucesso (PID: ${newStatus.pid})`,
      };
    }

    // Para node, podemos tentar mais vezes
    while (attempts < maxAttempts) {
      console.log(
        `Tentativa ${attempts + 1}/${maxAttempts}: aguardando mais ${
          retryDelay / 1000
        }s para verificar ${serviceId}...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      const retryStatus = await checkServiceStatus(serviceId);

      if (retryStatus.running) {
        return {
          success: true,
          pid: retryStatus.pid,
          message: `Serviço iniciado com sucesso após ${
            attempts + 1
          } tentativas (PID: ${retryStatus.pid})`,
        };
      }

      attempts++;
    }

    return {
      success: false,
      message: `Falha ao iniciar serviço após ${maxAttempts} tentativas. Verifique os logs para mais detalhes.`,
      pid: null,
    };
  } catch (error) {
    console.error("Erro ao iniciar serviço:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      pid: null,
    };
  }
}

/**
 * Para um serviço
 */
export async function stopService(serviceId: ServiceId, pid?: number | null) {
  try {
    // Verificar qual é a porta real que o serviço está usando
    const statusCheck = await checkServiceStatus(serviceId);
    // Obter a porta real do status ou usar a porta configurada como fallback
    const portToUse = statusCheck.actualPort || serviceConfig[serviceId].port;

    let stopped = false;

    console.log(
      `Tentando parar o serviço ${serviceId} com PID ${
        pid || "desconhecido"
      } na porta ${portToUse}`
    );

    // Para UI-Jina, sempre tenta matar o processo na porta 8080 primeiro
    if (serviceId === "ui-jina") {
      console.log("UI-Jina detectado, tentando parar processo na porta 8080");
      const killedByPort = await killProcessOnPort(8080);
      if (killedByPort.success) {
        stopped = true;
        console.log("UI-Jina parado com sucesso via porta 8080");
      }
    }

    // Se ainda não parou, tenta os outros métodos
    if (!stopped) {
      // 1. Primeiro tenta usar a referência direta ao processo, se disponível
      const processRef = runningProcesses[serviceId];
      if (processRef) {
        console.log(
          `Usando referência direta para encerrar o processo ${serviceId}`
        );
        try {
          processRef.kill("SIGTERM"); // Tenta primeiro com SIGTERM

          // Aguarda um pouco e depois verifica
          await new Promise((resolve) => setTimeout(resolve, 1000));
          delete runningProcesses[serviceId];

          const status = await checkServiceStatus(serviceId);
          if (!status.running) {
            stopped = true;
            console.log(
              `Serviço ${serviceId} parou com sucesso usando referência direta`
            );
          } else {
            // Se ainda está rodando, tenta com SIGKILL
            processRef.kill("SIGKILL");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const statusAfterKill = await checkServiceStatus(serviceId);
            if (!statusAfterKill.running) {
              stopped = true;
              console.log(
                `Serviço ${serviceId} parou com sucesso usando SIGKILL`
              );
            }
          }
        } catch (err) {
          console.error(
            `Erro ao matar processo ${serviceId} via referência:`,
            err
          );
        }
      }

      // 2. Se não parou ainda e temos um PID específico, tenta matar diretamente
      if (!stopped && pid) {
        console.log(`Tentando matar o PID ${pid} diretamente`);
        try {
          // Tenta primeiro com um sinal normal
          execSync(`kill ${pid}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const status = await checkServiceStatus(serviceId);
          if (!status.running) {
            stopped = true;
            console.log(
              `Serviço ${serviceId} parou com sucesso usando kill no PID ${pid}`
            );
          } else {
            // Se ainda está rodando, força com -9
            execSync(`kill -9 ${pid}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const statusAfterKill = await checkServiceStatus(serviceId);
            if (!statusAfterKill.running) {
              stopped = true;
              console.log(
                `Serviço ${serviceId} parou com sucesso usando kill -9 no PID ${pid}`
              );
            }
          }
        } catch (err) {
          console.error(`Erro ao matar PID ${pid} diretamente:`, err);
        }
      }

      // 3. Se ainda não parou, tenta encontrar e matar qualquer processo na porta
      if (!stopped) {
        console.log(`Tentando matar qualquer processo na porta ${portToUse}`);
        const killedByPort = await killProcessOnPort(portToUse);

        if (killedByPort.success) {
          stopped = true;
          console.log(
            `Serviço ${serviceId} parou com sucesso matando processos na porta ${portToUse}`
          );
        }
      }
    }

    // Verifica o status final
    const finalStatus = await checkServiceStatus(serviceId);
    if (!finalStatus.running) {
      return { success: true, message: "Serviço parado com sucesso" };
    } else {
      return {
        success: false,
        message: `Não foi possível parar completamente o serviço ${serviceId}. Tente matar o processo manualmente (PID: ${finalStatus.pid})`,
      };
    }
  } catch (error) {
    console.error(`Erro ao tentar parar serviço ${serviceId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verifica o status de todos os serviços
 */
export async function checkAllServices() {
  const services = Object.keys(serviceConfig) as ServiceId[];
  const results: Record<
    ServiceId,
    { running: boolean; pid: number | null; actualPort?: number | null }
  > = {} as any;

  for (const serviceId of services) {
    results[serviceId] = await checkServiceStatus(serviceId);
  }

  return results;
}

/**
 * Encerra todos os processos em portas utilizadas pelos serviços
 */
export async function killAllServiceProcesses() {
  const services = Object.keys(serviceConfig) as ServiceId[];
  const results: Record<ServiceId, boolean> = {} as any;

  console.log("Iniciando processo de limpeza de todas as portas...");

  // Primeiro verificar o status atual de todos os serviços
  const statusResults = await checkAllServices();

  for (const serviceId of services) {
    // Usar a porta real verificada, se disponível, ou a porta da configuração
    const portStatus = statusResults[serviceId];
    const portToUse = portStatus.actualPort || serviceConfig[serviceId].port;

    if (portToUse) {
      console.log(`Limpando porta ${portToUse} para o serviço ${serviceId}...`);
      const killResult = await killProcessOnPort(portToUse);
      results[serviceId] = killResult.success;
    }
  }

  console.log("Resultados da limpeza de portas:", results);
  return results;
}
