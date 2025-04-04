# Testes da API de Atributos NCM

*Data de execução: 2025-04-03 19:56:06*

## 1. Consulta da relação de atributos de um código NCM específico

### Requisição

```bash
curl -X GET "https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo-ncm/02011000" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}"
```

### Resposta

*Erro: 401 Client Error: Unauthorized for url: https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo-ncm/02011000*

## 2. Consulta de NCM com parâmetros

### Requisição

```bash
curl -X GET "https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo-ncm/84099190?modalidade=IMPORTACAO&objetivos=PRODUTO" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}"
```

### Resposta

*Erro: 401 Client Error: Unauthorized for url: https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo-ncm/84099190?modalidade=IMPORTACAO&objetivos=PRODUTO*

## 3. Consulta de atributos por código

### Requisição

```bash
curl -X POST "https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo/consulta-codigo" \
  -H "Content-Type: application/json" \
  -d '{"codigos": ["ATT_2386", "ATT_8836"], "data": "2025-04-03T00:00:00.000Z"}' \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}"
```

### Resposta

*Erro: 401 Client Error: Unauthorized for url: https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo/consulta-codigo*

## 4. Consulta de atributos por nome

### Requisição

```bash
curl -X POST "https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo/consulta-nome" \
  -H "Content-Type: application/json" \
  -d '{"nomes": ["Pot\u00eancia (kW)", "Produto para crian\u00e7as?"], "data": "2025-04-03T00:00:00.000Z"}' \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}"
```

### Resposta

*Erro: 401 Client Error: Unauthorized for url: https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo/consulta-nome*

## 5. Download do arquivo de atributos por NCM

### Requisição

```bash
curl -X GET "https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo-ncm/download/json?codigosNCM=['02011000', '84099190']" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-CSRF-Token: ${CSRF_TOKEN}"
```

### Resposta

*Erro: 401 Client Error: Unauthorized for url: https://val.portalunico.siscomex.gov.br/cadatributos/api/ext/atributo-ncm/download/json?codigosNCM=02011000&codigosNCM=84099190*

## Análise dos Resultados

### Estrutura dos Dados Recebidos

*Preencha esta seção após revisar as respostas*

### Observações

*Preencha esta seção com suas observações sobre os resultados*

### Próximos Passos

1. Definir modelo de dados para nossa implementação
2. Implementar cache para reduzir chamadas à API
3. Desenvolver validações específicas para nosso uso caso
