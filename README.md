# Primórdios


Ficha de RPG e editor de mapas em HTML/CSS/JavaScript, com backend em Node.js e TypeScript. A entrada usa Google pelo Supabase Auth, com escolha obrigatória de nome público antes de acessar o site. Salas e fichas têm persistência PostgreSQL. As fichas possuem salvamento online, revisão e importação seletiva do navegador; o editor preserva mapas locais e permite publicar uma cópia em sessões compartilhadas.

## Desenvolvimento

Requer Node.js 24 e npm.

```sh
npm install
npm run dev
```

Abra o endereço impresso no terminal. O padrão é `http://127.0.0.1:3000`; se a porta estiver ocupada, o servidor tenta até a 3009. Ele entrega o frontend e a API somente em localhost, sem exposição à LAN. Se você definir `PORT`, essa porta será respeitada, com uma mensagem clara caso esteja ocupada.

Para escolher outra porta no PowerShell:

```powershell
$env:PORT=3001
npm run dev
```

Encerre com Ctrl+C. Para voltar à seleção automática: `Remove-Item Env:PORT`.

```sh
npm run typecheck
npm test
npm run build
npm run test:livro
npm run test:auth
npm run test:characters
npm run test:preferences
npm run test:sessions
```

`npm test` compila o TypeScript e executa testes de API, permissões, senha, lotação concorrente e transações. As verificações existentes do navegador continuam em `scripts/verificar-tabletop.cjs`.

`npm run test:auth` usa Chrome sem janela, o SDK real e um Auth simulado para testar Google/OAuth simulado, PKCE, escolha de nome, bloqueio de perfil incompleto, alteração de nome, logout e preservação de fichas. Não lê `.env`, cria contas reais ou envia e-mails. Requer Chrome instalado; `CHROME_PATH` permite informar outro caminho.

Com o `.env` configurado, `npm run check:supabase` testa a conexão real ao banco sem gravar dados nem mostrar credenciais. A CA pública do Supabase acompanha o backend para validar TLS; `SUPABASE_DB_CA` permite substituí-la se necessário.

`npm run test:preferences` verifica os textos de login/perfil/importação em inglês, espanhol e português, incluindo contagens e placeholders sem traduzir nomes de personagens. O teste `node scripts/verificar-tabletop.cjs --audio-continuity` verifica retomada da música entre telas, pausa/ativação e troca de faixa. O servidor local oferece HTTP byte ranges para permitir busca na faixa; o player preserva faixa/posição enquanto aguarda metadados e seek. A navegação continua trocando de documento, portanto pode existir uma breve interrupção, mas a faixa deve retomar do ponto salvo.

## Fichas online

Reinicie `npm run dev` após atualizar. O inventário carrega as fichas da conta Google no servidor. Na ficha, o indicador confirma o salvamento online. O botão **Importar fichas deste navegador** copia apenas as fichas selecionadas, preservando os originais e evitando duplicatas. Cada conta acessa somente as próprias fichas.


## O que existe nesta etapa

- API HTTP e regras de salas, participantes, dono e moderadores.
- Código aleatório com seis dígitos, preservando zeros iniciais.
- Salas públicas/privadas; senha privada de 1 a 10 caracteres, com salt e hash scrypt.
- Limite de 1 a 50 pessoas incluindo o dono, validado atomicamente nas entradas.
- Alteração de nome/cor, promoção/rebaixamento, expulsão e banimento por identidade.
- Armazenamento e identidades **descartáveis em memória**, somente para desenvolvimento sem configuração.
- Verificação de tokens reais pelo Supabase Auth, armazenamento transacional PostgreSQL e limite de tentativas compartilhado quando configurado.
- Fichas privadas por dono, importação idempotente, autosave com rascunho pendente, revisão otimista e exclusão do conteúdo com túmulo mínimo temporário.
- Entrada Vercel em `api/[...path].ts`, sem fallback de memória. Sem configuração, operações continuam bloqueadas.


O frontend obtém apenas URL e publishable key por `GET /api/auth/config`. O SDK é empacotado localmente em `scripts/auth-online.js` pelo esbuild durante `npm run dev`/`npm run build`, sem CDN. Credenciais do PostgreSQL nunca entram nesse bundle. É necessário reiniciar o servidor antigo para carregar a rota nova.


## Conectar o backend ao Supabase


Copie `.env.example` para `.env` e preencha `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_DB_URL`. `npm run dev` lê esse arquivo automaticamente. Use no banco a role restrita, conexão TLS com certificado validado e o pooler, não a conta administrativa. A senha dessa role deve ser definida no painel do Supabase e permanecer fora do repositório e do chat.

`/api/health` informa `mode: "supabase"` quando a configuração está carregada. Esse endpoint indica configuração, não testa a disponibilidade do banco. Credenciais parciais interrompem a inicialização, em vez de voltar silenciosamente para memória. Quando conectado, `/api/dev/identities` deixa de existir; `/api/me` e as operações de salas exigem `Authorization: Bearer TOKEN_DO_SUPABASE`.

## Experimentar a API local

Use um cliente HTTP para enviar `POST /api/dev/identities`, com `Content-Type: application/json` e corpo:

```json
{ "name": "Mestre de teste" }
```

