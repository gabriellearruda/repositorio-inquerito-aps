# Inquérito APS por WhatsApp — Guia de Replicação

Documentação metodológica do inquérito de avaliação de acesso e qualidade da Atenção Primária à Saúde (APS) em Recife, conduzido pelo programa **Mais Dados Mais Saúde (MDMS)** via WhatsApp.

---

## Estrutura do repositório

```
/
├── index.html              → Página "em breve" (domínio raiz)
├── vital/
│   └── index.html          → Guia completo (protegido por senha)
├── api/
│   └── save.js             → Função serverless para o gerenciador de conteúdo
├── docs/
│   └── Roteiro_grupo_focal_MDMS_WPP.pdf
├── arquivos/               → Documentos e scripts de referência
├── build.js                → Script de build (injeta senha na variável SENHADOPAINEL)
├── vercel.json             → Configuração do Vercel
└── package.json
```

## Deploy

O site é servido pelo **Vercel** com build automático a cada push na branch `main`.

O script `build.js` substitui o placeholder `__SENHADOPAINEL__` pela senha real (variável de ambiente `SENHADOPAINEL`) antes do deploy, sem nunca commitá-la no repositório.

## Variáveis de ambiente (Vercel)

Configure em **Settings → Environment Variables**:

| Variável | Descrição |
|---|---|
| `SENHADOPAINEL` | Senha de acesso ao guia em `/vital` |
| `ADMIN_PASSWORD` | Senha de acesso ao gerenciador de conteúdo |
| `GITHUB_TOKEN` | Token do GitHub com permissão `contents:write` |

## Gerenciador de conteúdo

O guia em `/vital` inclui um gerenciador de conteúdo embutido no menu lateral. Para usar:

1. Acesse `/vital` e faça login com `SENHADOPAINEL`
2. Clique em **Gerenciar conteúdo** no menu lateral
3. Insira a senha `ADMIN_PASSWORD`
4. Edite os campos de texto e clique em **Salvar no GitHub**
5. O Vercel detecta o commit e faz redeploy em ~30 segundos

O gerenciador usa uma função serverless (`/api/save`): o token do GitHub nunca vai ao browser, a autenticação é feita no servidor com rate limiting de 5 tentativas por 15 minutos.

## LGPD — Aviso de segurança

> **`07_lista_reserva.csv` e quaisquer arquivos com dados pessoais (telefones, CPFs, endereços) NUNCA devem ser commitados neste repositório público.** Manter esses arquivos localmente ou em ambiente controlado com acesso restrito.

---

*Mais Dados Mais Saúde · Recife · 2025*
