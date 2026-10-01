# Orbit for Codex

Adaptação independente de **[Coucou, de Louis Raillé](https://github.com/Louis-CFM/coucou)** para Codex no Windows. A versão 0.4 restaura a ilha horizontal do original: recolhida no topo, expansível, com personagem, chat, progresso, aprovações e integrações. Orbit tem nome, satélite, ícone e sons próprios; não é um produto oficial da OpenAI ou do autor do Coucou.

## Usar

- Mova o ponteiro ao centro do topo da tela e clique na ilha para abrir.
- A aba de conversa permite enviar mensagens ao Codex com seu login local. Preferências permite escolher o projeto e o modelo disponível na sua instalação.
- Anexe ou arraste imagens, texto/código e PDF. Preparar um arquivo não envia nada: o envio ocorre junto da mensagem. PDFs são convertidos localmente em texto e imagens de páginas.
- As sessões do VS Code aparecem como tarefas separadas. Instale os hooks em Preferências, revise a prévia e depois use `/hooks` no Codex para conceder confiança. Não há bypass no produto.
- Pedidos reais de permissão exibem detalhes e botões Allow/Deny. O chat usa o app-server; o VS Code usa o hook autenticado. Fechamento, timeout ou falta de cartão visível nunca autorizam automaticamente.
- Integrações opcionais: Resend, n8n, Vercel, GitHub, Notion, Cal.com e Stripe. Configure suas próprias credenciais; as consultas são somente leitura. Até quatro integrações ocupam as pílulas, como no Windows original.
- Esc recolhe; a bandeja oferece abrir, preferências, pausar e sair. Sons, volume, monitor e inicialização com Windows são configuráveis.

Instale o Codex CLI ou a extensão Codex do VS Code e autentique-se pelo próprio Codex. Node.js 22+ é necessário para os hooks. Para iniciar pelo código:

```powershell
npm ci
npm run dev
```

O app aparece no topo, sem uma janela convencional de conversa. Preferências abre uma janela auxiliar, como no original.

## Dados e limites

Conversas e anexos enviados são processados pelo provedor configurado no Codex. Seu login permanece gerenciado pelo Codex; o Orbit não exporta tokens para a interface. O histórico persistente de threads pertence ao Codex. A interface mantém sua conversa atual em memória.

Hooks comuns transmitem somente metadados. PermissionRequest transmite os detalhes completos da ação pelo canal local autenticado, em memória, para decisão informada. Pedidos grandes demais para o canal voltam para a aprovação normal do Codex; nunca são truncados para autorizar.

Credenciais das integrações são criptografadas localmente com Windows DPAPI. Nenhuma telemetria é adicionada. Dados do aplicativo ficam em `%LOCALAPPDATA%\OrbitForCodex`; a instalação preserva hooks de terceiros e faz backup. Consulte [PRIVACY.md](PRIVACY.md).

Limites dos anexos: 10 MB por arquivo, 30 MB de arquivos preparados, 512 KB de texto, PDF de até 20 páginas/500 mil caracteres. Documentos protegidos precisam ser desbloqueados pelo usuário. Estes limites aparecem como erro explícito; conteúdo não é silenciosamente descartado.

## Verificação e distribuição

```powershell
npm test
npm run build
npm run test:chat
npm run test:codex
npm run test:desktop
npm run pack
npm run pack:store
npm run check:release
```

Os testes automatizados usam dados isolados e provedor loopback. A validação do login real é descrita separadamente em [VALIDATION.md](VALIDATION.md). Compare funções e design em [PARITY.md](PARITY.md).

O EXE portátil e o MSIX são gerados em `release/`. A política corporativa de reputação/idade do Defender pode bloquear o executável não assinado; executar como administrador não altera essa regra. A assinatura pública do pacote Store depende da Microsoft. O MSIX local não é um pacote já certificado.

A identidade da reserva Store é `ThoRossetto.OrbitforCodex`, conforme atribuída pelo Partner Center, produto `9P39BQKN6F41`. O manifesto Windows 11 x64 usa `runFullTrust` e a exclusão de virtualização limitada a `%LOCALAPPDATA%\OrbitForCodex` para comunicar com Node/Codex fora do pacote. O pacote 0.4.1.0 foi reenviado à Store em 01/10/2026 com a listagem e a classificação etária concluídas. O Partner Center confirma “In certification”, com pré-processamento em andamento. A publicação está configurada para começar automaticamente após aprovação; aprovação e publicação ainda estão pendentes. Consulte VALIDATION.md para os resultados do kit de certificação e as limitações de teste instalado.

## Créditos

**Coucou e código original:** Louis Raillé — [Louis-CFM/coucou](https://github.com/Louis-CFM/coucou), sob MIT. **Adaptação Codex/Electron e identidade Orbit:** TheoRossetto. Licença e copyright originais preservados em [LICENSE](LICENSE); proveniência detalhada em [NOTICE.md](NOTICE.md).

Os nomes Coucou/Mochi, personagem, ícones e sons originais não são redistribuídos. A [licença de assets do Coucou](https://github.com/Louis-CFM/coucou/blob/main/LICENSE-ASSETS.md) exige identidade própria para distribuir uma adaptação.
