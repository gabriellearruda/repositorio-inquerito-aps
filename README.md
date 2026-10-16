# Documentação processo do Inquérito APS por WhatsApp - Vital Strategies

Esse projeto é a documentação metodológica do inquérito de avaliação de acesso e qualidade da Atenção Primária à Saúde (APS) em Recife, conduzido pelo programa **Mais Dados Mais Saúde (MDMS)** via WhatsApp. O código foi feito feito com o Claude, porém desenhado, revisado e testado por uma engenheira de software.

A aplicação é intencionalmente simples dado que sua única função é servir de documentação para a equipe interna da Vital de inquérito. A arquitetura foi desenhada em duas camadas: uma área administrativa, onde a equipe da Vital sobe os conteúdos progressivamente, e uma versão pública a ser liberada quando toda a documentação estiver completa — exceto a seção de aprendizados, que deve permanecer restrita. Por esse motivo, **este repositório não deve ser tornado público**: a seção de aprendizados pode conter anotações sensíveis sobre o projeto.

A autenticação via variável de ambiente foi escolhida para manter a solução simples e sem dependências externas — dado o volume e a natureza do acesso (documentação interna de equipe), não havia necessidade de criar um bucket de armazenamento ou sistema de autenticação mais robusto. Esses pontos ficam registrados como melhorias a considerar caso o projeto cresça em escopo ou audiência. Há a pendência de quando a equipe terminar de subir seus conteúdos atualizar a versão pública para mostrar o conteúdo com exceção da parte de notas.

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
├── vercel.json             → Configuração da API no Vercel
├── Dockerfile              → Ambiente local (site + API)
└── .env.example            → Variáveis de ambiente necessárias
```

## Deploy

O site estático é servido pelo **GitHub Pages** com deploy automático via
GitHub Actions a cada push na branch `main` (~60 segundos).

A API (`/api/save`) roda no **Vercel** (função serverless). O login do painel
é validado pela própria API (`{ping: true}`), então a senha nunca vai para o
HTML. Por isso o painel só funciona onde a API está disponível (Vercel ou Docker).

## Variáveis de ambiente

### Vercel (API)

Configure em **Settings → Environment Variables**:

| Variável | Descrição |
|---|---|
| `SENHADOPAINEL` | Senha de acesso ao guia e ao gerenciador de conteúdo |
| `GITHUB_TOKEN` | Token do GitHub com permissão `contents:write` |
| `GITHUB_OWNER` | Usuário ou organização dona do repositório |
| `GITHUB_REPO` | Nome do repositório |
| `GITHUB_BRANCH` | Branch (opcional, padrão `main`) |

Use um token fine-grained, só para o repositorio e só com Contents: Read and write;

### Local (Docker)

Copie `.env.example` para `.env` e preencha:

```env
# Senha de acesso ao guia /vital e ao gerenciador de conteúdo
SENHADOPAINEL=suasenha

# Token do GitHub com permissão contents:write
# Gerar em: GitHub → Settings → Developer settings → Personal access tokens
GITHUB_TOKEN=ghp_...

# Usuário ou organização dona do repositório
GITHUB_OWNER=seu-usuario

# Nome exato do repositório no GitHub
GITHUB_REPO=nome-do-repositorio

# Branch onde o gerenciador lê e grava (opcional, padrão main)
GITHUB_BRANCH=main
```

## Rodando localmente com Docker

```bash
cp .env.example .env
# edite .env com os valores reais

docker build -t vital .
docker run --env-file .env -p 3000:3000 vital
```

- Site: http://localhost:3000/vital
- API: http://localhost:3000/api/save

## Gerenciador de conteúdo

O guia em `/vital` inclui um gerenciador embutido no menu lateral (seção **Administração**). Permite editar, adicionar, renomear, reordenar e excluir seções sem tocar no código.

**Para editar conteúdo:**
1. Acesse `/vital` e faça login com a senha
2. Clique em **Gerenciar conteúdo** no menu lateral
3. Selecione a seção no dropdown, edite e clique em **Salvar**

**Para gerenciar estrutura:**
1. Clique em **Gerenciar seções** no menu lateral
2. Arraste para reordenar, clique no nome para renomear, 🗑 para excluir
3. Use o formulário no final para adicionar nova etapa ou subetapa
4. Clique em **Publicar alterações** — a página recarrega em ~25s

O token do GitHub nunca vai ao browser. A autenticação é feita no servidor com rate limiting de 5 tentativas por 15 minutos.
