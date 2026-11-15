// Petits composants partagés par les écrans.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const VERT = '#2E9E5B';

export function Ecran({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">{titre}</ThemedText>
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

export function Carte({ children }: { children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.carte}>
      {children}
    </ThemedView>
  );
}

export function Bouton({ titre, onPress, secondaire }: { titre: string; onPress: () => void; secondaire?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: secondaire ? theme.backgroundSelected : VERT, opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText style={{ color: secondaire ? theme.text : '#fff', fontWeight: 700 }}>{titre}</ThemedText>
    </Pressable>
  );
}

export function Champ({ libelle, ...props }: TextInputProps & { libelle: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="small" themeColor="textSecondary">
        {libelle}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.champ, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
        {...props}
      />
    </View>
  );
}

export function Choix<T extends string>({
  libelle,
  options,
  valeur,
  onChange,
}: {
  libelle: string;
  options: { valeur: T; texte: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="small" themeColor="textSecondary">
        {libelle}
      </ThemedText>
      <View style={styles.choix}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <Pressable
              key={o.valeur}
              onPress={() => onChange(o.valeur)}
              style={[styles.puce, { backgroundColor: actif ? VERT : theme.backgroundSelected }]}>
              <ThemedText type="small" style={{ color: actif ? '#fff' : theme.text }}>
                {o.texte}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Barre({ libelle, valeur, cible, unite }: { libelle: string; valeur: number; cible: number; unite: string }) {
  const theme = useTheme();
  const ratio = cible > 0 ? Math.min(valeur / cible, 1) : 0;
  return (
    <View style={{ gap: Spacing.one }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ThemedText type="small">{libelle}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {Math.round(valeur)} / {cible} {unite}
        </ThemedText>
      </View>
      <View style={[styles.piste, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.remplissage, { width: `${ratio * 100}%`, backgroundColor: valeur > cible ? '#D9534F' : VERT }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  carte: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  bouton: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  champ: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  puce: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  piste: { height: 10, borderRadius: 5, overflow: 'hidden' },
  remplissage: { height: '100%', borderRadius: 5 },
});
