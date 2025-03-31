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
      "cd ../buscador_inteligente && nohup pnpm run dev > ./node.log 2>&1 &",
    port: getEnvPort("NODE_PORT", 3001),
  },
  frontend: {
    command: "cd ../frontend && pnpm dev",
    port: getEnvPort("FRONTEND_PORT", 5173),
  },
  "node-jina": {
    command:
      "cd ../node-DeepResearch-jina && ./start-dev-server.sh > ./node-jina.log 2>&1 &",
    port: getEnvPort("NODE_JINA_PORT", 3001),
  },
  "ui-jina": {
    command:
      "cd ../deepsearch-ui-jina && ./start-dev-server.sh > ./ui-jina.log 2>&1 &",
    port: getEnvPort("UI_JINA_PORT", 8080),
  },
};

// Função para verificar e encerrar processos em determinada porta
async function killProcessOnPort(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -P -n -t`);
    if (!stdout.trim()) {
      return false;
    }

    const pids = stdout.trim().split("\n");
    console.log(
      `Encontrados ${pids.length} processos na porta ${port}: ${pids.join(
        ", "
      )}`
    );

    for (const pid of pids) {
      try {
        console.log(`Encerrando processo ${pid} na porta ${port}`);
        // Primeiro tenta com SIGTERM para encerramento gracioso
        execSync(`kill ${pid}`);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verifica se o processo ainda existe
        try {
          execSync(`ps -p ${pid} > /dev/null`);
          // Se chegou aqui, o processo ainda existe, tenta com SIGKILL
          console.log(`Processo ${pid} resistente, usando SIGKILL`);
          execSync(`kill -9 ${pid}`);
        } catch (err) {
          // Erro significa que o processo já não existe, o que é bom
          console.log(`Processo ${pid} encerrado com sucesso via SIGTERM`);
        }
      } catch (err) {
        console.error(`Falha ao encerrar o processo ${pid}:`, err);
      }
    }

    // Verifica novamente para ter certeza que todos os processos foram encerrados
    try {
      const { stdout: checkStdout } = await execAsync(
        `lsof -i :${port} -P -n -t`
      );
      if (checkStdout.trim()) {
        console.warn(
          `Ainda existem processos na porta ${port} após tentativas de encerramento`
        );
        return false;
      }
    } catch (err) {
      // Se der erro aqui, provavelmente é porque não há mais processos, o que é bom
    }

    return true;
  } catch (error) {
    console.error(`Erro ao verificar/matar processos na porta ${port}:`, error);
    return false;
  }
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
    await killProcessOnPort(port);

    // Verifica se o serviço já está rodando após a tentativa de limpeza
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
      if (killedByPort) {
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

        if (killedByPort) {
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

    console.log(`Limpando porta ${portToUse} para o serviço ${serviceId}...`);
    results[serviceId] = await killProcessOnPort(portToUse);
  }

  console.log("Processo de limpeza concluído:", results);
  return results;
}
