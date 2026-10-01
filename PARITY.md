# Comparação funcional

Base: Coucou **Windows**, commit `835421c7fff260f0f0be48927591b96bfad81cad`. O projeto original também possui uma edição macOS com diferenças próprias; os limites dela não devem ser confundidos com os do Windows.

| Função do Windows original | Orbit 0.4 |
| --- | --- |
| Ilha horizontal no topo, ocultação, compacto, expansão | Restaurado, mesma geometria 288×32 / 640×160; chat cresce até 300 px |
| Personagem reativo, olhar, clique, hover, saudação | Satélite próprio, estados, reações e saudação próprios |
| Sons de ações e estados, volume/mudo | Sons sintetizados próprios |
| Conversa com IA, continuação, busca via agente | Codex local, streaming, continuação e ferramentas configuradas no Codex |
| Progresso e passos da sessão | Eventos e ferramentas reais; sessões IDE separadas do chat Orbit |
| Allow/Deny | Pedidos app-server e hook PermissionRequest autenticado; detalhes completos e expiração |
| Arrastar arquivo, escolha de ação, chat sobre arquivo | Restaurado; imagem, texto/código e PDF renderizado localmente |
| Resend, n8n, Vercel, GitHub, Notion, Cal.com, Stripe | Todos os sete adaptadores e cartões presentes; consultas somente leitura |
| Bandeja, pausa, monitor, autostart, prévia/backup de hooks | Restaurado no host Electron |
| Código aberto e crédito | MIT e atribuição de Louis Raillé preservados |

O Windows original não implementa envio de arquivo por email nem calendário Cal.com em três níveis (usa lista de reservas). Esses itens não são apresentados como funções implementadas pelo Orbit. O chat Codex não usa a chave Anthropic: utiliza o login gerenciado da sua instalação local.

Verificação distingue testes locais, resposta autenticada e serviços reais. Consulte VALIDATION.md. Screenshots de referência: https://github.com/Louis-CFM/coucou/tree/main/windows/screenshots .
