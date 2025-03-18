# Guia do Usuário CMEX

Este guia fornece instruções detalhadas sobre como utilizar a plataforma CMEX para consulta e classificação de NCM.

## Índice

1. [Introdução](#introdução)
2. [Acesso à Plataforma](#acesso-à-plataforma)
3. [Interface Principal](#interface-principal)
4. [Consulta de NCM](#consulta-de-ncm)
5. [Modo DeepResearch](#modo-deepresearch)
6. [Atualizações em Tempo Real](#atualizações-em-tempo-real)
7. [Histórico de Consultas](#histórico-de-consultas)
8. [Configurações](#configurações)
9. [Solução de Problemas](#solução-de-problemas)

## Introdução

CMEX é uma plataforma avançada para consulta e classificação de NCM (Nomenclatura Comum do Mercosul) utilizando inteligência artificial. A plataforma permite:

- Consultar a classificação fiscal (NCM) de produtos
- Validar classificações com análise profunda (DeepResearch)
- Visualizar informações detalhadas sobre impostos e atributos
- Receber atualizações em tempo real do progresso das análises
- Acessar histórico de consultas anteriores

## Acesso à Plataforma

1. Abra seu navegador e acesse a URL da plataforma CMEX
2. Faça login com suas credenciais (e-mail e senha)
3. Após o login bem-sucedido, você será redirecionado para a página inicial

## Interface Principal

A interface principal da CMEX é composta por:

- **Barra de navegação superior**: Acesso às diferentes seções da plataforma
- **Campo de consulta**: Área para inserir a descrição do produto
- **Painel de resultados**: Exibição dos resultados da consulta
- **Painel lateral**: Configurações adicionais e filtros
- **Indicador de status**: Mostra o status atual da conexão com o servidor

## Consulta de NCM

Para realizar uma consulta de NCM:

1. Na página inicial, digite a descrição detalhada do produto no campo de consulta
2. Selecione o estado de origem no menu suspenso
3. (Opcional) Configure parâmetros adicionais:
   - Operação (venda, compra, etc.)
   - Regime tributário
   - Modelo de IA a ser utilizado
4. Clique no botão "Consultar"
5. Aguarde o processamento da consulta
6. Os resultados serão exibidos no painel de resultados, incluindo:
   - Código NCM
   - Descrição do NCM
   - Atributos do produto
   - Valores de impostos (IPI, ICMS, PIS, COFINS)

## Modo DeepResearch

O modo DeepResearch realiza uma análise profunda para validar a classificação fiscal:

1. Ative a opção "DeepResearch" antes de realizar a consulta
2. Após a consulta inicial, o sistema iniciará automaticamente a análise profunda
3. Você poderá acompanhar o progresso da análise em tempo real através dos indicadores na interface
4. O sistema exibirá cada etapa do processo em tempo real:
   - Preparação da consulta
   - Análise de contexto
   - Validação do NCM
   - Comparação com a legislação
   - Conclusão da análise
5. Ao concluir, o sistema exibirá:
   - Confirmação ou sugestão de correção do NCM
   - Nível de confiança da validação
   - Justificativa detalhada
   - Referências utilizadas na análise

## Atualizações em Tempo Real

A plataforma utiliza tecnologia Server-Sent Events (SSE) para fornecer atualizações em tempo real:

1. **Indicador de Conexão**: Um pequeno ícone no canto superior direito indica o status da conexão:

   - Verde: Conexão ativa
   - Amarelo: Reconectando
   - Vermelho: Conexão perdida

2. **Progresso do DeepResearch**: Durante a análise profunda, você verá atualizações em tempo real:

   - Barra de progresso indicando o percentual de conclusão
   - Mensagens detalhando cada etapa em andamento
   - Animações sutis indicando processamento ativo

3. **Notificações de Eventos**:

   - O sistema envia notificações sobre eventos importantes
   - Você receberá alertas quando uma análise for concluída
   - Erros ou interrupções serão comunicados imediatamente

4. **Visualização do "Pensamento" do Modelo**:
   - Clique no botão "Ver raciocínio" para acompanhar o processo de pensamento do modelo de IA
   - Veja como o modelo está analisando o produto em tempo real
   - Entenda os critérios utilizados para a classificação

## Histórico de Consultas

Para acessar o histórico de consultas:

1. Clique em "Histórico" na barra de navegação superior
2. Visualize todas as consultas anteriores em ordem cronológica
3. Utilize os filtros para buscar consultas específicas:
   - Por data
   - Por descrição
   - Por código NCM
4. Clique em uma consulta para visualizar seus detalhes completos
5. Você pode reutilizar consultas anteriores clicando no botão "Consultar novamente"

## Configurações

Para acessar as configurações da plataforma:

1. Clique em "Configurações" na barra de navegação superior
2. Personalize suas preferências:
   - Modelo de IA padrão
   - Estado de origem padrão
   - Tema da interface (claro/escuro)
   - Frequência de atualizações em tempo real
3. Gerencie suas informações de conta:
   - Alterar senha
   - Atualizar informações de perfil

## Solução de Problemas

### Consulta não retorna resultados

- Verifique se a descrição do produto é detalhada o suficiente
- Tente utilizar termos mais específicos ou técnicos
- Experimente um modelo de IA diferente

### Análise DeepResearch muito lenta

- A análise profunda pode levar alguns minutos dependendo da complexidade
- Verifique sua conexão com a internet
- Certifique-se de que você está vendo as atualizações em tempo real
- Tente novamente em horários de menor tráfego

### Valores de impostos incorretos

- Verifique se o estado de origem está correto
- Confirme se o regime tributário selecionado é o adequado
- Utilize o modo DeepResearch para validação adicional

### Sem atualizações em tempo real

- Verifique o indicador de conexão no canto superior direito
- Se estiver vermelho, a conexão foi perdida
- Tente recarregar a página para restabelecer a conexão
- Verifique se há bloqueios de firewall ou proxy que possam impedir conexões SSE
- Alguns navegadores antigos podem não suportar SSE; use um navegador moderno

### Erro de conexão

- Verifique sua conexão com a internet
- Atualize a página
- Limpe o cache do navegador
- Se o problema persistir, entre em contato com o suporte
