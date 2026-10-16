# Inquérito APS por WhatsApp — Guia de Replicação

Documentação metodológica do inquérito de avaliação de acesso e qualidade
da Atenção Primária à Saúde (APS) em Recife, conduzido pelo programa
**Mais Dados Mais Saúde (MDMS)** via WhatsApp.

Este repositório entrega o projeto já codado e pronto para uso. O código foi
revisado e testado no ambiente Vercel por uma engenheira de software.

A aplicação é intencionalmente simples — sua única função é servir de
documentação. A arquitetura foi desenhada em duas camadas: uma área
administrativa, onde a equipe da Vaito sobe os conteúdos progressivamente,
e uma versão pública a ser liberada quando toda a documentação estiver
completa — exceto a seção de notas, que permanece restrita. Por esse motivo,
**este repositório não deve ser tornado público**: a seção de notas pode
conter anotações sensíveis sobre o projeto, parceiros e decisões internas,
destinadas apenas às equipes da Vaito.

A autenticação via variável de ambiente foi escolhida para manter a solução
simples e sem dependências externas — dado o volume e a natureza do acesso
(documentação interna de equipe), não havia necessidade de criar um bucket
ou sistema de autenticação mais robusto. Esses pontos ficam registrados como
melhorias a considerar caso o projeto cresça em escopo ou audiência.

---

## Estrutura do repositório

```
/
├── vital/
│   └── index.html          → Guia completo (protegido por senha)
├── api/
│   └── save.js             → Função serverless (Vercel) — gerenciador de conteúdo
├── arquivos/               → Documentos e scripts de referência
├── docs/                   → PDFs complementares
├── build.js                → Injeta SENHADOPAINEL no HTML antes do deploy
├── vercel.json             → Configuração da API no Vercel
├── Dockerfile              → Ambiente local (site + API)
└── .env.example            → Variáveis de ambiente necessárias
```

## Deploy

O site estático é servido pelo **GitHub Pages** com deploy automático via
GitHub Actions a cada push na branch `main` (~60 segundos).

A API (`/api/save`) roda no **Vercel** (função serverless), separada do
site estático. O script `build.js` substitui o placeholder
`__SENHADOPAINEL__` pela senha real antes do deploy, sem nunca commitá-la.

## Variáveis de ambiente

### Vercel (API)

Configure em **Settings → Environment Variables**:

| Variável | Descrição |
|---|---|
| `SENHADOPAINEL` | Senha de acesso ao guia e ao gerenciador de conteúdo |
| `GITHUB_TOKEN` | Token do GitHub com permissão `contents:write` |
| `GITHUB_OWNER` | Dono do repositório (ex: `gabriellearruda`) |
| `GITHUB_REPO` | Nome do repositório |

### Local (Docker)

Copie `.env.example` para `.env` e preencha:

```env
SENHADOPAINEL=suasenha
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=gabriellearruda
GITHUB_REPO=repositorio-inquerito-aps
```

## Rodando localmente com Docker

```bash
cp .env.example .env
# edite .env com os valores reais

docker build -t vital .
docker run --env-file .env -p 3000:3000 -p 3001:3001 vital
```

- Site: http://localhost:3000/vital
- API: http://localhost:3001

## Gerenciador de conteúdo

O guia em `/vital` inclui um gerenciador embutido no menu lateral
(seção **Administração**). Permite editar, adicionar, renomear,
reordenar e excluir seções sem tocar no código.

**Para editar conteúdo:**
1. Acesse `/vital` e faça login com a senha
2. Clique em **Gerenciar conteúdo** no menu lateral
3. Selecione a seção no dropdown, edite e clique em **Salvar**

**Para gerenciar estrutura:**
1. Clique em **Gerenciar seções** no menu lateral
2. Arraste para reordenar, clique no nome para renomear, 🗑 para excluir
3. Use o formulário no final para adicionar nova etapa ou subetapa
4. Clique em **Publicar alterações** — a página recarrega em ~25s

O token do GitHub nunca vai ao browser. A autenticação é feita no
servidor com rate limiting de 5 tentativas por 15 minutos.
