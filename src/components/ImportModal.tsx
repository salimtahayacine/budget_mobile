// Import manuel d'un relevé Chaabi (Option C)
// L'utilisateur colle le HTML de l'email → parse → preview → confirme

import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { categorize } from '../categorize';
import { fmtDH } from '../format';
import { parseChaabi, ParseResult } from '../services/parseChaabi';
import { useStore } from '../store';
import { colors, font, radius, spacing } from '../theme';
import { Transaction } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Step = 'paste' | 'preview';

export function ImportModal({ visible, onClose }: Props) {
  const importChaabi = useStore((s) => s.importChaabi);

  const [step,    setStep]    = useState<Step>('paste');
  const [html,    setHtml]    = useState('');
  const [result,  setResult]  = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('paste'); setHtml(''); setResult(null);
  };
  const close = () => { reset(); onClose(); };

  const analyse = () => {
    if (!html.trim()) return;
    setLoading(true);
    // setTimeout pour laisser React re-render avant le parsing (peut être long)
    setTimeout(() => {
      const res = parseChaabi(html);
      setResult(res);
      setLoading(false);
      setStep('preview');
    }, 80);
  };

  const confirm = async () => {
    if (!result) return;
    await importChaabi(result.txs, result.balance, result.balanceDate);
    close();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          {step === 'preview' ? (
            <Pressable onPress={() => setStep('paste')} style={styles.backBtn} hitSlop={8}>
              <Text style={styles.backText}>‹ Retour</Text>
            </Pressable>
          ) : (
            <Pressable onPress={close} style={styles.backBtn} hitSlop={8}>
              <Text style={styles.backText}>✕ Fermer</Text>
            </Pressable>
          )}
          <Text style={styles.title}>
            {step === 'paste' ? '📥 Importer un relevé' : '👁 Aperçu'}
          </Text>
          <View style={{ width: 80 }} />
        </View>

        {step === 'paste' && <PasteStep html={html} setHtml={setHtml} onAnalyse={analyse} loading={loading} />}
        {step === 'preview' && result && (
          <PreviewStep result={result} onConfirm={confirm} onBack={() => setStep('paste')} />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Step 1 : coller le HTML ───────────────────────────────────────────────

function PasteStep({
  html, setHtml, onAnalyse, loading,
}: {
  html: string;
  setHtml: (v: string) => void;
  onAnalyse: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Instructions */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Comment obtenir le HTML du relevé ?</Text>
          <Text style={styles.infoStep}>1. Ouvre Gmail sur ordinateur</Text>
          <Text style={styles.infoStep}>2. Ouvre l'email de <Text style={styles.mono}>bcpmail@cpm.co.ma</Text></Text>
          <Text style={styles.infoStep}>3. Clique ⋮ → "Afficher l'original"</Text>
          <Text style={styles.infoStep}>4. Copie tout le contenu (Ctrl+A, Ctrl+C)</Text>
          <Text style={styles.infoStep}>5. Colle ci-dessous</Text>
          <View style={styles.infoDivider} />
          <Text style={styles.infoAlt}>📱 Sur mobile : transfère l'email à toi-même, ouvre dans le navigateur, fais "Voir la source"</Text>
        </View>

        <Text style={styles.fieldLabel}>HTML du relevé Chaabi *</Text>
        <TextInput
          style={styles.textarea}
          value={html}
          onChangeText={setHtml}
          placeholder="Colle le HTML complet de l'email ici…"
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {html.trim().length > 0 && (
          <Text style={styles.charCount}>{html.length.toLocaleString()} caractères</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, styles.btnPrimary, (!html.trim() || loading) && styles.btnDisabled]}
          onPress={onAnalyse}
          disabled={!html.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPrimaryText}>🔍 Analyser le relevé</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

// ── Step 2 : prévisualisation ─────────────────────────────────────────────

function PreviewStep({
  result, onConfirm, onBack,
}: {
  result: ParseResult;
  onConfirm: () => void;
  onBack: () => void;
}) {
  if (result.error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorMsg}>{result.error}</Text>
        <Pressable style={[styles.btn, styles.btnSecondary, { marginTop: 20 }]} onPress={onBack}>
          <Text style={styles.btnSecondaryText}>← Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <SumChip label="Transactions" value={String(result.txs.length)} color={colors.primary} />
        {result.balance != null && (
          <SumChip label="Solde" value={fmtDH(result.balance)} color={colors.income} />
        )}
        {result.balanceDate ? (
          <SumChip label="Relevé du" value={result.balanceDate} color={colors.textMeta} />
        ) : null}
      </View>

      <FlatList
        data={result.txs}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <PreviewRow tx={item} />}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onBack}>
          <Text style={styles.btnSecondaryText}>← Modifier</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPrimary, { flex: 2 }]} onPress={onConfirm}>
          <Text style={styles.btnPrimaryText}>✅ Confirmer l'import</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PreviewRow({ tx }: { tx: Transaction }) {
  const { label, color } = categorize(tx.lib);
  const isCredit = tx.credit > 0;
  const amt = isCredit ? tx.credit : tx.debit;
  return (
    <View style={styles.previewRow}>
      <View style={[styles.previewDot, { backgroundColor: color }]} />
      <View style={styles.previewBody}>
        <Text style={styles.previewLib} numberOfLines={1}>
          {tx.lib.length > 40 ? tx.lib.slice(0, 40) + '…' : tx.lib}
        </Text>
        <Text style={[styles.previewCat, { color }]}>{label}</Text>
      </View>
      <View style={styles.previewRight}>
        <Text style={styles.previewDate}>{tx.date.slice(0, 5)}</Text>
        <Text style={[styles.previewAmt, isCredit ? styles.cr : styles.dr]}>
          {isCredit ? '+' : '−'}{fmtDH(amt)}
        </Text>
      </View>
    </View>
  );
}

function SumChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.sumChip, { borderColor: color }]}>
      <Text style={styles.sumChipLabel}>{label}</Text>
      <Text style={[styles.sumChipValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  flex:   { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn:  { width: 80 },
  backText: { color: colors.primaryLight, fontSize: 14, fontWeight: '600' },
  title:    { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },

  body:        { padding: spacing.page, gap: 14 },
  fieldLabel:  { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  textarea: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 12,
    fontFamily: font.mono,
    padding: 12,
    minHeight: 200,
    maxHeight: 320,
  },
  charCount: { color: colors.textSecondary, fontSize: 11, textAlign: 'right' },

  infoCard: {
    backgroundColor: 'rgba(124,111,255,0.08)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(124,111,255,0.3)',
    padding: 14,
    gap: 6,
  },
  infoTitle: { color: colors.primaryLight, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  infoStep:  { color: colors.text, fontSize: 13 },
  mono:      { fontFamily: font.mono, fontSize: 12, color: colors.primaryLight },
  infoDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  infoAlt:   { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },

  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.page,
    paddingBottom: 8,
  },
  sumChip: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.button,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  sumChipLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
  sumChipValue: { fontFamily: font.mono, fontSize: 12, fontWeight: '800' },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  previewDot:   { width: 9, height: 9, borderRadius: 4.5 },
  previewBody:  { flex: 1 },
  previewLib:   { color: colors.text, fontSize: 12 },
  previewCat:   { fontSize: 10, fontWeight: '600', marginTop: 2 },
  previewRight: { alignItems: 'flex-end', gap: 2 },
  previewDate:  { color: colors.textSecondary, fontSize: 10 },
  previewAmt:   { fontFamily: font.mono, fontSize: 12, fontWeight: '700' },
  cr: { color: colors.income },
  dr: { color: colors.expense },

  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: spacing.page,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn:            { flex: 1, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  btnPrimary:     { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary:     { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  btnDisabled:    { opacity: 0.45 },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorIcon: { fontSize: 48 },
  errorMsg:  { color: colors.text, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
