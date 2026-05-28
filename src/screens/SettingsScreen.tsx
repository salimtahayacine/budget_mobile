import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fmtDH } from '../format';
import { useGoogleAuthRequest } from '../services/googleAuth';
import { useStore } from '../store';
import { colors, font, radius, spacing } from '../theme';
import { GoogleTokens } from '../services/googleAuth';

export function SettingsScreen() {
  const budgetLimit      = useStore((s) => s.budgetLimit);
  const manualBalance    = useStore((s) => s.manualBalance);
  const googleTokens     = useStore((s) => s.googleTokens);
  const lastDriveSync    = useStore((s) => s.lastDriveSync);
  const driveStatus      = useStore((s) => s.driveStatus);
  const setBudgetLimit   = useStore((s) => s.setBudgetLimit);
  const setManualBalance = useStore((s) => s.setManualBalance);
  const setGoogleTokens  = useStore((s) => s.setGoogleTokens);
  const disconnectGoogle = useStore((s) => s.disconnectGoogle);
  const syncWithDrive    = useStore((s) => s.syncWithDrive);
  const clearCache       = useStore((s) => s.clearCache);

  const [limitDraft,   setLimitDraft]   = useState(String(budgetLimit));
  const [balanceDraft, setBalanceDraft] = useState(manualBalance != null ? String(manualBalance) : '');

  const onTokens = useCallback((t: GoogleTokens) => {
    setGoogleTokens(t);
  }, [setGoogleTokens]);

  const { promptAsync, isReady } = useGoogleAuthRequest(onTokens);

  const saveLimitBlur = () => {
    const v = parseFloat(limitDraft.replace(',', '.'));
    if (v > 0) setBudgetLimit(v);
    else setLimitDraft(String(budgetLimit));
  };
  const saveBalanceBlur = () => {
    const v = parseFloat(balanceDraft.replace(',', '.'));
    if (!Number.isNaN(v) && v >= 0) setManualBalance(v);
    else setBalanceDraft(manualBalance != null ? String(manualBalance) : '');
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Déconnecter Google',
      'Les données restent sauvegardées localement. La sync Drive sera désactivée.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: disconnectGoogle },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache Chaabi',
      'Les transactions Chaabi seront effacées jusqu\'à la prochaine synchronisation Gmail.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Vider', style: 'destructive', onPress: clearCache },
      ]
    );
  };

  const syncLabel = (() => {
    if (driveStatus === 'syncing') return '⏳ Synchronisation…';
    if (driveStatus === 'error')   return '⚠️ Erreur de sync';
    if (lastDriveSync) {
      const d = new Date(lastDriveSync);
      return `Dernière sync : ${d.toLocaleDateString('fr-MA')} à ${d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Jamais synchronisé';
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>⚙️ Réglages</Text>

        {/* ── Budget ─────────────────────────────────────── */}
        <Section title="Budget">
          <SettingRow label="Limite mensuelle (DH)">
            <TextInput
              style={styles.input}
              value={limitDraft}
              onChangeText={setLimitDraft}
              onBlur={saveLimitBlur}
              onSubmitEditing={saveLimitBlur}
              keyboardType="decimal-pad"
              placeholder="3500"
              placeholderTextColor={colors.textSecondary}
            />
          </SettingRow>

          <SettingRow label="Solde du compte (DH)">
            <TextInput
              style={styles.input}
              value={balanceDraft}
              onChangeText={setBalanceDraft}
              onBlur={saveBalanceBlur}
              onSubmitEditing={saveBalanceBlur}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={colors.textSecondary}
            />
          </SettingRow>
        </Section>

        {/* ── Google Drive Sync ──────────────────────────── */}
        <Section title="☁️ Sauvegarde Google Drive">
          {googleTokens ? (
            <>
              <View style={styles.connectedRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.connectedText}>
                  Connecté{googleTokens.email ? ` — ${googleTokens.email}` : ''}
                </Text>
              </View>

              <Text style={styles.syncStatus}>{syncLabel}</Text>

              <Pressable
                style={[styles.btn, styles.btnPrimary, driveStatus === 'syncing' && styles.btnDisabled]}
                onPress={syncWithDrive}
                disabled={driveStatus === 'syncing'}
              >
                {driveStatus === 'syncing'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnPrimaryText}>🔄 Synchroniser maintenant</Text>
                }
              </Pressable>

              <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleDisconnect}>
                <Text style={styles.btnDangerText}>Déconnecter Google</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.syncDesc}>
                Connecte ton compte Google pour sauvegarder automatiquement tes données
                (dépenses manuelles, souhaits, revenus) dans Google Drive.{'\n\n'}
                Les données Gmail et Agenda ne sont accessibles qu'en lecture.
              </Text>
              <Pressable
                style={[styles.btn, styles.btnGoogle, !isReady && styles.btnDisabled]}
                onPress={promptAsync}
                disabled={!isReady}
              >
                <Text style={styles.btnGoogleText}>🔐 Connecter Google</Text>
              </Pressable>
              <Text style={styles.noteText}>
                Scopes demandés : Gmail (lecture), Calendar (lecture), Drive AppData (backup)
              </Text>
            </>
          )}
        </Section>

        {/* ── Cache ──────────────────────────────────────── */}
        <Section title="Cache Chaabi">
          <Text style={styles.syncDesc}>
            Les transactions Chaabi sont mises en cache depuis le dernier email Gmail.
            Vider le cache force une nouvelle synchronisation.
          </Text>
          <Pressable style={[styles.btn, styles.btnDanger]} onPress={handleClearCache}>
            <Text style={styles.btnDangerText}>🗑️ Vider le cache Chaabi</Text>
          </Pressable>
        </Section>

        {/* ── À propos ───────────────────────────────────── */}
        <Section title="À propos">
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Application</Text>
            <Text style={styles.aboutValue}>budget.ma</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Compte</Text>
            <Text style={styles.aboutValue}>0*****10004 · Chaabi Bank</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  body:          { padding: spacing.page, gap: 20, paddingBottom: 40 },
  pageTitle:     { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },

  section:       { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionTitle:  { color: colors.textMeta, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, padding: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionBody:   { padding: 12, gap: 12 },

  settingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel:  { color: colors.text, fontSize: 14, flex: 1 },
  input:         { backgroundColor: colors.surfaceSubtle, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: font.mono, fontSize: 15, paddingHorizontal: 12, paddingVertical: 8, minWidth: 120, textAlign: 'right' },

  connectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotGreen:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.income },
  connectedText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  syncStatus:    { color: colors.textSecondary, fontSize: 12 },
  syncDesc:      { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  noteText:      { color: colors.textSecondary, fontSize: 11, fontStyle: 'italic' },

  btn:             { paddingVertical: 12, borderRadius: radius.button, alignItems: 'center' },
  btnPrimary:      { backgroundColor: colors.primary },
  btnPrimaryText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnGoogle:       { backgroundColor: '#4285F4' },
  btnGoogleText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDanger:       { backgroundColor: 'rgba(255,77,109,0.15)', borderWidth: 1, borderColor: colors.expense },
  btnDangerText:   { color: colors.expense, fontWeight: '600', fontSize: 14 },
  btnDisabled:     { opacity: 0.5 },

  aboutRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  aboutLabel:    { color: colors.textSecondary, fontSize: 13 },
  aboutValue:    { color: colors.text, fontSize: 13, fontWeight: '600' },
});
