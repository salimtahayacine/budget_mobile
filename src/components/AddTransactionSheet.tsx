import { useEffect, useState } from 'react';
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
import { Transaction } from '../types';
import { BottomSheet } from './BottomSheet';

type Mode = 'depense' | 'revenu';

interface Props {
  visible:     boolean;
  onClose:     () => void;
  initialMode?: Mode;
  editingTx?:  Transaction; // mode édition si fourni
}

export function AddTransactionSheet({ visible, onClose, initialMode = 'depense', editingTx }: Props) {
  const addManualTx    = useStore((s) => s.addManualTx);
  const updateManualTx = useStore((s) => s.updateManualTx);
  const addRevenue     = useStore((s) => s.addRevenue);

  const isEditing = !!editingTx;

  const [mode,        setMode]        = useState<Mode>(initialMode);
  const [lib,         setLib]         = useState('');
  const [date,        setDate]        = useState(todayDMY());
  const [montant,     setMontant]     = useState('');
  const [catKeyword,  setCatKeyword]  = useState('');
  const [showCatPick, setShowCatPick] = useState(false);

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (visible && editingTx) {
      setMode(editingTx.debit > 0 ? 'depense' : 'revenu');
      setLib(editingTx.lib);
      setDate(editingTx.date);
      setMontant(String(editingTx.debit > 0 ? editingTx.debit : editingTx.credit));
      setCatKeyword('');
    } else if (visible && !editingTx) {
      setMode(initialMode);
      setLib(''); setDate(todayDMY()); setMontant(''); setCatKeyword('');
    }
  }, [visible, editingTx, initialMode]);

  const reset = () => {
    setLib(''); setDate(todayDMY()); setMontant(''); setCatKeyword(''); setShowCatPick(false);
  };

  const selectedCatLabel = CATEGORY_OPTIONS.find((o) => o.keyword === catKeyword)?.label ?? 'Auto-détecté';

  const save = () => {
    const amt = parseFloat(montant.replace(',', '.'));
    if (!lib.trim() || isNaN(amt) || amt <= 0) return;
    const libFinal = catKeyword ? `${catKeyword} ${lib.trim()}` : lib.trim();

    if (isEditing && editingTx) {
      // Mode édition → update uniquement les champs modifiables
      updateManualTx(editingTx.id, {
        lib:    libFinal,
        date,
        debit:  mode === 'depense' ? amt : 0,
        credit: mode === 'revenu'  ? amt : 0,
      });
    } else if (mode === 'depense') {
      addManualTx({ lib: libFinal, date, debit: amt, credit: 0 });
    } else {
      addRevenue({ lib: libFinal, date, amount: amt });
    }
    reset();
    onClose();
  };

  // Picker catégorie inline
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
      {/* Titre */}
      <Text style={styles.sheetTitle}>
        {isEditing ? '✏️ Modifier la transaction' : '➕ Nouvelle transaction'}
      </Text>

      {/* Mode toggle (masqué en édition) */}
      {!isEditing && (
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, mode === 'depense' && styles.toggleActiveDep]}
            onPress={() => setMode('depense')}
          >
            <Text style={[styles.toggleText, mode === 'depense' && styles.toggleTextActive]}>
              💸 Dépense
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, mode === 'revenu' && styles.toggleActiveRev]}
            onPress={() => setMode('revenu')}
          >
            <Text style={[styles.toggleText, mode === 'revenu' && styles.toggleTextActive]}>
              💰 Revenu
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Libellé *">
          <TextInput
            style={styles.input}
            value={lib}
            onChangeText={setLib}
            placeholder="Ex: Loyer, Courses…"
            placeholderTextColor={colors.textSecondary}
            autoFocus={!isEditing}
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
          style={[
            styles.saveBtn,
            mode === 'revenu' && !isEditing ? styles.saveBtnGreen : styles.saveBtnViolet,
          ]}
          onPress={save}
        >
          <Text style={styles.saveBtnText}>
            {isEditing
              ? '✏️ Enregistrer les modifications'
              : mode === 'depense'
              ? '💾 Enregistrer dépense'
              : '💾 Enregistrer revenu'}
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
  sheetTitle:  { color: colors.text, fontSize: 16, fontWeight: '800', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0 },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.button,
    padding: 3,
    gap: 3,
  },
  toggleBtn:         { flex: 1, paddingVertical: 10, borderRadius: radius.button - 2, alignItems: 'center' },
  toggleActiveDep:   { backgroundColor: colors.expense },
  toggleActiveRev:   { backgroundColor: '#16a34a' },
  toggleText:        { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  toggleTextActive:  { color: '#fff' },
  form:        { paddingHorizontal: spacing.page, gap: 12 },
  field:       { gap: 6 },
  fieldLabel:  { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
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
  catChevron:    { color: colors.textSecondary, fontSize: 18 },
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
  catOptionText:   { color: colors.text, fontSize: 15 },
  catCheck:        { color: colors.primary, fontSize: 16, fontWeight: '700' },
  saveBtn:         { paddingVertical: 14, borderRadius: radius.button, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  saveBtnViolet:   { backgroundColor: colors.primary },
  saveBtnGreen:    { backgroundColor: '#16a34a' },
  saveBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
