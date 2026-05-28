import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fmtDH } from '../format';
import { useStore } from '../store';
import { colors, font, radius } from '../theme';

export function BalanceHero() {
  const balance = useStore((s) => s.manualBalance);
  const setBalance = useStore((s) => s.setManualBalance);
  const balanceDate = useStore((s) => s.cache?.balanceDate ?? '—');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (editing) setDraft(balance != null ? String(balance) : '');
  }, [editing, balance]);

  const commit = () => {
    const v = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(v) && v >= 0) setBalance(v);
    setEditing(false);
  };

  return (
    <View style={styles.hero}>
      <View style={styles.left}>
        <Text style={styles.label}>SOLDE DU COMPTE</Text>

        {editing ? (
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            keyboardType="decimal-pad"
            autoFocus
            onBlur={commit}
            onSubmitEditing={commit}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        ) : (
          <Pressable onLongPress={() => setEditing(true)} onPress={() => setEditing(true)}>
            <Text style={styles.amount}>{balance != null ? fmtDH(balance) : '— DH'}</Text>
          </Pressable>
        )}

        <Text style={styles.account}>Compte 0*****10004 · Chaabi Bank / Banque Populaire</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaLabel}>Relevé du</Text>
        <Text style={styles.metaValue}>{balanceDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#16213e',
    borderRadius: radius.hero,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  left: { flex: 1, paddingRight: 8 },
  label: { color: colors.textMeta, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  amount: {
    color: colors.income,
    fontSize: 30,
    fontFamily: font.mono,
    fontWeight: '700',
    marginVertical: 6,
  },
  input: {
    color: colors.income,
    fontSize: 28,
    fontFamily: font.mono,
    fontWeight: '700',
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.income,
    paddingVertical: 2,
  },
  account: { color: colors.textSecondary, fontSize: 11 },
  meta: { alignItems: 'flex-end' },
  metaLabel: { color: colors.textSecondary, fontSize: 11 },
  metaValue: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
});
