import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddTransactionSheet } from '../components/AddTransactionSheet';
import { FAB } from '../components/FAB';
import { MonthNavigator } from '../components/MonthNavigator';
import { TransactionRow } from '../components/TransactionRow';
import { selectMonthTxs, useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import { Transaction } from '../types';

type Tab = 'toutes' | 'chaabi' | 'depenses' | 'revenus' | 'manuelles';

const TABS: { key: Tab; label: string }[] = [
  { key: 'toutes',    label: 'Toutes'    },
  { key: 'chaabi',    label: 'Chaabi'    },
  { key: 'depenses',  label: 'Dépenses'  },
  { key: 'revenus',   label: 'Revenus'   },
  { key: 'manuelles', label: 'Manuelles' },
];

function filterTxs(txs: Transaction[], tab: Tab): Transaction[] {
  switch (tab) {
    case 'chaabi':    return txs.filter((t) => t.source === 'chaabi');
    case 'depenses':  return txs.filter((t) => t.debit > 0);
    case 'revenus':   return txs.filter((t) => t.credit > 0);
    case 'manuelles': return txs.filter((t) => t.source === 'manual');
    default:          return txs;
  }
}

function sortTxs(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => {
    const p = (dmy: string) => {
      const [d, m, y] = dmy.split('/');
      return Number(y) * 10000 + Number(m) * 100 + Number(d);
    };
    return p(b.date) - p(a.date);
  });
}

export function TransactionsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('toutes');
  const [sheetOpen, setSheetOpen] = useState(false);

  const allTxs      = useStore(selectMonthTxs);
  const deleteManTx = useStore((s) => s.deleteManualTx);

  const filtered = sortTxs(filterTxs(allTxs, activeTab));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🧾 Transactions</Text>
      </View>

      <MonthNavigator />

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const count = filterTxs(allTxs, tab.key).length;
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            onDelete={item.source === 'manual' ? deleteManTx : undefined}
          />
        )}
        ListEmptyComponent={<Empty />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => setSheetOpen(true)} color={colors.primary} />

      <AddTransactionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyText}>Aucune transaction ce mois-ci</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.page, paddingVertical: 14 },
  title:  { color: colors.text, fontSize: 20, fontWeight: '800' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 5,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.primaryLight },
  badge: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeActive: { backgroundColor: 'rgba(124,111,255,0.25)' },
  badgeText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },

  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
});
