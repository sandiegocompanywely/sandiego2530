## Plano: Ativar Lovable Cloud + Painel Admin de Estampas

### Objetivo
Ativar o backend Lovable Cloud e migrar as estampas de um array estático no código para um banco de dados + storage, permitindo upload e gerenciamento via painel admin sem precisar editar código.

### Passo 1 — Ativar Lovable Cloud
- Provisionar o projeto de backend vinculado ao app.
- Isso habilita banco PostgreSQL, storage de arquivos e server functions.

### Passo 2 — Banco de Dados
Criar a tabela `prints` com as colunas:
- `id` (uuid, PK)
- `name` (texto, nome da estampa)
- `image_url` (texto, URL pública no storage)
- `created_at` (timestamp)

Inserir as 4 estampas existentes (`dtf-137-berry`, `dtf-149-coracao-rachado`, `dtf-147-onca-feline`, `dtf-135-athletic`) como registros iniciais. As imagens atuais em `src/assets/prints/` serão enviadas ao storage e linkadas na tabela.

### Passo 3 — Storage de Imagens
- Configurar um bucket `prints` no storage para armazenar as imagens de estampa.
- As imagens serão acessíveis por URL pública para o frontend consumir.

### Passo 4 — Server Functions (Backend)
Criar funções seguras para:
- `listPrints` — listar todas as estampas do banco.
- `createPrint` — receber nome e arquivo, fazer upload para o storage e salvar o registro no banco.
- `deletePrint` — remover uma estampa do banco e do storage.

### Passo 5 — Painel Admin
Criar uma rota `/admin` com interface simples para:
- Visualizar todas as estampas cadastradas.
- Fazer upload de novas estampas (arrastar ou selecionar arquivo, digitar nome).
- Excluir estampas existentes.

### Passo 6 — Integrar Frontend
Atualizar a página principal (`/`) para:
- Buscar as estampas do backend via `listPrints` em vez do array `PRINTS` estático.
- As 4 estampas atuais continuarão aparecendo normalmente após a migração dos dados.
- O preview da camiseta usará as URLs do storage.

### Resultado Esperado
- App funciona exatamente igual para o visitante final.
- Você pode acessar `/admin` para adicionar ou remover estampas sozinho, sem depender do chat ou de editar código.
- Novas estampas aparecem automaticamente no carrossel de seleção.