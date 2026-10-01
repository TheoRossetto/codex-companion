# Política de privacidade — Orbit for Codex

Última atualização: 1 de outubro de 2026.

Orbit for Codex é uma adaptação independente mantida por TheoRossetto. O aplicativo não adiciona telemetria, anúncios ou rastreamento.

## Conversas e anexos

Ao enviar uma mensagem, seu conteúdo e os anexos selecionados são entregues à instalação local do Codex, que utiliza o provedor e a conta configurados por você. Aplicam-se as políticas desse provedor. Arquivos preparados não são enviados antes de você enviar a mensagem. PDFs são convertidos localmente em texto e imagens. Threads e histórico podem ser armazenados pelo próprio Codex em seu diretório de dados.

## Atividade e permissões

Hooks comuns enviam ao Orbit identificador de sessão, nome do projeto, evento e ferramenta pelo canal local. Solicitações de permissão incluem detalhes da ação para que você possa autorizar ou negar conscientemente. Esses eventos ficam na memória do aplicativo; não são enviados a um servidor do Orbit. Sem resposta válida, a autorização continua no Codex.

## Integrações opcionais

Quando você configura e ativa uma integração, o Orbit consulta o respectivo serviço (Resend, n8n, Vercel, GitHub, Notion, Cal.com ou Stripe) para mostrar seus dados de status. Não envia emails, cria pagamentos ou implanta projetos por essas consultas. Credenciais são criptografadas no armazenamento local com a proteção do Windows; a interface só recebe indicação de presença, não o valor salvo.

## Armazenamento e controle

Preferências, anexos temporários, credenciais criptografadas e chave do canal local ficam em %LOCALAPPDATA%\OrbitForCodex. Anexos da sessão são removidos ao iniciar nova conversa ou encerrar normalmente; um encerramento abrupto pode deixar dados temporários até a próxima limpeza. Backups e hooks do Codex são mantidos nos diretórios correspondentes. A desinstalação do MSIX pode preservar a pasta compartilhada e os backups.

Você pode desativar integrações, remover credenciais, pausar o acompanhamento e desinstalar os hooks pelas preferências. Remover hooks não apaga o histórico de conversas do Codex. Para excluir esse histórico, utilize os controles do Codex. Não compartilhe chaves ao reportar problemas.

Contato: issues do repositório https://github.com/TheoRossetto/codex-companion. Para dúvidas privadas, solicite um canal de contato sem publicar dados pessoais.
