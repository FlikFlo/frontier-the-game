import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { sellValue, canDismantle } from '../systems/economy';
import type { ItemInstance } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

const KIND_LABEL: Record<string, string> = {
  weapon: 'Оружие',
  armor: 'Броня',
  zir: 'Зир',
  consumable: 'Расходник',
  material: 'Материал',
  crystal: 'Кристалл',
  artifact: 'Артефакт',
};

const KIND_COLOR: Record<string, string> = {
  weapon: colors.warn,
  armor: colors.air,
  zir: colors.light,
  consumable: colors.success,
  material: colors.textMuted,
  crystal: colors.earth,
  artifact: '#c88ae0',
};

function ItemCard({
  inst,
  equipped,
  onEquip,
  onUnequip,
  onSell,
  onDismantle,
}: {
  inst: ItemInstance;
  equipped: boolean;
  onEquip?: () => void;
  onUnequip?: () => void;
  onSell?: () => void;
  onDismantle?: () => void;
}) {
  const tint = KIND_COLOR[inst.item.kind] ?? colors.text;
  const kindLabel = KIND_LABEL[inst.item.kind] ?? inst.item.kind;
  const value = sellValue(inst);
  const dismantleAvailable = canDismantle(inst);
  const soul = inst.binding === 'soul';

  return (
    <View style={[styles.card, equipped && styles.cardEquipped]}>
      <View style={styles.headerRow}>
        <Text style={[typography.body, { color: tint, flex: 1, fontWeight: '700' }]}>
          {inst.item.name}
        </Text>
        <Text style={[typography.caption, { color: soul ? colors.accent : colors.textMuted }]}>
          {soul ? 'ДУШ' : 'РЕЙД'}
        </Text>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
        {kindLabel} · размер {inst.item.size} · {inst.item.rarity}
      </Text>
      {inst.item.description ? (
        <Text style={[typography.caption, { color: colors.textDim, marginTop: 4 }]}>
          {inst.item.description}
        </Text>
      ) : null}
      <View style={styles.actionRow}>
        {onEquip ? (
          <Button label="Взять" variant="secondary" onPress={onEquip} style={styles.actBtn} />
        ) : null}
        {onUnequip ? (
          <Button label="Снять" variant="secondary" onPress={onUnequip} style={styles.actBtn} />
        ) : null}
        {onSell && !soul && value > 0 && !equipped ? (
          <Button
            label={`${value} зол.`}
            variant="secondary"
            onPress={onSell}
            style={styles.actBtn}
          />
        ) : null}
        {onDismantle && !soul && dismantleAvailable && !equipped ? (
          <Button
            label="Разобрать"
            variant="secondary"
            onPress={onDismantle}
            style={styles.actBtn}
          />
        ) : null}
      </View>
    </View>
  );
}

export function InventoryScreen({ navigation }: ScreenProps<'Inventory'>) {
  const hero = useGame((s) => s.hero);
  const inventory = useGame((s) => s.inventory);
  const gold = useGame((s) => s.gold);
  const inventoryCapacity = useGame((s) => s.inventoryCapacity);
  const equipZir = useGame((s) => s.equipZir);
  const unequipZir = useGame((s) => s.unequipZir);
  const sellItem = useGame((s) => s.sellItem);
  const dismantleItem = useGame((s) => s.dismantleItem);

  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const flashMessage = (text: string, ok: boolean) => {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 1800);
  };

  const equippedIds = useMemo(
    () =>
      new Set<string>(
        [hero.equippedWeaponId, hero.equippedArmorId, ...hero.equippedZirIds].filter(
          (x): x is string => !!x,
        ),
      ),
    [hero],
  );

  const fill = inventory.reduce((s, x) => s + x.item.size, 0);

  const zirs = inventory.filter((i) => i.item.kind === 'zir');
  const equippedZirs = zirs.filter((i) => hero.equippedZirIds.includes(i.item.id));
  const freeZirs = zirs.filter((i) => !hero.equippedZirIds.includes(i.item.id));
  const gear = inventory.filter((i) => i.item.kind === 'weapon' || i.item.kind === 'armor');
  const consumables = inventory.filter((i) => i.item.kind === 'consumable');
  const materials = inventory.filter(
    (i) => i.item.kind === 'material' || i.item.kind === 'crystal' || i.item.kind === 'artifact',
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Button label="← Назад" variant="secondary" onPress={() => navigation.goBack()} />
        <Text style={[typography.h2, { marginLeft: spacing.md, flex: 1 }]}>Инвентарь</Text>
        <Text style={[typography.body, { color: colors.accentBright }]}>☼ {gold}</Text>
      </View>

      <View style={styles.capRow}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Занято: {fill}/{inventoryCapacity}
        </Text>
        {fill > inventoryCapacity ? (
          <Text style={[typography.caption, { color: colors.danger }]}>
            Перегруз! Продай или разбери.
          </Text>
        ) : null}
      </View>

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
          <Text style={[typography.caption, { color: colors.text }]}>{flash.text}</Text>
        </Animated.View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Panel title={`Зиры в посохе (${equippedZirs.length}/2)`}>
          {equippedZirs.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Пусто. Заряди Зир из свободных ниже.
            </Text>
          ) : (
            equippedZirs.map((inst) => (
              <ItemCard
                key={inst.item.id}
                inst={inst}
                equipped
                onUnequip={() => unequipZir(inst.item.id)}
              />
            ))
          )}
        </Panel>

        {freeZirs.length > 0 ? (
          <Panel title="Свободные Зиры">
            {freeZirs.map((inst) => (
              <ItemCard
                key={inst.item.id}
                inst={inst}
                equipped={equippedIds.has(inst.item.id)}
                onEquip={() => equipZir(inst.item.id)}
                onSell={() => {
                  const r = sellItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
                onDismantle={() => {
                  const r = dismantleItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
              />
            ))}
          </Panel>
        ) : null}

        {gear.length > 0 ? (
          <Panel title="Снаряжение">
            {gear.map((inst) => (
              <ItemCard
                key={inst.item.id}
                inst={inst}
                equipped={equippedIds.has(inst.item.id)}
                onSell={() => {
                  const r = sellItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
                onDismantle={() => {
                  const r = dismantleItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
              />
            ))}
          </Panel>
        ) : null}

        {consumables.length > 0 ? (
          <Panel title="Расходники">
            {consumables.map((inst) => (
              <ItemCard
                key={inst.item.id}
                inst={inst}
                equipped={false}
                onSell={() => {
                  const r = sellItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
              />
            ))}
          </Panel>
        ) : null}

        {materials.length > 0 ? (
          <Panel title="Материалы и реликвии">
            {materials.map((inst) => (
              <ItemCard
                key={inst.item.id}
                inst={inst}
                equipped={false}
                onSell={() => {
                  const r = sellItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
                onDismantle={() => {
                  const r = dismantleItem(inst.item.id);
                  flashMessage(r.message, r.ok);
                }}
              />
            ))}
          </Panel>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  capRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  flash: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgDeep,
    marginBottom: spacing.xs,
  },
  cardEquipped: {
    borderColor: colors.accent,
    backgroundColor: colors.bgElevated,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  actBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
