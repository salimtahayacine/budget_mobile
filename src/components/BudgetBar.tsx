import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fmtDH } from '../format';
import { selectSummary, useStore } from '../store';
import { colors, font, radius } from '../theme';

const STATE_COLOR = {
  ok: '#22c55e',
  warn: '#f59e0b',
  over: '#dc2626',
} as const;

export function BudgetBar() {
  const summary = useStore(selectSummary);
  const budgetLimit = useStore((s) => s.budgetLimit);
  const setBudgetLimit = useStore((s) => s.setBudgetLimit);

  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState('');

  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: summary.pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [summary.pct, width]);

  // blinking over-budget badge
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (summary.budgetState !== 'over') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [summary.budgetState, blink]);

  const openModal = () => {
    setDraft(String(budgetLimit));
    setModal(true);
  };
  const save = () => {
    const v = parseFloat(draft.replace(',', '.'));
    if (v > 0) setBudgetLimit(v);
    setModal(false);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>📉 Budget dépenses</Text>
        <View style={styles.metaRow}>
          {summary.budgetState === 'over' && (
            <Animated.View style={[styles.badge, { opacity: blink }]}>
              <Text style={styles.badgeText}>⚠️ +{fmtDH(summary.over)}</Text>
            </Animated.View>
          )}
          <Pressable onPress={openModal} hitSlop={6}>
            <Text style={styles.edit}>✏️ Modifier</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.text}>
        {fmtDH(summary.depenses)} / {fmtDH(budgetLimit)}
      </Text>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: STATE_COLOR[summary.budgetState],
              width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setModal(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>✏️ Budget mensuel limite</Text>
            <TextInput
              style={styles.modalInput}
              value={draft}
              onChangeText={setDraft}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="Ex: 3500"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={save}
            />
            <View style={styles.modalRow}>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => setModal(false)}>
                <Text style={styles.btnSecondaryText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={save}>
                <Text style={styles.btnPrimaryText}>Enregistrer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    backgroundColor: 'rgba(220,38,38,0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: colors.expense, fontSize: 11, fontWeight: '700' },
  edit: { color: colors.primaryLight, fontSize: 12, fontWeight: '600' },
  text: { color: colors.textSecondary, fontFamily: font.mono, fontSize: 13, marginVertical: 8 },
  track: { height: 10, borderRadius: 999, backgroundColor: colors.surfaceSubtle, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.hero,
    borderWidth: 1,
    borderColor: colors.borderElevated,
    padding: 18,
  },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  modalInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 18,
    fontFamily: font.mono,
    padding: 12,
    marginBottom: 14,
  },
  modalRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: radius.button, alignItems: 'center' },
  btnSecondary: { backgroundColor: colors.surfaceSubtle },
  btnSecondaryText: { color: colors.textSecondary, fontWeight: '600' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
});
