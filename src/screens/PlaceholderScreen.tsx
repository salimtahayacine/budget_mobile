import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function PlaceholderScreen({ title, emoji }: { title: string; emoji: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Bientôt disponible</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.page },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textSecondary, marginTop: 6 },
});
