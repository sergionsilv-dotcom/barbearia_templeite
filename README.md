# BarberPro — Sistema de Gestão para Barbearias

Sistema completo de gestão para barbearias: agendamentos, pagamentos via Square, controle de clientes, estoque e financeiro.

---

## 🚀 Como instalar para um novo cliente

### Pré-requisitos
- Node.js 18+
- Conta no [Firebase](https://firebase.google.com) (gratuita)
- Conta no [Netlify](https://netlify.com) (gratuita)
- Conta no [Square Developer Portal](https://developer.squareup.com) (requer conta Square ativa)

---

### Passo 1 — Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Escolha um nome (ex: `barbearia-joao`)
4. Ative o **Firestore Database** (modo produção)
5. Ative o **Authentication** → habilite **E-mail/Senha**
6. Vá em **Configurações do Projeto** → **Seus Apps** → Adicione um app Web
7. Copie as credenciais (apiKey, authDomain, etc.)

### Passo 2 — Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o .env.local com as credenciais do Firebase
```

Preencha o `.env.local`:
```env
VITE_FB_API_KEY=AIzaSy...
VITE_FB_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FB_PROJECT_ID=seu-projeto-id
VITE_FB_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FB_MESSAGING_SENDER_ID=000000000000
VITE_FB_APP_ID=1:000000000000:web:abcdefabcdef
VITE_FB_FIRESTORE_DB_ID=(default)
VITE_SQUARE_ENV=production
```

### Passo 3 — Configurar Regras do Firestore

No Firebase Console → Firestore → Regras, cole o conteúdo do arquivo `firestore.rules`.

### Passo 4 — Criar o primeiro usuário Admin

1. No Firebase Console → Authentication → Adicionar usuário manualmente (e-mail + senha)
2. No Firestore → Coleção `users` → Criar documento com o UID do usuário:
   ```json
   {
     "uid": "UID_DO_USUARIO",
     "name": "Nome do Proprietário",
     "email": "email@exemplo.com",
     "role": "admin"
   }
   ```

### Passo 5 — Instalar e Testar Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e faça login com o usuário admin criado.

### Passo 6 — Deploy no Netlify

1. Crie uma conta em [netlify.com](https://netlify.com)
2. Clique em **"Add new site"** → **"Deploy manually"** ou conecte ao GitHub
3. Nas **Configurações do Site → Environment Variables**, adicione:
   - Todas as variáveis `VITE_FB_*` do seu `.env.local`
   - `SQUARE_ACCESS_TOKEN` = Token de Acesso de Produção do Square
   - `VITE_SQUARE_ENV` = `production`
4. Faça o build e deploy:
   ```bash
   npm run build
   npx netlify-cli deploy --prod --dir=dist
   ```

---

### Passo 7 — Configurar Square (Pagamentos)

Após o deploy:

1. Acesse o painel em `https://seu-site.netlify.app/painel`
2. Vá em **Configurações** e preencha:
   - **Square Location ID** (encontrado em Square Dashboard → Localização)
   - **Square Application ID** (encontrado em Square Developer Portal → Seu App)
3. No [Square Developer Portal](https://developer.squareup.com/apps):
   - Acesse seu app → **Point of Sale API**
   - Adicione em **Web Callback URLs**: `https://seu-site.netlify.app/painel`
4. Instale o app **Square Point of Sale** no iPad/Android do cliente

---

## 📱 Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Agendamentos** | Calendário visual por profissional com checkout integrado |
| **Pagamentos** | Dinheiro, Interac, Square Reader BT (iPad/Android), Square Terminal |
| **Clientes** | Cadastro completo com histórico |
| **Profissionais** | Gestão de barbeiros e comissões |
| **Estoque** | Controle de produtos com venda no checkout |
| **Financeiro** | Transações, despesas e relatórios |
| **Configurações** | Branding, Square IDs, dados da rede |
| **Site Público** | Página de agendamento online para clientes |

---

## 🔧 Estrutura do Projeto

```
barbearia-template/
├── src/
│   ├── firebase.ts          ← Configuração via env vars
│   ├── LocationContext.tsx  ← Square IDs e branding (do Firebase)
│   ├── components/tabs/
│   │   └── SettingsTab.tsx  ← Onde o cliente configura Square IDs
│   └── lib/
│       └── squareService.ts ← Lógica de pagamento Square
├── netlify/functions/       ← API serverless (Square Terminal)
├── firestore.rules          ← Segurança do banco de dados
├── .env.example             ← Template de variáveis de ambiente
└── README.md
```

---

## ⚠️ Segurança

- **NUNCA** commite arquivos `.env.local` ou `firebase-applet-config.json`
- O `SQUARE_ACCESS_TOKEN` deve estar APENAS nas variáveis de ambiente do Netlify
- O `Square Application ID` (que começa com `sq0idp-`) é público e pode ficar no Firebase
