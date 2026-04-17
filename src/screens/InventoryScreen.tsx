import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import type { ItemInstance } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

function ItemRow({
  inst,
  action,
  onPress,
}: {
  inst: ItemInstance;
  action?: string;
  onPress?: () => void;
}) {
  const tint =
    inst.item.kind === 'zir'
      ? colors.light
      : inst.item.kind === 'weapon'
        ? colors.warn
        : inst.item.kind === 'armor'
          ? colors.air
          : inst.item.kind === 'crystal'
            ? colors.earth
            : colors.text;
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: tint }]}>{inst.item.name}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {inst.item.kind} · размер {inst.item.size} · {inst.binding === 'soul' ? 'душевное' : 'рейдовое'}
        </Text>
      </View>
      {action && onPress ? (
        <Button label={action} variant="secondary" onPress={onPress} />
      ) : null}
    </View>
  );
}

export function InventoryScreen({ navigation }: ScreenProps<'Inventory'>) {
  const hero = useGame((s) => s.hero);
  const inventory = useGame((s) => s.inventory);
  const equipZir = useGame((s) => s.equipZir);
  const unequipZir = useGame((s) => s.unequipZir);

  const zirs = inventory.filter((i) => i.item.kind === 'zir');
  const equipped = zirs.filter((i) => hero.equippedZirIds.includes(i.item.id));
  const unequipped = zirs.filter((i) => !hero.equippedZirIds.includes(i.item.id));
  const other = inventory.filter((i) => i.item.kind !== 'zir');

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Button label="← Назад" variant="secondary" onPress={() => navigation.goBack()} />
        <Text style={[typography.h2, { marginLeft: spacing.md, color: colors.text }]}>Инвентарь</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={[typography.h3, styles.section]}>Экипированные Зиры ({equipped.length}/2)</Text>
        {equipped.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
            Ни один Зир не заряжен в посох.
          </Text>
        ) : (
          equipped.map((inst) => (
            <ItemRow
              key={inst.item.id}
              inst={inst}
              action="Снять"
              onPress={() => unequipZir(inst.item.id)}
            />
          ))
        )}

        <Text style={[typography.h3, styles.section]}>Свободные Зиры</Text>
        {unequipped.map((inst) => (
          <ItemRow
            key={inst.item.id}
            inst={inst}
            action="Взять"
            onPress={() => equipZir(inst.item.id)}
          />
        ))}

        <Text style={[typography.h3, styles.section]}>Прочее</Text>
        {other.map((inst) => (
          <ItemRow key={inst.item.id} inst={inst} />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
});
