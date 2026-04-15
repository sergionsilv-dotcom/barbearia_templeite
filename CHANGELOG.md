# Changelog — BarberPro

Todos os itens notáveis neste projeto são documentados aqui.  
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.1.0] — 2026-04-15

### ✅ Adicionado
- **Wizard de Onboarding** (`/setup`): primeiro acesso guia o cliente em 3 passos para configurar nome, slogan, WhatsApp e Instagram da barbearia
- **Seção de Licença no Painel**: aba "Rede / Marca" agora exibe status da licença (Trial / PRO / Expirado), dias restantes e botão de upgrade via WhatsApp
- **Variáveis de ambiente do desenvolvedor**: `VITE_DEVELOPER_EMAIL` e `VITE_DEVELOPER_WHATSAPP` — permitem ao revendedor personalizar o acesso master e o botão de contato da tela de bloqueio

### 🔧 Corrigido
- **Bug crítico** em `LoginLock.tsx`: `networkSettings` renomeado para `networkConfig` (evitava quebra total ao expirar licença)
- **Footer hardcoded**: Instagram e copyright do rodapé agora usam `networkConfig` dinamicamente
- **Horário e endereço estáticos** na Home removidos e substituídos por dados do `activeBranch` no Firebase
- **WhatsApp hardcoded** na tela de bloqueio substituído por `VITE_DEVELOPER_WHATSAPP`
- **Email hardcoded** `sergionsilv@gmail.com` no `AuthContext` substituído por `VITE_DEVELOPER_EMAIL`

### 🗑 Removido
- Nome "O Barbeiro Sergio" de todos os valores padrão e placeholders do sistema
- Endereço de Vancouver hardcoded (`3395 Church St`) da página Home
- Telefone hardcoded `+1 (236) 512-8846` da página Home
- Review hardcoded mencionando "O Sergio" nos depoimentos da Home
- Links fixos de Instagram `obarbeirosergio` no footer

---

## [1.0.0] — 2026-04-14

### ✅ Adicionado
- Sistema completo de agendamentos com calendário visual
- Integração Square (Reader BT + Terminal)
- Controle de clientes, profissionais, estoque e financeiro
- Multi-unidades (filiais)
- Sistema de trial de 30 dias e licença PRO
- Configuração 100% via variáveis de ambiente (sem hardcode de credenciais)
- Deploy via Netlify com funções serverless para Square Terminal
