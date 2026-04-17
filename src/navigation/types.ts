import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Fortress: undefined;
  Inventory: undefined;
  Crafting: undefined;
  ExpeditionMap: undefined;
  Combat: { nodeId: string };
  NodeResolve: { nodeId: string };
  RunResult: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
