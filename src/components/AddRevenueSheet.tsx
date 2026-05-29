import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { todayDMY } from '../format';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddRevenueSheet({ visible, onClose }: Props) {
  const addRevenue = useStore((s) => s.addRevenue);

  const [lib,     setLib]     = useState('');
  const [date,    setDate]    = useState(todayDMY());
  const [montant, setMontant] = useState('');

  const reset = () => { setLib(''); setDate(todayDMY()); setMontant(''); };

  const save = () => {
    const amt = parseFloat(montant.replace(',', '.'));
    if (!lib.trim() || isNaN(amt) || amt <= 0) return;
    addRevenue({ lib: lib.trim(), date, amount: amt });
    reset();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={() => { reset(); onClose(); }}>
      <Text style={styles.title}>💰 Nouveau revenu</Text>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Libellé *">
          <TextInput
            style={styles.input}
            value={lib}
            onChangeText={setLib}
            placeholder="Ex: Salaire, Freelance, Loyer reçu…"
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
        </Field>

        <Field label="Date *">
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Montant (DH) *">
          <TextInput
            style={styles.input}
            value={montant}
            onChangeText={setMontant}
            placeholder="0,00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />
        </Field>

        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>💾 Enregistrer le revenu</Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title:      { color: colors.text, fontSize: 17, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  form:       { paddingHorizontal: spacing.page, gap: 12 },
  field:      { gap: 6 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveBtn:     { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: radius.button, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
