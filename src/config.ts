// ─── Google Cloud OAuth 2.0 credentials ──────────────────────────────────
//
// SETUP STEPS:
//  1. Aller sur https://console.cloud.google.com/apis/credentials
//  2. Créer un projet "budget-ma" ou utiliser un existant
//  3. Activer les APIs : Gmail API, Google Calendar API, Google Drive API
//  4. Créer des identifiants OAuth 2.0 :
//       - Type Android  → renseigner le package name + SHA-1 du keystore
//       - Type iOS      → renseigner le Bundle ID
//       - Type Web      → pour le proxy Expo Go en développement
//  5. Coller les client IDs ci-dessous
//
// IMPORTANT : ne jamais committer ce fichier avec de vraies valeurs.
// Ajouter "src/config.ts" dans .gitignore si les credentials sont sensibles.

export const GOOGLE_CONFIG = {
  androidClientId: 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId:     'VOTRE_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId:     'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com',
} as const;

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.appdata',   // ← backup cloud
];

// Nom du fichier de sauvegarde dans l'AppData Drive (invisible dans My Drive)
export const DRIVE_BACKUP_FILENAME = 'budget-ma-backup.json';

// Délai debounce avant push vers Drive après un save (ms)
export const DRIVE_PUSH_DEBOUNCE_MS = 5000;
