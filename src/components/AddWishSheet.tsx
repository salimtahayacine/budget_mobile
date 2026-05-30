import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import { Priority, WishItem } from '../types';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible:      boolean;
  onClose:      () => void;
  editingWish?: WishItem; // mode édition si fourni
}

const PRIOS: { key: Priority; label: string; color: string }[] = [
  { key: 'urgent', label: '🔴 Urgente',      color: colors.expense  },
  { key: 'normal', label: '🟡 Normale',      color: colors.warning  },
  { key: 'envie',  label: '🟢 Simple envie', color: colors.income   },
];

export function AddWishSheet({ visible, onClose, editingWish }: Props) {
  const addWish    = useStore((s) => s.addWish);
  const updateWish = useStore((s) => s.updateWish);

  const isEditing = !!editingWish;

  const [name,  setName]  = useState('');
  const [price, setPrice] = useState('');
  const [prio,  setPrio]  = useState<Priority>('normal');
  const [note,  setNote]  = useState('');

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (visible && editingWish) {
      setName(editingWish.name);
      setPrice(String(editingWish.price));
      setPrio(editingWish.prio);
      setNote(editingWish.note ?? '');
    } else if (visible && !editingWish) {
      setName(''); setPrice(''); setPrio('normal'); setNote('');
    }
  }, [visible, editingWish]);

  const reset = () => { setName(''); setPrice(''); setPrio('normal'); setNote(''); };

  const save = () => {
    const amt = parseFloat(price.replace(',', '.'));
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    if (isEditing && editingWish) {
      updateWish(editingWish.id, { name: name.trim(), price: amt, prio, note: note.trim() });
    } else {
      addWish({ name: name.trim(), price: amt, prio, note: note.trim() });
    }
    reset();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={() => { reset(); onClose(); }}>
      <Text style={styles.title}>
        {isEditing ? '✏️ Modifier le souhait' : '✨ Nouveau souhait'}
      </Text>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Article *">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: AirPods Pro, Voyage Marrakech…"
            placeholderTextColor={colors.textSecondary}
            autoFocus={!isEditing}
          />
        </Field>

        <Field label="Prix estimé (DH) *">
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Priorité">
          <View style={styles.prioRow}>
            {PRIOS.map((p) => (
              <Pressable
                key={p.key}
                style={[
                  styles.prioBtn,
                  { borderColor: p.color },
                  prio === p.key && { backgroundColor: p.color + '22' },
                ]}
                onPress={() => setPrio(p.key)}
              >
                <Text style={[styles.prioBtnText, prio === p.key && { color: p.color }]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Note (optionnel)">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={note}
            onChangeText={setNote}
            placeholder="Raison, lien, contexte…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </Field>

        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>
            {isEditing ? '✏️ Enregistrer les modifications' : '💾 Enregistrer le souhait'}
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
  textarea:    { minHeight: 80, textAlignVertical: 'top' },
  prioRow:     { flexDirection: 'row', gap: 8 },
  prioBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.button,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  prioBtnText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  saveBtn:     { backgroundColor: colors.warning, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
