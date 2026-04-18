import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../components/Button';
import { Bar } from '../components/Bar';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { UnitPortrait } from '../components/UnitPortrait';
import { colors, radii, spacing, typography } from '../theme/colors';
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
          <Text style={typography.h1}>Крепость Фронтир</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>День {day}</Text>
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
              title={`Повышение · ${pendingLevelUps[0]!.fromLevel} → ${pendingLevelUps[pendingLevelUps.length - 1]!.toLevel}`}
            >
              <Text style={[typography.caption, { color: colors.text, marginBottom: spacing.sm }]}>
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
              <Button label="Отлично" onPress={clearLevelUps} />
            </Panel>
          </Animated.View>
        ) : null}

        {/* Hero card */}
        <Panel title={hero.name} badge={`УРОВЕНЬ ${hero.level}`}>
          <View style={styles.heroRow}>
            <UnitPortrait sigil="hero" side="ally" size={64} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Bar value={hero.hpMax} max={hero.hpMax} color={colors.hp} label="Здоровье" />
              <View style={{ height: spacing.xs }} />
              <Bar value={hero.epMax} max={hero.epMax} color={colors.ep} label="Энергия" />
              <View style={{ height: spacing.xs }} />
              <Bar value={hero.xp} max={xpToNext(hero.level)} color={colors.accent} label="Опыт" />
            </View>
          </View>
          <View style={{ height: spacing.sm }} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Атака {hero.stats.attack} · Магия {hero.stats.magic} · Защита {hero.stats.defense} · Скорость {hero.stats.speed}
          </Text>
        </Panel>

        {/* Companion card */}
        {companion ? (
          <Panel title={companion.name} badge={companion.role.toUpperCase()}>
            <View style={styles.heroRow}>
              <UnitPortrait sigil={`companion_${companion.role}`} side="ally" size={56} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Bar value={companion.hpMax} max={companion.hpMax} color={colors.hp} label="Здоровье" />
              </View>
            </View>
          </Panel>
        ) : null}

        {/* Stockpile */}
        <Panel title="Склад">
          <View style={styles.stockRow}>
            <Text style={[typography.body, { color: colors.accentBright }]}>☼ {gold}</Text>
            <Text style={[typography.body, { color: colors.earth }]}>
              ◆ Вирдит: {crystals.virdite ?? 0}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Инвентарь: {inventoryFill}/{inventoryCapacity}
          </Text>
        </Panel>

        {/* Expeditions */}
        <Panel title="Вылазки">
          {Object.values(EXPEDITION_TEMPLATES).map((tpl, idx, arr) => {
            const costEntries = Object.entries(tpl.crystalCost).filter(
              ([, v]) => (v ?? 0) > 0,
            ) as [CrystalKind, number][];
            const check = checkExpeditionCost(tpl.id);
            const affordable = check.ok;
            const isLast = idx === arr.length - 1;
            return (
              <View
                key={tpl.id}
                style={[
                  styles.expedition,
                  tpl.portal && styles.expeditionPortal,
                  !isLast && { marginBottom: spacing.md },
                ]}
              >
                <View style={styles.rowBetween}>
                  <Text
                    style={[
                      typography.h3,
                      { color: tpl.portal ? colors.earth : colors.text, flex: 1 },
                    ]}
                  >
                    {tpl.name}
                  </Text>
                  {tpl.portal ? (
                    <Text style={[typography.caption, { color: colors.earth, letterSpacing: 1 }]}>
                      ⌬ ПОРТАЛ
                    </Text>
                  ) : null}
                </View>
                {tpl.description ? (
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
                    {tpl.description}
                  </Text>
                ) : null}
                <Text style={[typography.caption, { color: colors.textDim, marginTop: spacing.sm }]}>
                  Дней в пути: {tpl.travelDays} · Рекоменд. сила: {tpl.recommendedPower}
                </Text>
                {costEntries.length > 0 ? (
                  <View style={{ marginTop: spacing.xs }}>
                    {costEntries.map(([kind, need]) => {
                      const have = crystals[kind] ?? 0;
                      const enough = have >= need;
                      return (
                        <Text
                          key={kind}
                          style={[
                            typography.caption,
                            { color: enough ? colors.earth : colors.danger },
                          ]}
                        >
                          ◆ {CRYSTAL_NAME[kind]}: {have}/{need}
                          {tpl.portal ? ' — сгорают при открытии портала' : ''}
                        </Text>
                      );
                    })}
                  </View>
                ) : null}
                <View style={{ height: spacing.sm }} />
                <Button
                  label={affordable ? 'Отправиться' : 'Не хватает кристаллов'}
                  disabled={!affordable}
                  onPress={() => begin(tpl.id)}
                />
              </View>
            );
          })}
          {errorMsg ? (
            <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)}>
              <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>
                {errorMsg}
              </Text>
            </Animated.View>
          ) : null}
        </Panel>

        <Button
          label="Инвентарь и Зиры"
          variant="secondary"
          onPress={() => navigation.navigate('Inventory')}
          style={{ marginTop: spacing.xs }}
        />
        <Button
          label="Мастерская"
          variant="secondary"
          onPress={() => navigation.navigate('Crafting')}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expedition: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgDeep,
  },
  expeditionPortal: {
    borderColor: colors.earth,
    backgroundColor: '#13180f',
  },
});
