import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORY_OPTIONS } from '../categorize';
import { todayDMY } from '../format';
import { useStore } from '../store';
import { colors, font, radius, spacing } from '../theme';
import { BottomSheet } from './BottomSheet';

type Mode = 'depense' | 'revenu';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialMode?: Mode;
}

export function AddTransactionSheet({ visible, onClose, initialMode = 'depense' }: Props) {
  const addManualTx = useStore((s) => s.addManualTx);
  const addRevenue  = useStore((s) => s.addRevenue);

  const [mode,        setMode]        = useState<Mode>(initialMode);
  const [lib,         setLib]         = useState('');
  const [date,        setDate]        = useState(todayDMY());
  const [montant,     setMontant]     = useState('');
  const [catKeyword,  setCatKeyword]  = useState('');
  const [showCatPick, setShowCatPick] = useState(false);

  const reset = () => {
    setLib(''); setDate(todayDMY()); setMontant(''); setCatKeyword(''); setShowCatPick(false);
  };

  const selectedCatLabel = CATEGORY_OPTIONS.find((o) => o.keyword === catKeyword)?.label ?? 'Auto-détecté';

  const save = () => {
    const amt = parseFloat(montant.replace(',', '.'));
    if (!lib.trim() || isNaN(amt) || amt <= 0) return;

    const libFinal = catKeyword ? `${catKeyword} ${lib.trim()}` : lib.trim();

    if (mode === 'depense') {
      addManualTx({ lib: libFinal, date, debit: amt, credit: 0 });
    } else {
      // Revenu → ManualRevenue (affiché dans l'onglet Revenus)
      addRevenue({ lib: libFinal, date, amount: amt });
    }
    reset();
    onClose();
  };

  // Picker inline
  if (showCatPick) {
    return (
      <BottomSheet visible={visible} onClose={() => setShowCatPick(false)}>
        <Text style={styles.sheetTitle}>Choisir une catégorie</Text>
        <ScrollView>
          {CATEGORY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.keyword}
              style={[styles.catOption, catKeyword === opt.keyword && styles.catOptionActive]}
              onPress={() => { setCatKeyword(opt.keyword); setShowCatPick(false); }}
            >
              <Text style={styles.catOptionText}>{opt.label}</Text>
              {catKeyword === opt.keyword && <Text style={styles.catCheck}>✓</Text>}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={() => { reset(); onClose(); }}>
      {/* Mode toggle */}
      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleBtn, mode === 'depense' && styles.toggleActive]}
          onPress={() => setMode('depense')}
        >
          <Text style={[styles.toggleText, mode === 'depense' && styles.toggleTextActive]}>
            💸 Dépense
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, mode === 'revenu' && styles.toggleActiveGreen]}
          onPress={() => setMode('revenu')}
        >
          <Text style={[styles.toggleText, mode === 'revenu' && styles.toggleTextActive]}>
            💰 Revenu
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Libellé *">
          <TextInput
            style={styles.input}
            value={lib}
            onChangeText={setLib}
            placeholder="Ex: Loyer, Courses…"
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

        {mode === 'depense' && (
          <Field label="Catégorie">
            <Pressable style={styles.catSelect} onPress={() => setShowCatPick(true)}>
              <Text style={styles.catSelectText}>{selectedCatLabel}</Text>
              <Text style={styles.catChevron}>›</Text>
            </Pressable>
          </Field>
        )}

        <Pressable
          style={[styles.saveBtn, mode === 'revenu' ? styles.saveBtnGreen : styles.saveBtnViolet]}
          onPress={save}
        >
          <Text style={styles.saveBtnText}>
            💾 Enregistrer {mode === 'depense' ? 'dépense' : 'revenu'}
          </Text>
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
  sheetTitle: { color: colors.text, fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 8 },
  toggle: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 4,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.button,
    padding: 3,
    gap: 3,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.button - 2, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.expense },
  toggleActiveGreen: { backgroundColor: '#16a34a' },
  toggleText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#fff' },
  form: { paddingHorizontal: spacing.page, paddingTop: 8, gap: 12 },
  field: { gap: 6 },
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
  catSelect: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catSelectText: { color: colors.text, fontSize: 15 },
  catChevron: { color: colors.textSecondary, fontSize: 18 },
  catOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catOptionActive: { backgroundColor: 'rgba(124,111,255,0.1)' },
  catOptionText: { color: colors.text, fontSize: 15 },
  catCheck: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  saveBtn: { paddingVertical: 14, borderRadius: radius.button, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  saveBtnViolet: { backgroundColor: colors.primary },
  saveBtnGreen: { backgroundColor: '#16a34a' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
