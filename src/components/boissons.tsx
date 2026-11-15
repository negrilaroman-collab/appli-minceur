// Carte « Boissons » : verres d'eau du jour et ajout rapide des boissons qui apportent des kcal.
import { Alert, Pressable, View } from 'react-native';

import { Barre, C, Carte, Texte } from '@/components/ui';
import { useStore } from '@/lib/store';

export const BOISSONS: { nom: string; kcal: number; glucidesG: number; lipidesG: number; proteinesG: number }[] = [
  { nom: 'Café ou thé sucré (1 sucre)', kcal: 20, glucidesG: 5, lipidesG: 0, proteinesG: 0 },
  { nom: 'Café au lait (25 cl)', kcal: 60, glucidesG: 6, lipidesG: 2, proteinesG: 4 },
  { nom: 'Soda (canette 33 cl)', kcal: 140, glucidesG: 35, lipidesG: 0, proteinesG: 0 },
  { nom: 'Jus de fruits (25 cl)', kcal: 110, glucidesG: 25, lipidesG: 0, proteinesG: 1 },
  { nom: 'Bière (demi 25 cl)', kcal: 105, glucidesG: 9, lipidesG: 0, proteinesG: 1 },
  { nom: 'Verre de vin (12 cl)', kcal: 85, glucidesG: 3, lipidesG: 0, proteinesG: 0 },
  { nom: 'Sirop à l’eau (25 cl)', kcal: 70, glucidesG: 18, lipidesG: 0, proteinesG: 0 },
  { nom: 'Lait demi-écrémé (25 cl)', kcal: 115, glucidesG: 12, lipidesG: 4, proteinesG: 8 },
];

const VERRE_ML = 250;
const court = (nom: string) => nom.split(' (')[0];

/** Objectif d'eau : environ 30 ml par kg, entre 1,5 et 3 L. */
export function objectifEauMl(poidsKg: number): number {
  return Math.min(3000, Math.max(1500, Math.round((poidsKg * 30) / 250) * 250));
}

export function CarteBoissons({ jour }: { jour: string }) {
  const { profil, eauMl, ajouterEau, ajouterRepas } = useStore();
  const bu = eauMl[jour] ?? 0;
  const objectif = objectifEauMl(profil?.poidsKg ?? 70);
  const verres = Math.round(bu / VERRE_ML);

  const ajouterBoisson = (b: (typeof BOISSONS)[number]) =>
    Alert.alert('Ajouter cette boisson ?', `${b.nom} : ${b.kcal} kcal`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ajouter', onPress: () => ajouterRepas({ date: jour, moment: 'boisson', ...b }) },
    ]);

  const rond = (fond: string) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: fond });

  return (
    <Carte>
      <Texte type="label" couleur={C.cyan}>
        BOISSONS
      </Texte>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => ajouterEau(jour, -VERRE_ML)} disabled={bu === 0} style={rond(C.backgroundSelected)} hitSlop={6}>
          <Texte type="gras" couleur={bu === 0 ? C.textSecondary : C.text}>
            −
          </Texte>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Barre libelle={`Eau · ${verres} verre${verres > 1 ? 's' : ''}`} valeur={bu / 1000} cible={objectif / 1000} unite="L" couleur={C.cyan} decimales={2} plusEstMieux />
        </View>
        <Pressable onPress={() => ajouterEau(jour, VERRE_ML)} style={rond(C.cyan)} hitSlop={6}>
          <Texte type="gras" couleur={C.accentText}>
            +
          </Texte>
        </Pressable>
      </View>
      <Texte type="petit">« + » ajoute un verre d’eau (25 cl). L’eau, le thé et le café sans sucre ont 0 kcal.</Texte>
      <Texte type="petit">Une boisson avec des kcal ? Touche-la pour l’ajouter à ton journal :</Texte>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {BOISSONS.map((b) => (
          <Pressable
            key={b.nom}
            onPress={() => ajouterBoisson(b)}
            style={{ backgroundColor: C.backgroundSelected, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Texte type="petit" couleur={C.text}>
              {court(b.nom)} · {b.kcal}
            </Texte>
          </Pressable>
        ))}
      </View>
    </Carte>
  );
}
