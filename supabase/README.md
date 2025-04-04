# Configuração do Supabase para CMEX POC

Este documento explica como configurar o banco de dados Supabase para o sistema de atributos NCM.

## Requisitos

- Conta no Supabase (https://supabase.com)
- Acesso ao projeto no Supabase
- Credenciais do projeto configuradas no arquivo `.env`

## Passos para Configuração

### 1. Editor SQL do Supabase

A maneira mais fácil de executar os scripts SQL é através do Editor SQL do Supabase:

1. Faça login no [Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para a seção "SQL Editor"
4. Clique em "New Query"
5. Cole o conteúdo do script SQL e clique em "Run" (ou cmd+enter / ctrl+enter)

### 2. Scripts SQL Importantes

Os seguintes arquivos contêm scripts SQL importantes para a configuração:

- `fastapi/scripts/setup_supabase_ncm_attributes.sql`: Configuração do esquema e tabelas
- `fastapi/scripts/populate_test_data.sql`: Dados de teste para o sistema
- `fastapi/data/ncm_insert.sql`: Inserção de códigos NCM (gerado pelo script de download)

### 3. Fluxo de Configuração

Recomendamos seguir esta ordem:

1. Execute `setup_supabase_ncm_attributes.sql` para criar o esquema e tabelas
2. Execute `populate_test_data.sql` para inserir dados de teste incluindo o NCM 33019010
3. Se necessário, execute `ncm_insert.sql` para adicionar todos os códigos NCM

### 4. Verificação da Instalação

Após executar os scripts, você pode verificar se tudo está funcionando corretamente:

1. No Editor SQL do Supabase, execute:

```sql
SELECT * FROM ncm_attributes.get_ncm_attributes('33019010');
```

Isso deve retornar os atributos configurados para o NCM 33019010.

## Alternativa: Usando os Scripts Python

Se preferir, você pode usar nossos scripts Python para automatizar o processo:

1. Configure as variáveis de ambiente no arquivo `.env`:

   ```
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_KEY=sua_chave_de_servico
   ```

2. Instale as dependências:

   ```bash
   pip install requests pandas python-dotenv supabase
   ```

3. Execute o script para baixar dados atualizados:

   ```bash
   python fastapi/scripts/download_ncm_data.py
   ```

4. Execute o script para importar atributos:

   ```bash
   python fastapi/scripts/import_ncm_attributes_to_supabase.py
   ```

5. Execute o script que faz tudo de uma vez:
   ```bash
   python fastapi/scripts/run_all_setup.py
   ```

## Solução de Problemas

- **Erro "function not found"**: As funções RPC precisam ser criadas manualmente via Editor SQL.
- **Tabelas não aparecem**: Verifique se o esquema `ncm_attributes` foi criado corretamente.
- **Problemas de permissão**: Certifique-se de que as permissões foram concedidas para os perfis `anon`, `authenticated` e `service_role`.

## Notas Importantes

- Sempre faça backups antes de executar scripts SQL em produção
- Os scripts incluem cláusulas `ON CONFLICT` para evitar duplicação de dados
- Você pode precisar ajustar alguns parâmetros dependendo da sua configuração específica
