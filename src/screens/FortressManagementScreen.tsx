import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, glass, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { listFortressRooms, type FortressRoomId } from '../data/fortressRooms';
import { getItemTemplate } from '../data/items';
import { countByTemplate } from '../systems/crafting';
import {
  ForgeArt,
  InfirmaryArt,
  LibraryArt,
  PortalHallArt,
  StorageArt,
  WorkshopArt,
} from '../art/rooms';
import type { ScreenProps } from '../navigation/types';

const ROOM_ART: Record<FortressRoomId, React.FC<{ size?: number }>> = {
  portal_hall: PortalHallArt,
  infirmary: InfirmaryArt,
  workshop: WorkshopArt,
  storage: StorageArt,
  forge: ForgeArt,
  library: LibraryArt,
};

const ROOM_GRADIENT: Record<FortressRoomId, readonly [string, string]> = {
  portal_hall: ['rgba(167,139,250,0.22)', 'rgba(167,139,250,0.0)'],
  infirmary: ['rgba(248,113,113,0.18)', 'rgba(248,113,113,0.0)'],
  workshop: ['rgba(94,234,212,0.18)', 'rgba(94,234,212,0.0)'],
  storage: ['rgba(251,191,36,0.16)', 'rgba(251,191,36,0.0)'],
  forge: ['rgba(251,146,60,0.2)', 'rgba(251,146,60,0.0)'],
  library: ['rgba(124,58,237,0.2)', 'rgba(124,58,237,0.0)'],
};

export function FortressManagementScreen({ navigation }: ScreenProps<'FortressManagement'>) {
  const fortress = useGame((s) => s.fortress);
  const gold = useGame((s) => s.gold);
  const inventory = useGame((s) => s.inventory);
  const upgradeRoom = useGame((s) => s.upgradeRoom);

  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const flashMessage = (text: string, ok: boolean) => {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 1800);
  };

  const counts = countByTemplate(inventory);
  const rooms = listFortressRooms();

  return (
    <Screen>
      <View style={styles.topBar}>
        <Button
          label="←"
          variant="secondary"
          onPress={() => navigation.goBack()}
          compact
          style={{ paddingHorizontal: spacing.md }}
        />
        <Text style={[typography.h1, { marginLeft: spacing.md, flex: 1 }]}>Крепость</Text>
        <Text style={[typography.body, { color: colors.accentBright }]}>☼ {gold}</Text>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>
        Улучшай комнаты — они раскрывают новые возможности крепости.
      </Text>

      {flash ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.flash,
            {
              backgroundColor: flash.ok ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
              borderColor: flash.ok ? colors.success : colors.danger,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.text }]}>{flash.text}</Text>
        </Animated.View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {rooms.map((room) => {
          const level = fortress.rooms[room.id] ?? 0;
          const nextLevel = level + 1;
          const atMax = level >= room.maxLevel;
          const cost = atMax ? null : room.costForLevel(level);
          const canAfford =
            !atMax &&
            !!cost &&
            gold >= cost.gold &&
            Object.entries(cost.materials ?? {}).every(
              ([tpl, need]) => (counts[tpl] ?? 0) >= need,
            );
          const Art = ROOM_ART[room.id];
          return (
            <View key={room.id} style={[styles.card, glass.card]}>
              <LinearGradient
                colors={ROOM_GRADIENT[room.id] as any}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.cardRow}>
                <View style={styles.artFrame}>
                  <Art size={96} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
                      {room.name}
                    </Text>
                    <Text style={[typography.label, styles.levelPill]}>
                      {level === 0 ? 'НЕ ПОСТРОЕНА' : `LVL ${level}`}
                    </Text>
                  </View>
                  <Text
                    style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}
                    numberOfLines={3}
                  >
                    {room.description}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.accentBright, marginTop: spacing.sm }]}
                  >
                    {room.effectPerLevel(Math.max(level, 1))}
                  </Text>
                </View>
              </View>
              {atMax ? (
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textMuted,
                      marginTop: spacing.md,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Максимальный уровень.
                </Text>
              ) : cost ? (
                <>
                  <View style={styles.costRow}>
                    <Text style={[typography.label, { color: colors.textMuted }]}>
                      СТОИМОСТЬ УРОВНЯ {nextLevel}
                    </Text>
                  </View>
                  <View style={styles.costList}>
                    <Text
                      style={[
                        typography.caption,
                        { color: gold >= cost.gold ? colors.accentBright : colors.danger },
                      ]}
                    >
                      ☼ {cost.gold}
                    </Text>
                    {Object.entries(cost.materials ?? {}).map(([tpl, need]) => {
                      const have = counts[tpl] ?? 0;
                      const name = safeItemName(tpl);
                      return (
                        <Text
                          key={tpl}
                          style={[
                            typography.caption,
                            { color: have >= need ? colors.text : colors.danger },
                          ]}
                        >
                          {name}: {have}/{need}
                        </Text>
                      );
                    })}
                  </View>
                  <Button
                    label={level === 0 ? 'Построить' : 'Улучшить'}
                    variant={level === 0 ? 'primary' : 'gold'}
                    disabled={!canAfford}
                    onPress={() => {
                      const r = upgradeRoom(room.id);
                      flashMessage(r.message, r.ok);
                    }}
                    style={{ marginTop: spacing.md }}
                  />
                </>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function safeItemName(templateId: string): string {
  try {
    return getItemTemplate(templateId).name;
  } catch {
    return templateId;
  }
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  flash: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 24px rgba(0,0,0,0.35)' } as any)
      : null),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  artFrame: {
    width: 96,
    height: 96,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPill: {
    color: colors.accentBright,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  costRow: {
    marginTop: spacing.md,
  },
  costList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
});