A resposta fornece uma identidade descartável e um token válido por oito horas. Nas próximas requisições, envie `Authorization: Bearer SEU_TOKEN_LOCAL`. Não é uma conta real, e esse endpoint não existe na implantação Vercel.

Para criar uma sala, envie `POST /api/rooms`:

```json
{ "visibility": "private", "maxPlayers": 6, "password": "mesa123" }
```

| Método | Caminho | Ação |
|---|---|---|
| GET | `/api/health` | Disponibilidade e estado de configuração |
| GET | `/api/auth/config` | URL e publishable key para o cliente Auth; sem segredos |
| GET | `/api/me` | Identidade autenticada |
| GET | `/api/characters` | Listar resumos das próprias fichas |
| POST | `/api/characters` | Criar/importar ficha; UUID de mutação |
| GET | `/api/characters/ID` | Abrir documento completo da própria ficha |
| PUT | `/api/characters/ID` | Salvar com revisão esperada e UUID de mutação |
| DELETE | `/api/characters/ID` | Excluir com revisão esperada |
| GET | `/api/characters/ID/portrait` | Carregar retrato com autenticação |
| GET | `/api/rooms` | Listar salas públicas |
| POST | `/api/rooms` | Criar sala |
| GET | `/api/rooms/123456/lookup` | Localizar sala pelo código, sem expor participantes ou senha |
| GET | `/api/rooms/123456` | Consultar sala da qual participa |
| GET | `/api/rooms/123456/tabletop` | Estado autorizado da mesa; aceita `?since=VERSÃO` |
| POST | `/api/rooms/123456/tabletop` | Aplicar operações idempotentes autorizadas |
| POST | `/api/rooms/123456/join` | Entrar; corpo com senha nas privadas |
| PATCH | `/api/rooms/123456` | Alterar visibilidade, senha ou limite |
| PATCH | `/api/rooms/123456/members/ID` | Alterar nome/cor ou papel permitido |
| POST | `/api/rooms/123456/members/ID/kick` | Expulsar; corpo `{}` |
| POST | `/api/rooms/123456/members/ID/ban` | Banir; corpo `{}` |
| POST | `/api/rooms/123456/leave` | Sair explicitamente; corpo `{}` |

As respostas não incluem hashes de senha, lista de banidos nem credenciais. Erros têm código, mensagem e identificador de requisição. O limite de JSON das salas é 16 KiB; fichas têm limite separado de 1 MiB por requisição e validação de tamanho do documento. O documento do TableTop aceita até 3 MiB; arquivos usam upload separado para o Storage privado (até 50 MiB cada).

Decisões atuais: privadas aparecem somente por código; só o dono promove/rebaixa moderadores; moderadores administram jogadores/configurações, mas não alteram nem expulsam o dono. Sair explicitamente como dono encerra a sala. Desconexão temporária preserva a participação e a reconexão recupera a sessão. Não há transferência automática de propriedade.

## Estrutura e próxima etapa

```text
api/                     Entrada HTTP para Vercel
backend/domain/          Modelos, validação e regras de negócio
backend/security/        Hash de senha e limite local de tentativas
backend/adapters/        Memória, verificação Supabase e persistência PostgreSQL
backend/http/            Rotas e respostas HTTP
backend/tests/           Testes automatizados
pages/, scripts/, styles/, assets/   Frontend existente
```

O domínio depende de interfaces assíncronas de armazenamento. O adaptador PostgreSQL implementa transações reais, rollback e um advisory lock transacional compartilhado entre instâncias. Operações de uma sala usam lock por código; criação e listagem usam uma chave global. Consultas paginadas continuam sendo uma melhoria para volumes maiores. O limite de tentativas usa contadores atômicos no banco, fora da transação da sala, para contar também entradas recusadas.


Na Vercel, sem configuração, a API responde `503 BACKEND_NOT_CONFIGURED` para operações de dados. Não há fallback silencioso para memória em produção. Nenhum deploy é executado pelos comandos de desenvolvimento/build.








## Publicar na Vercel

Conecte o repositório Git ao projeto Vercel. A configuração usa `npm run build`, saída `dist` e funções em `api/`. Pushes na branch de produção disparam um novo deploy; outras branches podem gerar previews. O site muda após o build/deploy concluir com sucesso.

Nas configurações de Environment Variables do projeto, cadastre os valores do ambiente correspondente:

- `SUPABASE_URL`: URL HTTPS do projeto.
- `SUPABASE_PUBLISHABLE_KEY`: chave pública do cliente.
- `SUPABASE_DB_URL`: conexão PostgreSQL com a role restrita `primordios_backend`, exclusiva do servidor.

O `.env` local não é enviado pelo Git. O `.env.example` é apenas um modelo. Alterar variáveis na Vercel exige um novo deploy para aplicá-las. Evite usar o banco de produção em previews com alterações de dados/esquema.

Configure o domínio HTTPS publicado nos retornos autorizados do Supabase e nas origens do cliente Google. Depois valide login, salvamento das fichas e uma sessão com duas contas reais, incluindo uploads e reconexão. `/api/health` confirma o modo configurado; não substitui uma consulta autenticada ao banco.

As migrações SQL estão em `supabase/migrations/` e devem ser aplicadas em ordem em projetos novos. Um push de código não aplica essas migrações no banco automaticamente.
