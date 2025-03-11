# MessageGroup

O componente MessageGroup é responsável por agrupar e exibir mensagens relacionadas na interface de chat. Ele suporta diferentes tipos de mensagens e fornece uma interface consistente para visualização.

## Tipos de Mensagens

O componente suporta os seguintes tipos de grupos:

- `thinking`: Mensagens de pensamento/raciocínio do modelo
- `progress`: Mensagens de progresso e ações em andamento
- `answer`: Respostas finais do modelo
- `error`: Mensagens de erro
- `system`: Mensagens do sistema
- `user`: Mensagens do usuário
- `mixed`: Outros tipos de mensagens

## Props

| Prop            | Tipo                 | Descrição                               |
| --------------- | -------------------- | --------------------------------------- |
| messages        | `ChatMessageProps[]` | Array de mensagens a serem exibidas     |
| groupType       | `MessageGroupType`   | Tipo do grupo de mensagens              |
| title           | `string?`            | Título opcional do grupo                |
| isCollapsible   | `boolean?`           | Se o grupo pode ser expandido/colapsado |
| initialExpanded | `boolean?`           | Estado inicial de expansão              |
| modelName       | `string?`            | Nome do modelo que gerou as mensagens   |

## Estilos

Cada tipo de grupo tem seu próprio estilo visual:

- Mensagens do usuário: Fundo claro com borda de destaque
- Pensamentos: Borda informativa
- Progresso: Borda primária
- Respostas: Borda de sucesso
- Erros: Borda de erro
- Sistema: Borda secundária

## Exemplo de Uso

```tsx
import MessageGroup from './MessageGroup';

// Exemplo de grupo de mensagens do usuário
<MessageGroup
  messages={[
    {
      type: 'query',
      content: 'Como posso ajudar?',
      isTyping: false
    }
  ]}
  groupType="user"
  title="Sua Pergunta"
  isCollapsible={true}
/>

// Exemplo de grupo de respostas
<MessageGroup
  messages={[
    {
      type: 'answer',
      content: 'Aqui está a resposta...',
      isTyping: false,
      data: {
        answer: 'Resposta detalhada'
      }
    }
  ]}
  groupType="answer"
  title="Resposta"
  modelName="GPT-4"
/>
```

## Testes

O componente inclui testes para:

- Agrupamento correto de mensagens por tipo
- Renderização adequada de estilos
- Funcionalidade de expandir/colapsar
- Exibição do contador de mensagens

## Notas de Desenvolvimento

- Use o componente dentro do ChatPage para organizar mensagens relacionadas
- Mantenha a consistência visual usando as variáveis CSS definidas
- Adicione data-testid aos elementos para facilitar os testes
