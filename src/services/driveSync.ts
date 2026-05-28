// Google Drive AppData — backup & restore
// L'AppData folder est privé, invisible dans My Drive, quota Drive de l'utilisateur.
//
// API docs: https://developers.google.com/drive/api/guides/appdata

import { DRIVE_BACKUP_FILENAME } from '../config';
import { ManualRevenue, Transaction, WishItem } from '../types';

const DRIVE_API    = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API   = 'https://www.googleapis.com/upload/drive/v3';

// ─── Format de sauvegarde ─────────────────────────────────────────────────

export interface BackupData {
  version: number;          // schema version pour migrations futures
  updatedAt: string;        // ISO timestamp
  manualTxs: Transaction[];
  manualRevs: ManualRevenue[];
  wishes: WishItem[];
  budgetLimit: number;
  manualBalance: number | null;
}

export const BACKUP_VERSION = 1;

// ─── Helpers HTTP ─────────────────────────────────────────────────────────

async function driveGet(path: string, token: string): Promise<Response> {
  return fetch(`${DRIVE_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Multipart upload : métadonnées JSON + contenu JSON
async function driveUpload(
  method: 'POST' | 'PATCH',
  path: string,
  token: string,
  metadata: object,
  body: object
): Promise<Response> {
  const boundary = 'bma_boundary_xyz';
  const metaPart = JSON.stringify(metadata);
  const bodyPart = JSON.stringify(body);

  const multipart = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metaPart,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    bodyPart,
    `--${boundary}--`,
  ].join('\r\n');

  return fetch(`${UPLOAD_API}${path}?uploadType=multipart`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });
}

// ─── Opérations fichier ───────────────────────────────────────────────────

// Cherche l'ID du fichier backup existant dans AppData
async function findBackupFileId(token: string): Promise<string | null> {
  const res = await driveGet(
    `/files?spaces=appDataFolder&q=name='${DRIVE_BACKUP_FILENAME}'&fields=files(id)`,
    token
  );
  if (!res.ok) return null;
  const json = await res.json();
  return (json.files?.[0]?.id as string) ?? null;
}

// Crée le fichier backup dans AppData
async function createBackupFile(token: string, data: BackupData): Promise<string | null> {
  const res = await driveUpload('POST', '/files', token, {
    name: DRIVE_BACKUP_FILENAME,
    parents: ['appDataFolder'],
  }, data);
  if (!res.ok) return null;
  const json = await res.json();
  return json.id ?? null;
}

// Met à jour un fichier backup existant
async function updateBackupFile(
  token: string,
  fileId: string,
  data: BackupData
): Promise<boolean> {
  const res = await driveUpload('PATCH', `/files/${fileId}`, token, {}, data);
  return res.ok;
}

// Lit le contenu du fichier backup
async function readBackupFile(token: string, fileId: string): Promise<BackupData | null> {
  const res = await driveGet(`/files/${fileId}?alt=media`, token);
  if (!res.ok) return null;
  try {
    return (await res.json()) as BackupData;
  } catch {
    return null;
  }
}

// ─── API publique ─────────────────────────────────────────────────────────

// Push : crée ou met à jour le backup dans Drive
export async function pushBackup(token: string, data: BackupData): Promise<boolean> {
  try {
    const backup: BackupData = { ...data, updatedAt: new Date().toISOString() };
    const fileId = await findBackupFileId(token);
    if (fileId) {
      return updateBackupFile(token, fileId, backup);
    } else {
      const newId = await createBackupFile(token, backup);
      return !!newId;
    }
  } catch (e) {
    console.warn('[driveSync] push failed:', e);
    return false;
  }
}

// Pull : récupère le backup depuis Drive (null = pas de backup ou erreur)
export async function pullBackup(token: string): Promise<BackupData | null> {
  try {
    const fileId = await findBackupFileId(token);
    if (!fileId) return null;
    return readBackupFile(token, fileId);
  } catch (e) {
    console.warn('[driveSync] pull failed:', e);
    return null;
  }
}

// Supprime le fichier backup (utile pour "reset sync" dans les settings)
export async function deleteBackup(token: string): Promise<boolean> {
  try {
    const fileId = await findBackupFileId(token);
    if (!fileId) return true;
    const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

// ─── Stratégie de merge ───────────────────────────────────────────────────
//
// Single-user : on prend la version la plus récente (local vs Drive).
// Les items sont mergés par ID — union des deux listes, local prioritaire en cas de conflit.

export function mergeBackup(local: BackupData, remote: BackupData): BackupData {
  const remoteNewer = new Date(remote.updatedAt) > new Date(local.updatedAt);

  // Merge transactions par ID
  const txMap = new Map<number, Transaction>();
  for (const t of remote.manualTxs) txMap.set(t.id, t);
  for (const t of local.manualTxs) txMap.set(t.id, t); // local écrase si conflit
  const manualTxs = Array.from(txMap.values());

  // Merge revenues par ID
  const revMap = new Map<number, ManualRevenue>();
  for (const r of remote.manualRevs) revMap.set(r.id, r);
  for (const r of local.manualRevs) revMap.set(r.id, r);
  const manualRevs = Array.from(revMap.values());

  // Merge wishes par ID
  const wishMap = new Map<number, WishItem>();
  for (const w of remote.wishes) wishMap.set(w.id, w);
  for (const w of local.wishes) wishMap.set(w.id, w);
  const wishes = Array.from(wishMap.values());

  // Scalaires : version la plus récente gagne
  const budgetLimit   = remoteNewer ? remote.budgetLimit   : local.budgetLimit;
  const manualBalance = remoteNewer ? remote.manualBalance : local.manualBalance;

  return {
    version: BACKUP_VERSION,
    updatedAt: new Date().toISOString(),
    manualTxs,
    manualRevs,
    wishes,
    budgetLimit,
    manualBalance,
  };
}
