import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// Firebase é configurado via variáveis de ambiente no arquivo .env.local
// Copie o arquivo .env.example para .env.local e preencha com suas credenciais.
// Encontre as credenciais em: Firebase Console → Configurações do Projeto → Seus Apps
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FB_API_KEY,
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FB_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FB_FIRESTORE_DB_ID || '(default)';

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    '[Firebase] ERRO: Variáveis de ambiente não configuradas!\n' +
    'Copie o arquivo .env.example para .env.local e preencha com suas credenciais do Firebase.'
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Se o Firestore Database ID for "(default)", não passar o parâmetro extra
export const db = firestoreDatabaseId === '(default)'
  ? getFirestore(app)
  : getFirestore(app, firestoreDatabaseId);

export const auth = getAuth(app);
