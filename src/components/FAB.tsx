import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

interface Props {
  onPress: () => void;
  color?: string;
  icon?: string;
}

export function FAB({ onPress, color = colors.primary, icon = '+' }: Props) {
  return (
    <Pressable
      style={[styles.fab, { backgroundColor: color }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.25)', radius: 28 }}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  icon: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
    marginTop: -2,
  },
});
