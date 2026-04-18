import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Bar } from '../components/Bar';
import { colors, glass, layout, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { adjacentNodes } from '../systems/overworld';
import { getExpeditionTemplate } from '../data/expeditions';
import { getEnemyTemplate } from '../data/enemies';
import { getItemTemplate } from '../data/items';
import { MineScene, EmeraldReachScene } from '../art/scenes';
import type { MapEdge, MapNode, OverworldMap, TileType } from '../types/domain';
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
  portal: '⌂',
  impassable: '▲',
};

const TYPE_COLOR: Record<TileType, string> = {
  empty: 'rgba(255,255,255,0.5)',
  combat: '#f87171',
  elite: '#fb923c',
  boss: '#f43f5e',
  treasure: '#e4bf5a',
  event: '#a7d7ff',
  rest: '#4ade80',
  extraction: '#ffd879',
  cartographer: '#c4b4ff',
  portal: '#ffffff',
  impassable: 'rgba(255,255,255,0.2)',
};

const TYPE_LABEL: Record<TileType, string> = {
  empty: 'Пустая точка',
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

export function ExpeditionMapScreen({ navigation }: ScreenProps<'ExpeditionMap'>) {
  const run = useGame((s) => s.currentRun);
  const travelToMapNode = useGame((s) => s.travelToMapNode);
  const scoutMapFromCurrent = useGame((s) => s.scoutMapFromCurrent);
  const triggerMapCartographer = useGame((s) => s.triggerMapCartographer);
  const clearMapNodeContent = useGame((s) => s.clearMapNodeContent);
  const extractRunFailed = useGame((s) => s.extractRunFailed);

  const [flash, setFlash] = useState<string | null>(null);
  const [lore, setLore] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });

  const flashMessage = (text: string) => {
    setFlash(text);
    setTimeout(() => setFlash(null), 1600);
  };

  if (!run || !run.map || !run.currentMapNodeId) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.text }]}>Нет активной вылазки.</Text>
        <View style={{ height: spacing.md }} />
        <Button label="В крепость" onPress={() => navigation.navigate('Fortress')} />
      </Screen>
    );
  }

  const template = getExpeditionTemplate(run.templateId);
  const map: OverworldMap = run.map;
  const currentId = run.currentMapNodeId;
  const current = map.nodes.find((n) => n.id === currentId)!;
  const adjIds = useMemo(
    () => new Set(adjacentNodes(map, currentId).map((n) => n.id)),
    [map, currentId],
  );

  const inspectedId = selectedId ?? currentId;
  const inspected = map.nodes.find((n) => n.id === inspectedId);

  const onNodeTap = (n: MapNode) => {
    if (n.id === currentId) {
      setSelectedId(n.id);
      return;
    }
    // If player taps a non-adjacent node or a fogged node, just inspect it.
    if (!adjIds.has(n.id) || !n.discovered) {
      if (n.discovered) setSelectedId(n.id);
      else flashMessage('Эта область ещё не раскрыта.');
      return;
    }
    // Adjacent + discovered: travel.
    const r = travelToMapNode(n.id);
    if (!r.ok) {
      flashMessage(r.message);
      return;
    }
    setSelectedId(null);
    if (r.fragment) setLore(r.fragment);
    if (n.type === 'combat' || n.type === 'elite' || n.type === 'boss') {
      navigation.navigate('Combat', { nodeId: n.id });
    } else if (n.type === 'treasure' || n.type === 'event' || n.type === 'extraction') {
      navigation.navigate('NodeResolve', { nodeId: n.id });
    } else if (n.type === 'cartographer') {
      triggerMapCartographer(n.id);
      clearMapNodeContent(n.id);
      flashMessage('Картограф раскрыл окрестные тропы.');
    } else if (n.type === 'rest') {
      clearMapNodeContent(n.id);
      flashMessage('Привал. Герой переводит дыхание.');
    }
  };

  const flee = () => {
    extractRunFailed('flee');
    navigation.navigate('Fortress');
  };

  // Coordinate helpers — SVG viewBox → on-screen px.
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewSize({ width, height });
  };
  const scaleX = viewSize.width / map.viewWidth;
  const scaleY = viewSize.height / map.viewHeight;
  const scale = Math.min(scaleX || 0, scaleY || 0);
  const offsetX = (viewSize.width - map.viewWidth * scale) / 2;
  const offsetY = (viewSize.height - map.viewHeight * scale) / 2;
  const toScreen = (x: number, y: number) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  });

  // Hero sprite position (animated).
  const heroX = useSharedValue(0);
  const heroY = useSharedValue(0);
  const heroReady = viewSize.width > 0;
  if (heroReady) {
    const p = toScreen(current.x, current.y);
    // Animate to current tile's position (viewBox might change on resize).
    heroX.value = withTiming(p.x, { duration: 520 });
    heroY.value = withTiming(p.y, { duration: 520 });
  }
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: heroX.value - 14 },
      { translateY: heroY.value - 26 },
    ],
  }));

  return (
    <Screen padded={false}>
      {/* Top info strip */}
      <View style={styles.topInfo}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>ВЫЛАЗКА</Text>
          <Text style={[typography.h2, { color: colors.text }]}>{template.name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>ПРОВИЗИЯ</Text>
          <Text style={[typography.h2, { color: colors.accentBright }]}>{run.provisions}</Text>
        </View>
      </View>

      <View style={styles.instabilityWrap}>
        <Bar
          value={run.portalInstability}
          max={Math.max(map.nodes.length, 1)}
          color={colors.warn}
          label="Нестабильность"
          compact
        />
      </View>

      {/* The illustrated scene */}
      <View style={styles.stage} onLayout={onLayout}>
        {map.sceneKind === 'mine' ? <MineScene /> : <EmeraldReachScene />}

        {/* Edges and nodes drawn inside an absolute SVG overlay */}
        {viewSize.width > 0 ? (
          <Svg
            width={viewSize.width}
            height={viewSize.height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {/* Edges between discovered or adjacent nodes */}
            {map.edges.map((e) => {
              const a = map.nodes.find((n) => n.id === e.from)!;
              const b = map.nodes.find((n) => n.id === e.to)!;
              if (!a || !b) return null;
              const anyDiscovered = a.discovered && b.discovered;
              if (!anyDiscovered) return null;
              const pa = toScreen(a.x, a.y);
              const pb = toScreen(b.x, b.y);
              const fromCurrent = a.id === currentId || b.id === currentId;
              return (
                <Line
                  key={e.id}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={fromCurrent ? 'rgba(228,191,90,0.6)' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={fromCurrent ? 2 : 1.5}
                  strokeDasharray={fromCurrent ? undefined : '4 4'}
                />
              );
            })}
          </Svg>
        ) : null}

        {/* Node hotspots rendered as absolute Pressables overlaying the scene */}
        {viewSize.width > 0
          ? map.nodes.map((n) => {
              const p = toScreen(n.x, n.y);
              const isCurrent = n.id === currentId;
              const canTravel = adjIds.has(n.id) && n.discovered;
              const isFogged = !n.discovered && !(n.content?.poiLandmark);
              if (isFogged) return null;
              // Landmark POIs glow through fog as silhouettes.
              const isLandmarkFog = !n.discovered && n.content?.poiLandmark;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => onNodeTap(n)}
                  style={[
                    styles.nodeHotspot,
                    {
                      left: p.x - 24,
                      top: p.y - 24,
                      opacity: isLandmarkFog ? 0.55 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.nodeRing,
                      {
                        borderColor: isCurrent
                          ? colors.accentBright
                          : canTravel
                            ? colors.accent
                            : 'rgba(255,255,255,0.18)',
                        backgroundColor:
                          n.type === 'empty' || n.visited
                            ? 'rgba(10,10,15,0.55)'
                            : TYPE_COLOR[n.type].startsWith('#')
                              ? `${TYPE_COLOR[n.type]}22`
                              : 'rgba(10,10,15,0.55)',
                      },
                      Platform.OS === 'web' && canTravel
                        ? ({ boxShadow: '0 0 0 2px rgba(228,191,90,0.2), 0 4px 14px rgba(0,0,0,0.5)' } as any)
                        : null,
                      Platform.OS === 'web' && n.content?.poiLandmark
                        ? ({ boxShadow: '0 0 24px rgba(255,216,121,0.35)' } as any)
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.nodeGlyph,
                        { color: isLandmarkFog ? 'rgba(228,191,90,0.7)' : TYPE_COLOR[n.type] },
                      ]}
                    >
                      {n.content?.poiIcon ?? TYPE_GLYPH[n.type]}
                    </Text>
                  </View>
                  {n.content?.poiName && n.discovered ? (
                    <Text style={styles.nodeLabel} numberOfLines={1}>
                      {n.content.poiName}
                    </Text>
                  ) : null}
                  {n.scouted && !n.visited ? <View style={styles.scoutedDot} /> : null}
                </Pressable>
              );
            })
          : null}

        {/* Hero sprite — a glowing circle with a knight silhouette */}
        {heroReady ? (
          <Animated.View style={[styles.heroSprite, heroStyle]}>
            <Svg width={28} height={52} viewBox="0 0 28 52">
              <G>
                <Circle cx={14} cy={48} r={10} fill="rgba(228,191,90,0.25)" />
                <Path
                  d="M8,18 Q 14,12 20,18 L 20,32 Q 14,34 8,32 Z"
                  fill="#0a0613"
                  stroke="#e4bf5a"
                  strokeWidth={1.2}
                />
                <Path d="M12,4 L 16,4 L 16,16 L 12,16 Z" fill="#e4bf5a" />
                <Path d="M6,28 Q 14,32 22,28 L 24,46 L 4,46 Z" fill="#0a0613" stroke="#c69a42" strokeWidth={1.2} />
              </G>
            </Svg>
          </Animated.View>
        ) : null}
      </View>

      {/* Intel & controls */}
      <ScrollView style={styles.footer} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {inspected && inspected.discovered ? (
          <View style={[styles.intelCard, glass.card]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={[styles.nodeGlyphInline, { color: TYPE_COLOR[inspected.type] }]}>
                {inspected.content?.poiIcon ?? TYPE_GLYPH[inspected.type]}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label, { color: colors.textMuted }]}>
                  {inspected.id === currentId ? 'ЗДЕСЬ' : 'ОСМОТР'}
                </Text>
                <Text style={[typography.h3, { color: colors.text }]}>
                  {inspected.content?.poiName ?? inspected.label ?? TYPE_LABEL[inspected.type]}
                </Text>
              </View>
            </View>
            {inspected.content?.poiFlavor && (inspected.scouted || inspected.visited) ? (
              <Text
                style={[typography.caption, { color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm }]}
              >
                {inspected.content.poiFlavor}
              </Text>
            ) : null}
            {inspected.scouted && !inspected.visited ? (
              <View style={{ marginTop: spacing.xs }}>
                {inspected.content?.enemyTemplateIds ? (
                  <Text style={[typography.caption, { color: colors.danger }]}>
                    ⚔{' '}
                    {inspected.content.enemyTemplateIds
                      .map((id) => {
                        try {
                          return getEnemyTemplate(id).name;
                        } catch {
                          return id;
                        }
                      })
                      .join(', ')}
                  </Text>
                ) : null}
                {inspected.content?.uniqueRewardTemplateId ? (
                  <Text style={[typography.caption, { color: colors.accentBright, marginTop: 2 }]}>
                    ✦ Особая награда: {safeItemName(inspected.content.uniqueRewardTemplateId)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {!inspected.scouted && !inspected.visited ? (
              <Text style={[typography.caption, { color: colors.textDim, marginTop: spacing.xs }]}>
                Разведка откроет, что там.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.controlsRow}>
          <Button
            label={`Разведать (−1 пров.)`}
            variant="secondary"
            disabled={run.provisions <= 0}
            onPress={() => {
              const r = scoutMapFromCurrent();
              flashMessage(r.message);
            }}
            style={{ flex: 1 }}
            compact
          />
          <Button
            label="Отступить"
            variant="danger"
            onPress={flee}
            style={{ flex: 1 }}
            compact
          />
        </View>
      </ScrollView>

      {flash ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={styles.flashBanner}
        >
          <Text style={[typography.caption, { color: colors.text }]}>{flash}</Text>
        </Animated.View>
      ) : null}

      {lore ? (
        <Pressable onPress={() => setLore(null)} style={styles.loreWrap}>
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[styles.loreCard, glass.strong]}
          >
            <Text style={[typography.label, { color: colors.textMuted }]}>ПО ДОРОГЕ</Text>
            <Text
              style={[
                typography.body,
                { color: colors.text, marginTop: spacing.xs, fontStyle: 'italic' },
              ]}
            >
              {lore}
            </Text>
            <Text
              style={[typography.caption, { color: colors.textDim, marginTop: spacing.sm, textAlign: 'right' }]}
            >
              Нажми, чтобы закрыть
            </Text>
          </Animated.View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  instabilityWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  stage: {
    flex: 1,
    minHeight: 340,
    maxHeight: 460,
    overflow: 'hidden',
    backgroundColor: '#060510',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  nodeHotspot: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeGlyph: {
    fontSize: 18,
    fontWeight: '800',
  },
  nodeGlyphInline: {
    fontSize: 22,
    fontWeight: '800',
  },
  nodeLabel: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: 'rgba(10,8,20,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
    fontSize: 10,
    maxWidth: 120,
    textAlign: 'center',
  },
  scoutedDot: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBright,
  },
  heroSprite: {
    position: 'absolute',
    width: 28,
    height: 52,
    pointerEvents: 'none',
  },
  footer: {
    maxHeight: 260,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  intelCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flashBanner: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(5,3,12,0.8)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: layout.maxContentWidth - spacing.xl * 2,
  },
  loreWrap: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(5,3,12,0.7)',
    zIndex: 50,
  } as any,
  loreCard: {
    maxWidth: 420,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
});
