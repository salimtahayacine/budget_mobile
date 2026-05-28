// Google OAuth 2.0 — expo-auth-session/providers/google
// Gère : connexion initiale, stockage token, refresh automatique

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GOOGLE_CONFIG, GOOGLE_SCOPES } from '../config';

// Nécessaire pour fermer le navigateur OAuth sur Android
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'bma_google_auth';

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // ms timestamp
  email?: string;
}

// ─── Persistance ─────────────────────────────────────────────────────────

export async function loadStoredTokens(): Promise<GoogleTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GoogleTokens) : null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: GoogleTokens): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── Refresh token ────────────────────────────────────────────────────────

export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.webClientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const tokens: GoogleTokens = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? refreshToken, // Google ne renvoie pas toujours un nouveau RT
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    await saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

// ─── Obtenir un token valide (refresh si expiré) ──────────────────────────

export async function getValidToken(
  stored: GoogleTokens
): Promise<string | null> {
  // Marge de 60s pour éviter les expiration en cours de requête
  if (Date.now() < stored.expiresAt - 60_000) {
    return stored.accessToken;
  }
  if (!stored.refreshToken) return null;
  const refreshed = await refreshAccessToken(stored.refreshToken);
  return refreshed?.accessToken ?? null;
}

// ─── Infos utilisateur ────────────────────────────────────────────────────

export async function fetchUserEmail(accessToken: string): Promise<string | undefined> {
  try {
    const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    return json.email ?? undefined;
  } catch {
    return undefined;
  }
}

// ─── Hook React — à utiliser dans App.tsx ────────────────────────────────
//
// Retourne { request, promptAsync } pour déclencher le flow OAuth.
// L'appelant passe onSuccess(tokens) pour stocker dans le store.

export interface UseGoogleAuthReturn {
  promptAsync: () => Promise<void>;
  isReady: boolean;
}

export function useGoogleAuthRequest(
  onSuccess: (tokens: GoogleTokens) => void
): UseGoogleAuthReturn {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CONFIG.androidClientId,
    iosClientId:     GOOGLE_CONFIG.iosClientId,
    webClientId:     GOOGLE_CONFIG.webClientId,
    scopes:          GOOGLE_SCOPES,
    // offline access → refresh token
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const auth = response.authentication;
    if (!auth?.accessToken) return;

    const tokens: GoogleTokens = {
      accessToken:  auth.accessToken,
      refreshToken: auth.refreshToken ?? null,
      expiresAt:    Date.now() + (auth.expiresIn ?? 3600) * 1000,
    };

    saveTokens(tokens);

    // Enrichir avec l'email (best-effort)
    fetchUserEmail(tokens.accessToken).then((email) => {
      if (email) saveTokens({ ...tokens, email });
      onSuccess({ ...tokens, email });
    });
  }, [response, onSuccess]);

  return {
    isReady: !!request,
    promptAsync: async () => {
      await promptAsync();
    },
  };
}
