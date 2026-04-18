import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Bar } from '../components/Bar';
import { colors, glass, layout, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { tileAt, walkableNeighbors } from '../systems/tileExpedition';
import { getExpeditionTemplate } from '../data/expeditions';
import { getEnemyTemplate } from '../data/enemies';
import { getItemTemplate } from '../data/items';
import type { Tile, TileType } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

const TYPE_GLYPH: Record<TileType, string> = {
  empty: '·',
  combat: '⚔',
  elite: '☠',
  boss: '♛',
  treasure: '✦',
  event: '?',
  rest: '♨',
  extraction: '⇪',
  cartographer: '◈',
  portal: '◉',
  impassable: '▲',
};

const TYPE_COLOR: Record<TileType, string> = {
  empty: colors.textDim,
  combat: colors.danger,
  elite: '#fb923c',
  boss: '#f43f5e',
  treasure: colors.accent,
  event: '#a7d7ff',
  rest: colors.success,
  extraction: colors.accentBright,
  cartographer: '#c4b4ff',
  portal: colors.text,
  impassable: 'rgba(255,255,255,0.15)',
};

const TYPE_LABEL: Record<TileType, string> = {
  empty: 'Пустая клетка',
  combat: 'Стычка',
  elite: 'Элитный отряд',
  boss: 'Логово босса',
  treasure: 'Сокровище',
  event: 'Событие',
  rest: 'Привал',
  extraction: 'Точка извлечения',
  cartographer: 'Картограф',
  portal: 'Врата портала',
  impassable: 'Непроходимо',
};

function safeItemName(id: string): string {
  try {
    return getItemTemplate(id).name;
  } catch {
    return id;
  }
}

const TYPE_BG: Record<TileType, readonly [string, string]> = {
  empty: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'],
  combat: ['rgba(248,113,113,0.18)', 'rgba(248,113,113,0.04)'],
  elite: ['rgba(251,146,60,0.20)', 'rgba(251,146,60,0.04)'],
  boss: ['rgba(244,63,94,0.28)', 'rgba(244,63,94,0.06)'],
  treasure: ['rgba(228,191,90,0.22)', 'rgba(228,191,90,0.04)'],
  event: ['rgba(167,215,255,0.18)', 'rgba(167,215,255,0.04)'],
  rest: ['rgba(34,197,94,0.18)', 'rgba(34,197,94,0.04)'],
  extraction: ['rgba(255,216,121,0.30)', 'rgba(255,216,121,0.05)'],
  cartographer: ['rgba(196,180,255,0.22)', 'rgba(196,180,255,0.04)'],
  portal: ['rgba(167,139,250,0.30)', 'rgba(167,139,250,0.05)'],
  impassable: ['rgba(40,40,55,0.6)', 'rgba(20,20,30,0.6)'],
};

export function ExpeditionMapScreen({ navigation }: ScreenProps<'ExpeditionMap'>) {
  const run = useGame((s) => s.currentRun);
  const moveToTile = useGame((s) => s.moveToTile);
  const scoutFromCurrent = useGame((s) => s.scoutFromCurrent);
  const triggerCartographer = useGame((s) => s.triggerCartographer);
  const clearTileContent = useGame((s) => s.clearTileContent);
  const stashRaidLoot = useGame((s) => s.stashRaidLoot);
  const extractRunFailed = useGame((s) => s.extractRunFailed);

  const [flash, setFlash] = useState<string | null>(null);
  const [lore, setLore] = useState<string | null>(null);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const flashMessage = (text: string) => {
    setFlash(text);
    setTimeout(() => setFlash(null), 1600);
  };
  const showLore = (text: string) => {
    setLore(text);
    // Stays up until dismissed.
  };

  if (!run || !run.grid) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.text }]}>Нет активной вылазки.</Text>
        <View style={{ height: spacing.md }} />
        <Button label="В крепость" onPress={() => navigation.navigate('Fortress')} />
      </Screen>
    );
  }

  const template = getExpeditionTemplate(run.templateId);
  const grid = run.grid;
  const current = tileAt(grid, run.currentTileId!);
  const adjacentIds = useMemo(() => {
    if (!current) return new Set<string>();
    return new Set(walkableNeighbors(grid, current).map((t) => t.id));
  }, [grid, current]);

  const handleTilePress = (tile: Tile) => {
    if (!current) return;
    if (tile.id === current.id) {
      // Tapping current tile: show details if scouted, do nothing otherwise.
      setHoveredTileId(tile.id);
      return;
    }
    // First tap on a non-adjacent revealed tile = inspect it (intel panel).
    // Second tap = try to move.
    if (!adjacentIds.has(tile.id)) {
      if (tile.revealed) {
        setHoveredTileId(tile.id);
      } else {
        flashMessage('Клетка ещё в тумане — разведай.');
      }
      return;
    }
    if (!tile.revealed) {
      flashMessage('Клетка ещё в тумане — разведай.');
      return;
    }
    // Tap on a revealed adjacent tile: move + resolve.
    const r = moveToTile(tile.id);
    if (!r.ok) {
      flashMessage(r.message);
      return;
    }
    setHoveredTileId(null);
    if (r.fragment) showLore(r.fragment);
    if (tile.type === 'combat' || tile.type === 'elite' || tile.type === 'boss') {
      navigation.navigate('Combat', { nodeId: tile.id });
    } else if (tile.type === 'treasure' || tile.type === 'event' || tile.type === 'extraction') {
      navigation.navigate('NodeResolve', { nodeId: tile.id });
    } else if (tile.type === 'cartographer') {
      triggerCartographer(tile.id);
      clearTileContent(tile.id);
      flashMessage('Картограф открыл соседние земли.');
    } else if (tile.type === 'rest') {
      clearTileContent(tile.id);
      flashMessage('Привал. Дух героя восстановлен.');
    }
  };

  const flee = () => {
    extractRunFailed('flee');
    navigation.navigate('Fortress');
  };

  const cellSize = Math.min(
    Math.floor((layout.maxContentWidth - spacing.lg * 2) / grid.width) - spacing.xs,
    72,
  );

  // Build an integer index for rendering rows.
  const rows: Tile[][] = [];
  for (let y = 0; y < grid.height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < grid.width; x++) {
      row.push(grid.tiles[y * grid.width + x]!);
    }
    rows.push(row);
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>ВЫЛАЗКА</Text>
          <Text style={[typography.h1, { color: colors.text }]}>{template.name}</Text>
        </View>
      </View>

      <View style={[styles.headerCard, glass.card]}>
        <View style={styles.statsRow}>
          <Stat label="ПРОВИЗИЯ" value={`${run.provisions}`} />
          <Stat label="СОБРАНО" value={`${run.raidLoot.length}`} />
          <Stat label="ШАГОВ" value={`${grid.tiles.filter((t) => t.explored).length - 1}`} />
        </View>
        <View style={{ height: spacing.sm }} />
        <Bar
          value={run.portalInstability}
          max={Math.max(grid.tiles.length, 1)}
          color={colors.warn}
          label="Нестабильность портала"
        />
      </View>

      {lore ? (
        <Pressable onPress={() => setLore(null)} style={styles.loreWrap}>
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[styles.loreCard, glass.strong]}
          >
            <Text style={[typography.label, { color: colors.textMuted }]}>ПО ДОРОГЕ</Text>
            <Text style={[typography.body, { color: colors.text, marginTop: spacing.xs, fontStyle: 'italic' }]}>
              {lore}
            </Text>
            <Text style={[typography.caption, { color: colors.textDim, marginTop: spacing.sm, textAlign: 'right' }]}>
              Нажми, чтобы закрыть
            </Text>
          </Animated.View>
        </Pressable>
      ) : null}

      <View style={styles.gridWrap}>
        {rows.map((row, y) => (
          <View key={`row-${y}`} style={styles.row}>
            {row.map((t) => (
              <TileCell
                key={t.id}
                tile={t}
                size={cellSize}
                isCurrent={t.id === current?.id}
                isAdjacent={adjacentIds.has(t.id)}
                isHovered={hoveredTileId === t.id}
                onPress={() => handleTilePress(t)}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Intel panel for the currently-inspected / current tile */}
      {(() => {
        const inspectId = hoveredTileId ?? current?.id;
        const t = inspectId ? grid.tiles.find((x) => x.id === inspectId) : undefined;
        if (!t || !t.revealed) return null;
        return (
          <View style={[styles.intelCard, glass.card]}>
            <View style={styles.intelHeader}>
              <Text style={[typography.label, { color: colors.textMuted }]}>
                {t.id === current?.id ? 'ТЕКУЩАЯ КЛЕТКА' : 'ОСМОТР'}
              </Text>
              <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                {t.content?.poiName ?? t.label ?? TYPE_LABEL[t.type]}
              </Text>
            </View>
            {t.content?.poiFlavor && (t.scouted || t.explored) ? (
              <Text style={[typography.caption, { color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }]}>
                {t.content.poiFlavor}
              </Text>
            ) : null}
            {/* Scouted intel: show actual enemies/loot/reward */}
            {t.scouted && !t.explored ? (
              <View style={{ marginTop: spacing.xs }}>
                {t.content?.enemyTemplateIds ? (
                  <Text style={[typography.caption, { color: colors.danger }]}>
                    ⚔ {t.content.enemyTemplateIds.map((id) => {
                      try { return getEnemyTemplate(id).name; } catch { return id; }
                    }).join(', ')}
                  </Text>
                ) : null}
                {t.content?.uniqueRewardTemplateId ? (
                  <Text style={[typography.caption, { color: colors.accentBright, marginTop: 2 }]}>
                    ✦ Особая награда: {safeItemName(t.content.uniqueRewardTemplateId)}
                  </Text>
                ) : null}
                {t.content?.lootTableId && !t.content?.uniqueRewardTemplateId ? (
                  <Text style={[typography.caption, { color: colors.accent, marginTop: 2 }]}>
                    ✦ Сокровище
                  </Text>
                ) : null}
                {t.content?.eventId ? (
                  <Text style={[typography.caption, { color: colors.primary, marginTop: 2 }]}>
                    ? Событие
                  </Text>
                ) : null}
              </View>
            ) : null}
            {!t.scouted && !t.explored ? (
              <Text style={[typography.caption, { color: colors.textDim, marginTop: spacing.xs }]}>
                Разведка откроет содержимое.
              </Text>
            ) : null}
          </View>
        );
      })()}

      <View style={styles.legendRow}>
        <Legend glyph="◉" color={colors.text} label="Здесь" />
        <Legend glyph="·" color={colors.textMuted} label="Идти" />
        <Legend glyph="?" color={colors.textDim} label="Туман" />
      </View>

      {flash ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={styles.flash}
        >
          <Text style={[typography.caption, { color: colors.text }]}>{flash}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.controlsRow}>
        <Button
          label={`Разведать (−1 провизия, ост. ${run.provisions})`}
          variant="secondary"
          disabled={run.provisions <= 0}
          onPress={() => {
            const r = scoutFromCurrent();
            flashMessage(r.message);
          }}
          style={{ flex: 1 }}
          compact
        />
      </View>
      <Button
        label="Отступить (потеря рейдовой добычи)"
        variant="danger"
        onPress={flee}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[typography.label, { color: colors.textDim }]}>{label}</Text>
      <Text style={[typography.h2, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Legend({ glyph, color, label }: { glyph: string; color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <Text style={[typography.body, { color, fontWeight: '700' }]}>{glyph}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function TileCell({
  tile,
  size,
  isCurrent,
  isAdjacent,
  isHovered,
  onPress,
}: {
  tile: Tile;
  size: number;
  isCurrent: boolean;
  isAdjacent: boolean;
  isHovered: boolean;
  onPress: () => void;
}) {
  const isFog = !tile.revealed;
  const isImpassable = tile.type === 'impassable';
  const isLandmark = !!tile.content?.poiLandmark;
  const poiIcon = tile.content?.poiIcon;

  // Even through fog, landmark POIs reveal as a dim silhouette — they pull
  // the player toward them across the map.
  const showLandmarkSilhouette = isFog && isLandmark;

  const glyph = isFog
    ? showLandmarkSilhouette
      ? poiIcon ?? '◈'
      : '?'
    : isCurrent
      ? '◉'
      : poiIcon ?? TYPE_GLYPH[tile.type];
  const color = isFog
    ? showLandmarkSilhouette
      ? 'rgba(228,191,90,0.45)'
      : colors.textDim
    : isCurrent
      ? colors.text
      : TYPE_COLOR[tile.type];
  const gradient = isFog
    ? showLandmarkSilhouette
      ? (['rgba(228,191,90,0.08)', 'rgba(228,191,90,0.01)'] as const)
      : (['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.005)'] as const)
    : tile.explored && tile.type === 'empty'
      ? (['rgba(255,255,255,0.025)', 'rgba(255,255,255,0.005)'] as const)
      : TYPE_BG[tile.type];

  const border = isCurrent
    ? colors.accentBright
    : isHovered
      ? colors.accent
      : isAdjacent && tile.revealed && !isImpassable
        ? colors.primary
        : showLandmarkSilhouette
          ? 'rgba(228,191,90,0.35)'
          : 'rgba(255,255,255,0.06)';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
        Platform.OS === 'web' && isCurrent
          ? ({ boxShadow: '0 0 0 2px rgba(255,216,121,0.35), 0 6px 18px rgba(0,0,0,0.4)' } as any)
          : null,
      ]}
    >
      <LinearGradient
        colors={gradient as any}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={[styles.glyph, { color, fontSize: size * 0.4 }]}>{glyph}</Text>
      {/* Scouted details: subtle dot in corner so player knows they have intel. */}
      {tile.scouted && !tile.explored ? (
        <View style={styles.scoutedMark} />
      ) : null}
      {/* Explored empty tile: darker overlay */}
      {tile.explored && tile.type === 'empty' && !isCurrent ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(0,0,0,0.15)' },
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cell: {
    borderRadius: radii.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '800',
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flash: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loreWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 50,
    backgroundColor: 'rgba(5, 3, 12, 0.7)',
  },
  loreCard: {
    maxWidth: 420,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  intelCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    marginVertical: spacing.sm,
  },
  intelHeader: {
    flexDirection: 'column',
    gap: 2,
  },
  scoutedMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBright,
  },
});
