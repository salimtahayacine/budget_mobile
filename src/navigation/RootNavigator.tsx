import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DashboardScreen }    from '../screens/DashboardScreen';
import { RevenusScreen }      from '../screens/RevenusScreen';
import { SettingsScreen }     from '../screens/SettingsScreen';
import { SouhaitScreen }      from '../screens/SouhaitScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard',    emoji: '🏠', component: DashboardScreen    },
  { name: 'Transactions', emoji: '🧾', component: TransactionsScreen  },
  { name: 'Souhaits',     emoji: '✨', component: SouhaitScreen       },
  { name: 'Revenus',      emoji: '💰', component: RevenusScreen       },
  { name: 'Réglages',     emoji: '⚙️', component: SettingsScreen      },
] as const;

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor:   colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      {TABS.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{t.emoji}</Text>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
