# BarberPro — Sistema de Gestão para Barbearias

> Sistema white-label completo para barbearias: agendamentos, pagamentos Square, controle de clientes, estoque e financeiro. Pronto para instalar para qualquer cliente em minutos.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🗓 **Agendamentos** | Calendário visual por profissional com checkout integrado |
| 💳 **Pagamentos** | Dinheiro, Interac, Square Reader BT (iPad/Android), Square Terminal |
| 👤 **Clientes** | Cadastro completo com histórico de atendimentos |
| ✂️ **Profissionais** | Gestão de barbeiros, funções e comissões |
| 📦 **Estoque** | Controle de produtos com venda no checkout |
| 💰 **Financeiro** | Transações, despesas e relatórios |
| ⚙️ **Configurações** | Branding, Square IDs, dados da rede |
| 🌐 **Site Público** | Página de agendamento online para clientes |
| 🏪 **Multi-Unidades** | Suporte a redes com filiais |
| 🔐 **Licença** | Trial de 30 dias + ativação PRO |

---

## 🚀 Instalação para um novo cliente

### Pré-requisitos

- Node.js 18+
- Conta no [Firebase](https://firebase.google.com) (gratuita)
- Conta no [Netlify](https://netlify.com) (gratuita)
- Conta no [Square Developer Portal](https://developer.squareup.com) *(apenas se usar pagamentos Square)*

---

### Passo 1 — Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Escolha um nome (ex: `barbearia-joao`)
4. Ative o **Firestore Database** (modo produção)
5. Ative o **Authentication** → habilite **Google**
6. Vá em **Configurações do Projeto** → **Seus Apps** → clique em `</>` para adicionar app Web
7. Copie as credenciais (apiKey, authDomain, etc.)

---

### Passo 2 — Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local
```

Edite o `.env.local` com as credenciais do Firebase e **seus dados de desenvolvedor**:

```env
# Firebase
VITE_FB_API_KEY=AIzaSy...
VITE_FB_AUTH_DOMAIN=barbearia-joao.firebaseapp.com
VITE_FB_PROJECT_ID=barbearia-joao
VITE_FB_STORAGE_BUCKET=barbearia-joao.firebasestorage.app
VITE_FB_MESSAGING_SENDER_ID=000000000000
VITE_FB_APP_ID=1:000000000000:web:xxxx
VITE_FB_FIRESTORE_DB_ID=(default)
VITE_SQUARE_ENV=production

# Desenvolvedor (VOCÊ — que vende e mantém o sistema)
VITE_DEVELOPER_EMAIL=seu-email@gmail.com
VITE_DEVELOPER_WHATSAPP=5511999999999
```

> ⚠️ **IMPORTANTE:** `VITE_DEVELOPER_EMAIL` é o **seu** e-mail (do desenvolvedor). Ele lhe dá acesso master a todos os sistemas que você instalar.

---

### Passo 3 — Configurar Regras do Firestore

No Firebase Console → Firestore → **Regras**, cole o conteúdo do arquivo `firestore.rules`.

---

### Passo 4 — Instalar e Testar Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Na **primeira** visita, o sistema exibirá um **wizard de configuração** para o cliente preencher o nome da barbearia, slogan e contato.

Após o setup, o cliente fará login Google e terá **30 dias de trial gratuito**.

---

### Passo 5 — Deploy no Netlify

1. Crie uma conta em [netlify.com](https://netlify.com)
2. Clique em **"Add new site"** → conecte ao GitHub ou arraste a pasta `dist/`
3. Em **Site Configuration → Environment Variables**, adicione:
   - Todas as variáveis `VITE_FB_*` 
   - `VITE_DEVELOPER_EMAIL` e `VITE_DEVELOPER_WHATSAPP`
   - `SQUARE_ACCESS_TOKEN` = Token de Produção do Square *(se aplicável)*
   - `VITE_SQUARE_ENV=production`
4. Build e deploy:
   ```bash
   npm run build
   # ou configure o Netlify para fazer build automático a cada push
   ```

---

### Passo 6 — Ativar Licença do Cliente

Após o trial de 30 dias, o sistema exibirá automaticamente a tela de bloqueio com um botão para contato via WhatsApp (o seu número em `VITE_DEVELOPER_WHATSAPP`).

Para ativar a licença do cliente:

1. Acesse o **Firebase Console** do projeto do cliente
2. Firestore → Coleção `settings` → Documento `system`
3. Altere `isPro` para `true`

```json
{
  "active": true,
  "isPro": true,
  "trialStartedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Passo 7 — Configurar Square (opcional)

Após o deploy:

1. Acesse o painel em `https://nome-do-cliente.netlify.app/painel`
2. Vá em **Rede / Marca** e preencha:
   - **Square Location ID** (Square Dashboard → Localização)
   - **Square Application ID** (Square Developer Portal → Seu App)
3. No [Square Developer Portal](https://developer.squareup.com/apps):
   - Acesse seu app → **Point of Sale API**
   - Adicione em **Web Callback URLs**: `https://nome-do-cliente.netlify.app/painel`
4. Instale o **Square Point of Sale** no iPad/Android do cliente

---

## 🏗 Estrutura do Projeto

```
barbearia-template/
├── src/
│   ├── App.tsx               ← Roteamento + detecção de primeiro acesso
│   ├── AuthContext.tsx       ← Autenticação + sistema de licença
│   ├── LocationContext.tsx   ← Branding e configuração da rede
│   ├── firebase.ts           ← Configuração via env vars
│   ├── pages/
│   │   ├── Setup.tsx         ← Wizard de onboarding (primeiro acesso)
│   │   ├── Home.tsx          ← Site público
│   │   ├── Booking.tsx       ← Agendamento online
│   │   ├── Gallery.tsx       ← Galeria
│   │   └── Dashboard.tsx     ← Painel administrativo
│   └── components/
│       ├── LoginLock.tsx     ← Tela de licença expirada
│       └── tabs/             ← Módulos do painel
├── netlify/functions/        ← API serverless (Square Terminal)
├── firestore.rules           ← Regras de segurança do banco
├── .env.example              ← Template de variáveis de ambiente
└── README.md
```

---

## 🔐 Segurança

- **NUNCA** commite arquivos `.env.local`
- O `SQUARE_ACCESS_TOKEN` deve estar **somente** nas variáveis do Netlify (nunca no `.env.local`)
- O `VITE_DEVELOPER_EMAIL` dá acesso master — use o seu e-mail pessoal e nunca compartilhe

---

## 💰 Modelo de Licença

| Plano | Duração | Como ativar |
|-------|---------|-------------|
| **Trial** | 30 dias grátis | Automático na primeira instalação |
| **PRO** | Permanente | `settings/system` → `isPro: true` |

O cliente verá os dias restantes do trial no painel. Ao expirar, a tela de bloqueio mostra seu WhatsApp para contato.

---

*Desenvolvido com BarberPro — Sistema White-Label para Barbearias*
