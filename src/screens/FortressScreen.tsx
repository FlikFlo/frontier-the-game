import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Bar } from '../components/Bar';
import { Panel } from '../components/Panel';
import { ResourceChip } from '../components/ResourceChip';
import { Screen } from '../components/Screen';
import { UnitPortrait } from '../components/UnitPortrait';
import { colors, glass, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { EXPEDITION_TEMPLATES } from '../data/expeditions';
import { xpToNext } from '../systems/leveling';
import type { CrystalKind } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

const CRYSTAL_NAME: Record<CrystalKind, string> = {
  virdite: 'Вирдит',
  aquirin: 'Аквирин',
  pyrite: 'Пирит',
  zephyrite: 'Зефирит',
  lucerite: 'Люцерит',
  nocrite: 'Нокрит',
  sanguit: 'Сангвит',
};

export function FortressScreen({ navigation }: ScreenProps<'Fortress'>) {
  const hero = useGame((s) => s.hero);
  const companion = useGame((s) => s.companion);
  const day = useGame((s) => s.day);
  const crystals = useGame((s) => s.crystals);
  const inventory = useGame((s) => s.inventory);
  const inventoryCapacity = useGame((s) => s.inventoryCapacity);
  const gold = useGame((s) => s.gold);
  const startExpedition = useGame((s) => s.startExpedition);
  const checkExpeditionCost = useGame((s) => s.checkExpeditionCost);
  const lastResult = useGame((s) => s.lastResult);
  const pendingLevelUps = useGame((s) => s.pendingLevelUps);
  const clearLevelUps = useGame((s) => s.clearLevelUps);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inventoryFill = inventory.reduce((s, x) => s + x.item.size, 0);

  const begin = (templateId: string) => {
    const res = startExpedition(templateId);
    if (!res.ok) {
      setErrorMsg(res.message);
      setTimeout(() => setErrorMsg(null), 2400);
      return;
    }
    navigation.navigate('ExpeditionMap');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <View>
            <Text style={[typography.label, { color: colors.textMuted }]}>КРЕПОСТЬ</Text>
            <Text style={typography.display}>Фронтир</Text>
          </View>
        </View>

        {/* Resource bar */}
        <View style={styles.resourceRow}>
          <ResourceChip kind="day" value={day} />
          <ResourceChip kind="gold" value={gold} emphasised />
          <ResourceChip kind="virdite" value={crystals.virdite ?? 0} emphasised />
          <ResourceChip kind="pack" value={inventoryFill} max={inventoryCapacity} />
        </View>

        {lastResult ? (
          <Panel variant={lastResult.outcome === 'victory' ? 'success' : 'danger'}>
            <Text style={[typography.body, { color: colors.text }]}>
              {lastResult.outcome === 'victory'
                ? `Вылазка успешна. Принесено предметов: ${lastResult.collectedCount}`
                : lastResult.outcome === 'defeat'
                  ? 'Герой побеждён. Рейдовый лут потерян.'
                  : 'Отступление. Часть добычи потеряна.'}
            </Text>
          </Panel>
        ) : null}

        {pendingLevelUps.length > 0 ? (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
            <Panel
              variant="gold"
              title={`Повышение  ${pendingLevelUps[0]!.fromLevel} → ${pendingLevelUps[pendingLevelUps.length - 1]!.toLevel}`}
            >
              <Text style={[typography.body, { color: colors.text, marginBottom: spacing.md }]}>
                +{pendingLevelUps.reduce((s, l) => s + l.hpGained, 0)} HP · +
                {pendingLevelUps.reduce((s, l) => s + l.epGained, 0)} EP ·{' '}
                {(() => {
                  const sums: Record<string, number> = {};
                  for (const l of pendingLevelUps) {
                    for (const [k, v] of Object.entries(l.statsGained)) {
                      sums[k] = (sums[k] ?? 0) + (v ?? 0);
                    }
                  }
                  return Object.entries(sums)
                    .map(([k, v]) => `+${v} ${k}`)
                    .join(', ');
                })()}
              </Text>
              <Button label="Принять" onPress={clearLevelUps} />
            </Panel>
          </Animated.View>
        ) : null}

        {/* Hero card with big portrait */}
        <Panel variant="primary" accentStripe>
          <View style={styles.heroRow}>
            <UnitPortrait sigil="hero" side="ally" size={96} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.heroTitleRow}>
                <Text style={[typography.h1, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {hero.name}
                </Text>
                <Text
                  style={[
                    typography.label,
                    { color: colors.accentBright, backgroundColor: colors.accentSoft },
                    styles.levelBadge,
                  ]}
                >
                  LVL {hero.level}
                </Text>
              </View>
              <View style={{ height: spacing.sm }} />
              <Bar value={hero.hpMax} max={hero.hpMax} color={colors.hp} label="Здоровье" />
              <View style={{ height: spacing.xs }} />
              <Bar value={hero.epMax} max={hero.epMax} color={colors.ep} label="Энергия" />
              <View style={{ height: spacing.xs }} />
              <Bar
                value={hero.xp}
                max={xpToNext(hero.level)}
                color={colors.xp}
                label="Опыт"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <Stat label="АТК" value={hero.stats.attack} />
            <Stat label="МАГ" value={hero.stats.magic} />
            <Stat label="ЗАЩ" value={hero.stats.defense} />
            <Stat label="СКР" value={hero.stats.speed} />
          </View>
        </Panel>

        {/* Companion */}
        {companion ? (
          <Panel>
            <View style={styles.heroRow}>
              <UnitPortrait
                sigil={`companion_${companion.role}`}
                side="ally"
                size={72}
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={styles.heroTitleRow}>
                  <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
                    {companion.name}
                  </Text>
                  <Text
                    style={[
                      typography.label,
                      { color: colors.textMuted, backgroundColor: 'rgba(255,255,255,0.06)' },
                      styles.levelBadge,
                    ]}
                  >
                    {companion.role.toUpperCase()}
                  </Text>
                </View>
                <View style={{ height: spacing.sm }} />
                <Bar value={companion.hpMax} max={companion.hpMax} color={colors.hp} />
              </View>
            </View>
          </Panel>
        ) : null}

        {/* Expeditions — visual cards */}
        <View style={styles.sectionLabelRow}>
          <Text style={[typography.label, { color: colors.textMuted }]}>ВЫЛАЗКИ</Text>
        </View>
        {Object.values(EXPEDITION_TEMPLATES).map((tpl) => {
          const costEntries = Object.entries(tpl.crystalCost).filter(
            ([, v]) => (v ?? 0) > 0,
          ) as [CrystalKind, number][];
          const check = checkExpeditionCost(tpl.id);
          const affordable = check.ok;
          return (
            <ExpeditionCard
              key={tpl.id}
              name={tpl.name}
              description={tpl.description ?? ''}
              travelDays={tpl.travelDays}
              power={tpl.recommendedPower}
              portal={tpl.portal}
              costEntries={costEntries.map(([k, n]) => ({
                kind: k,
                have: crystals[k] ?? 0,
                need: n,
                name: CRYSTAL_NAME[k],
              }))}
              affordable={affordable}
              onPress={() => begin(tpl.id)}
            />
          );
        })}
        {errorMsg ? (
          <Animated.Text
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(200)}
            style={[typography.caption, { color: colors.danger, textAlign: 'center' }]}
          >
            {errorMsg}
          </Animated.Text>
        ) : null}

        {/* Navigation tiles */}
        <View style={styles.sectionLabelRow}>
          <Text style={[typography.label, { color: colors.textMuted }]}>УПРАВЛЕНИЕ</Text>
        </View>
        <View style={styles.tileGrid}>
          <NavTile
            label="Крепость"
            subtitle="Комнаты и апгрейды"
            onPress={() => navigation.navigate('FortressManagement')}
          />
          <NavTile
            label="Инвентарь"
            subtitle="Снаряжение и Зиры"
            onPress={() => navigation.navigate('Inventory')}
          />
          <NavTile
            label="Мастерская"
            subtitle="Алхимия и Зиры"
            onPress={() => navigation.navigate('Crafting')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={[typography.label, { color: colors.textDim }]}>{label}</Text>
      <Text style={[typography.h2, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function ExpeditionCard({
  name,
  description,
  travelDays,
  power,
  portal,
  costEntries,
  affordable,
  onPress,
}: {
  name: string;
  description: string;
  travelDays: number;
  power: number;
  portal: boolean;
  costEntries: { kind: string; have: number; need: number; name: string }[];
  affordable: boolean;
  onPress: () => void;
}) {
  const accent = portal ? colors.earth : colors.primary;
  return (
    <Pressable
      onPress={affordable ? onPress : undefined}
      style={({ pressed }) => [
        styles.expeditionCard,
        glass.card,
        {
          borderColor: portal ? 'rgba(132,204,22,0.35)' : 'rgba(255,255,255,0.09)',
          opacity: !affordable ? 0.65 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={
          portal
            ? ['rgba(132,204,22,0.2)', 'rgba(132,204,22,0.0)']
            : ['rgba(167,139,250,0.18)', 'rgba(167,139,250,0.0)']
        }
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.expeditionHeader}>
        <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>{name}</Text>
        {portal ? (
          <Text
            style={[
              typography.label,
              {
                color: colors.earth,
                backgroundColor: 'rgba(132,204,22,0.12)',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: radii.sm,
              },
            ]}
          >
            ПОРТАЛ
          </Text>
        ) : null}
      </View>
      {description ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
          {description}
        </Text>
      ) : null}
      <View style={styles.expeditionMeta}>
        <Text style={[typography.caption, { color: colors.textDim }]}>
          Дней: {travelDays}  ·  Сила: {power}
        </Text>
        {costEntries.map((c) => (
          <Text
            key={c.kind}
            style={[
              typography.caption,
              { color: c.have >= c.need ? colors.earth : colors.danger },
            ]}
          >
            {c.name}: {c.have}/{c.need}
          </Text>
        ))}
      </View>
      <View style={{ marginTop: spacing.sm }}>
        <Button
          label={affordable ? 'Отправиться' : 'Недостаточно кристаллов'}
          variant={portal ? 'primary' : 'gold'}
          disabled={!affordable}
          onPress={onPress}
        />
      </View>
    </Pressable>
  );
}

function NavTile({
  label,
  subtitle,
  onPress,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        glass.card,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[typography.h3, { color: colors.text }]}>{label}</Text>
      {subtitle ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  resourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionLabelRow: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  expeditionCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  expeditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expeditionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    padding: spacing.md,
    borderRadius: radii.md,
    minHeight: 70,
    justifyContent: 'center',
  },
});
