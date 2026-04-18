import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { listRecipes } from '../data/recipes';
import { getItemTemplate } from '../data/items';
import { countByTemplate } from '../systems/crafting';
import type { Recipe, CraftStation } from '../types/crafting';
import type { ScreenProps } from '../navigation/types';

const STATION_LABEL: Record<CraftStation, string> = {
  alchemy: 'Алхимия',
  scribing: 'Каллиграфия Зиров',
  smithy: 'Кузня',
};

const CRYSTAL_NAME: Record<string, string> = {
  virdite: 'Вирдит',
  aquirin: 'Аквирин',
  pyrite: 'Пирит',
  zephyrite: 'Зефирит',
  lucerite: 'Люцерит',
  nocrite: 'Нокрит',
  sanguit: 'Сангвит',
};

export function CraftingScreen({ navigation }: ScreenProps<'Crafting'>) {
  const inventory = useGame((s) => s.inventory);
  const crystals = useGame((s) => s.crystals);
  const checkCraft = useGame((s) => s.checkCraft);
  const craftItem = useGame((s) => s.craftItem);
  const hero = useGame((s) => s.hero);

  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);

  const counts = useMemo(() => countByTemplate(inventory), [inventory]);
  const recipes = useMemo(() => listRecipes(), []);

  const byStation = useMemo(() => {
    const groups = new Map<CraftStation, Recipe[]>();
    for (const r of recipes) {
      const list = groups.get(r.station) ?? [];
      list.push(r);
      groups.set(r.station, list);
    }
    return groups;
  }, [recipes]);

  const flashMessage = (text: string, ok: boolean) => {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 1800);
  };

  const lockedIds = new Set<string>(
    [hero.equippedWeaponId, hero.equippedArmorId, ...hero.equippedZirIds].filter(
      (x): x is string => !!x,
    ),
  );
  const availableCounts = (() => {
    const c: Record<string, number> = {};
    for (const inst of inventory) {
      if (lockedIds.has(inst.item.id)) continue;
      c[inst.item.templateId] = (c[inst.item.templateId] ?? 0) + 1;
    }
    return c;
  })();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Button label="← Назад" variant="secondary" onPress={() => navigation.goBack()} />
        <Text style={[typography.h2, { marginLeft: spacing.md, color: colors.text, flex: 1 }]}>
          Мастерская
        </Text>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
        Комбинируй материалы и кристаллы в зелья и Зиры. Тап по рецепту — развернуть.
      </Text>

      {flash ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.flash,
            {
              backgroundColor: flash.ok ? '#182214' : '#24110c',
              borderColor: flash.ok ? colors.success : colors.danger,
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.text }]}>{flash.text}</Text>
        </Animated.View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {Array.from(byStation.entries()).map(([station, list]) => (
          <View key={station} style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.accentBright, marginBottom: spacing.sm, letterSpacing: 1 }]}>
              ❖ {STATION_LABEL[station]}
            </Text>
            {list.map((recipe) => {
              const check = checkCraft(recipe.id);
              const canMake = check.ok;
              return (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  canMake={canMake}
                  counts={availableCounts}
                  crystals={crystals}
                  onCraft={() => {
                    const res = craftItem(recipe.id);
                    flashMessage(res.message, res.ok);
                  }}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function RecipeCard({
  recipe,
  canMake,
  counts,
  crystals,
  onCraft,
}: {
  recipe: Recipe;
  canMake: boolean;
  counts: Record<string, number>;
  crystals: Partial<Record<string, number>>;
  onCraft: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const outputTpl = getItemTemplate(recipe.output.templateId);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.9 : 1, borderColor: canMake ? colors.accent : colors.border },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: canMake ? colors.text : colors.textMuted }]}>
            {recipe.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            → {outputTpl.name}
          </Text>
        </View>
        <Text style={[typography.caption, { color: canMake ? colors.success : colors.textDim }]}>
          {canMake ? 'Можно' : 'Нехватка'}
        </Text>
      </View>

      {expanded ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {recipe.description}
          </Text>
          {recipe.ingredients.map((ing) => {
            const have = counts[ing.templateId] ?? 0;
            const enough = have >= ing.count;
            const tpl = getItemTemplate(ing.templateId);
            return (
              <Text
                key={ing.templateId}
                style={[
                  typography.caption,
                  { color: enough ? colors.text : colors.danger, marginBottom: 2 },
                ]}
              >
                • {tpl.name} ({have}/{ing.count})
              </Text>
            );
          })}
          {recipe.crystalCost
            ? Object.entries(recipe.crystalCost).map(([crystal, need]) => {
                if (!need) return null;
                const have = crystals[crystal] ?? 0;
                const enough = have >= need;
                return (
                  <Text
                    key={crystal}
                    style={[
                      typography.caption,
                      { color: enough ? colors.earth : colors.danger, marginBottom: 2 },
                    ]}
                  >
                    ◆ {CRYSTAL_NAME[crystal] ?? crystal} ({have}/{need})
                  </Text>
                );
              })
            : null}
          <View style={{ height: spacing.sm }} />
          <Button
            label={canMake ? 'Создать' : 'Нет ингредиентов'}
            onPress={onCraft}
            disabled={!canMake}
            variant={canMake ? 'primary' : 'secondary'}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flash: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
});
