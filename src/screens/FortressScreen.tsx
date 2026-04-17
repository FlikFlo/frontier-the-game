import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Bar } from '../components/Bar';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { EXPEDITION_TEMPLATES } from '../data/expeditions';
import type { ScreenProps } from '../navigation/types';

export function FortressScreen({ navigation }: ScreenProps<'Fortress'>) {
  const hero = useGame((s) => s.hero);
  const companion = useGame((s) => s.companion);
  const day = useGame((s) => s.day);
  const crystals = useGame((s) => s.crystals);
  const inventory = useGame((s) => s.inventory);
  const inventoryCapacity = useGame((s) => s.inventoryCapacity);
  const startExpedition = useGame((s) => s.startExpedition);
  const lastResult = useGame((s) => s.lastResult);

  const inventoryFill = inventory.reduce((s, x) => s + x.item.size, 0);

  const begin = (templateId: string) => {
    startExpedition(templateId);
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
          <View style={[styles.resultBanner, lastResult.outcome === 'victory' ? styles.bannerOk : styles.bannerBad]}>
            <Text style={[typography.body, { color: colors.text }]}>
              {lastResult.outcome === 'victory'
                ? `Вылазка успешна. Принесено предметов: ${lastResult.collectedCount}`
                : lastResult.outcome === 'defeat'
                  ? 'Герой побеждён. Рейдовый лут потерян.'
                  : 'Отступление. Часть добычи потеряна.'}
            </Text>
          </View>
        ) : null}

        {/* Hero card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={typography.h3}>{hero.name}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Ур. {hero.level}</Text>
          </View>
          <View style={{ height: spacing.sm }} />
          <Bar value={hero.hpMax} max={hero.hpMax} color={colors.hp} label="HP" />
          <View style={{ height: spacing.xs }} />
          <Bar value={hero.epMax} max={hero.epMax} color={colors.ep} label="EP" />
          <View style={{ height: spacing.sm }} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Атака {hero.stats.attack} · Магия {hero.stats.magic} · Защита {hero.stats.defense} · Скорость {hero.stats.speed}
          </Text>
        </View>

        {/* Companion card */}
        {companion ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={typography.h3}>{companion.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Компаньон · {companion.role}
              </Text>
            </View>
            <View style={{ height: spacing.sm }} />
            <Bar value={companion.hpMax} max={companion.hpMax} color={colors.hp} label="HP" />
          </View>
        ) : null}

        {/* Stockpile */}
        <View style={styles.card}>
          <Text style={typography.h3}>Склад</Text>
          <View style={{ height: spacing.sm }} />
          <Text style={[typography.body, { color: colors.text }]}>
            Вирдит (зелёный кристалл): {crystals.virdite ?? 0}
          </Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.xs }]}>
            Инвентарь: {inventoryFill}/{inventoryCapacity}
          </Text>
        </View>

        {/* Expeditions */}
        <View style={styles.card}>
          <Text style={typography.h3}>Вылазки</Text>
          <View style={{ height: spacing.md }} />
          {Object.values(EXPEDITION_TEMPLATES).map((tpl) => (
            <View key={tpl.id} style={{ marginBottom: spacing.sm }}>
              <Text style={[typography.body, { color: colors.text, marginBottom: 2 }]}>{tpl.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                Дней в пути: {tpl.travelDays} · Рекоменд. сила: {tpl.recommendedPower}
              </Text>
              <Button label="Отправиться" onPress={() => begin(tpl.id)} />
            </View>
          ))}
        </View>

        {/* Inventory */}
        <Button
          label="Инвентарь и Зиры"
          variant="secondary"
          onPress={() => navigation.navigate('Inventory')}
          style={{ marginTop: spacing.md }}
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
  card: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  resultBanner: {
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  bannerOk: { backgroundColor: '#1d2d1d', borderColor: colors.success },
  bannerBad: { backgroundColor: '#2d1d1d', borderColor: colors.danger },
});
