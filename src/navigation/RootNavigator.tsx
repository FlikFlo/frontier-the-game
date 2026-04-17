import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { FortressScreen } from '../screens/FortressScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ExpeditionMapScreen } from '../screens/ExpeditionMapScreen';
import { CombatScreen } from '../screens/CombatScreen';
import { NodeResolveScreen } from '../screens/NodeResolveScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName="Fortress"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="Fortress" component={FortressScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="ExpeditionMap" component={ExpeditionMapScreen} />
        <Stack.Screen name="Combat" component={CombatScreen} />
        <Stack.Screen name="NodeResolve" component={NodeResolveScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
