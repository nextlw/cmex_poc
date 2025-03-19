"use server";

import { exec, execSync } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Tipo para serviços
export type ServiceId = "redis" | "fastapi" | "node" | "frontend";

interface ServiceConfig {
  command: string;
  port: number;
}

// Configuração dos serviços conforme portas especificadas
const serviceConfig: Record<ServiceId, ServiceConfig> = {
  redis: {
    command: "docker start cmex-redis || redis-server --port 6378",
    port: 6378,
  },
  fastapi: {
    command:
      "cd ../fastapi && python -m uvicorn app.main:app --reload --port 10000",
    port: 10000,
  },
  node: {
    command:
      "cd ../buscador_inteligente && nohup pnpm run dev > ./node.log 2>&1 &",
    port: 3000,
  },
  frontend: {
    command: "cd ../frontend && pnpm dev",
    port: 5173,
  },
};

// Função para verificar e encerrar processos em determinada porta antes de iniciar
async function killProcessOnPort(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -P -n -t`);
    if (stdout.trim()) {
      const pid = stdout.trim();
      console.log(`Encerrando processo ${pid} na porta ${port}`);
      execSync(`kill -9 ${pid}`);
      return true;
    }
    return false;
  } catch (error) {
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
    const { port } = serviceConfig[serviceId];

    // Verifica se há um processo rodando na porta especificada
    const { stdout } = await execAsync(`lsof -i :${port} -P -n -t`);

    if (stdout.trim()) {
      const pid = parseInt(stdout.trim(), 10);
      return { running: true, pid };
    }

    return { running: false, pid: null };
  } catch (error) {
    // Se lsof não encontrar nada, retorna código de erro
    return { running: false, pid: null };
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

    // Tempo de espera aumentado para o Node.js
    const waitTime = serviceId === "node" ? 6000 : 3000;
    console.log(
      `Aguardando ${
        waitTime / 1000
      } segundos para verificar se o serviço ${serviceId} iniciou...`
    );

    // Espera um pouco para o serviço iniciar e verifica novamente
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    const newStatus = await checkServiceStatus(serviceId);

    if (newStatus.running) {
      return {
        success: true,
        pid: newStatus.pid,
        message: `Serviço iniciado com sucesso (PID: ${newStatus.pid})`,
      };
    } else {
      // Para node, tenta uma segunda verificação após mais tempo
      if (serviceId === "node") {
        console.log(
          "Aguardando mais 4 segundos para verificar novamente o Node.js..."
        );
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const finalStatus = await checkServiceStatus(serviceId);

        if (finalStatus.running) {
          return {
            success: true,
            pid: finalStatus.pid,
            message: `Serviço iniciado com sucesso (PID: ${finalStatus.pid})`,
          };
        }
      }

      return {
        success: false,
        message: `Falha ao iniciar serviço após ${
          waitTime / 1000
        } segundos. Verifique os logs para mais detalhes.`,
        pid: null,
      };
    }
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
    const { port } = serviceConfig[serviceId];
    const processRef = runningProcesses[serviceId];

    if (processRef) {
      // Se temos uma referência direta ao processo, podemos usar kill
      processRef.kill();
      delete runningProcesses[serviceId];

      // Espera um pouco para o serviço parar e verifica
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const status = await checkServiceStatus(serviceId);

      if (!status.running) {
        return { success: true, message: "Serviço parado com sucesso" };
      }
    }

    // Se temos um PID específico ou se a referência direta não funcionou
    if (pid) {
      try {
        execSync(`kill -9 ${pid}`);
        return { success: true, message: `Processo PID ${pid} encerrado` };
      } catch (err) {
        console.error(`Erro ao matar processo ${pid}:`, err);
      }
    }

    // Tenta encontrar e matar qualquer processo na porta
    return (await killProcessOnPort(port))
      ? { success: true, message: `Processos na porta ${port} encerrados` }
      : { success: true, message: "Nenhum processo encontrado para parar" };
  } catch (error) {
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
  const results: Record<ServiceId, { running: boolean; pid: number | null }> =
    {} as any;

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

  for (const serviceId of services) {
    const { port } = serviceConfig[serviceId];
    results[serviceId] = await killProcessOnPort(port);
  }

  return results;
}
