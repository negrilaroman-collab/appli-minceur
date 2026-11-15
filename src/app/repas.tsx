import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { PhotoRepas } from '@/components/photo-repas';
import { ThemedText } from '@/components/themed-text';
import { Bouton, Carte, Champ, Choix, Ecran } from '@/components/ui';
import { aujourdhui, useStore, type Repas } from '@/lib/store';

const MOMENTS: { valeur: Repas['moment']; texte: string }[] = [
  { valeur: 'petit-dej', texte: 'Petit-déj' },
  { valeur: 'dejeuner', texte: 'Déjeuner' },
  { valeur: 'diner', texte: 'Dîner' },
  { valeur: 'collation', texte: 'Collation' },
];

const n = (s: string) => Math.max(0, Number(s.replace(',', '.')) || 0);

export default function RepasScreen() {
  const { repas, ajouterRepas, supprimerRepas } = useStore();
  const [moment, setMoment] = useState<Repas['moment']>('dejeuner');
  const [nom, setNom] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [l, setL] = useState('');
  const [g, setG] = useState('');

  const jour = aujourdhui();
  const duJour = repas.filter((r) => r.date === jour);

  const ajouter = () => {
    if (!nom.trim() || n(kcal) === 0) {
      Alert.alert('Repas incomplet', 'Indique au moins un nom et les kcal.');
      return;
    }
    ajouterRepas({ date: jour, moment, nom: nom.trim(), kcal: n(kcal), proteinesG: n(p), lipidesG: n(l), glucidesG: n(g) });
    setNom('');
    setKcal('');
    setP('');
    setL('');
    setG('');
  };

  return (
    <Ecran titre="Repas">
      <Choix libelle="Moment" valeur={moment} onChange={setMoment} options={MOMENTS} />
      <PhotoRepas onValider={(r) => ajouterRepas({ date: jour, moment, ...r })} />

      <Carte>
        <ThemedText type="smallBold">Ajouter à la main</ThemedText>
        <Champ libelle="Aliment ou plat" value={nom} onChangeText={setNom} placeholder="Poulet riz brocolis" />
        <Champ libelle="kcal" keyboardType="number-pad" value={kcal} onChangeText={setKcal} placeholder="550" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Champ libelle="Protéines (g)" keyboardType="number-pad" value={p} onChangeText={setP} />
          </View>
          <View style={{ flex: 1 }}>
            <Champ libelle="Lipides (g)" keyboardType="number-pad" value={l} onChangeText={setL} />
          </View>
          <View style={{ flex: 1 }}>
            <Champ libelle="Glucides (g)" keyboardType="number-pad" value={g} onChangeText={setG} />
          </View>
        </View>
        <Bouton titre="Ajouter" onPress={ajouter} />
      </Carte>

      {MOMENTS.map((m) => {
        const liste = duJour.filter((r) => r.moment === m.valeur);
        if (liste.length === 0) return null;
        return (
          <Carte key={m.valeur}>
            <ThemedText type="smallBold">
              {m.texte} · {liste.reduce((s, r) => s + r.kcal, 0)} kcal
            </ThemedText>
            {liste.map((r) => (
              <Pressable
                key={r.id}
                onLongPress={() =>
                  Alert.alert('Supprimer ?', r.nom, [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: () => supprimerRepas(r.id) },
                  ])
                }>
                <ThemedText type="small">
                  {r.nom} · {r.kcal} kcal · P {r.proteinesG} / L {r.lipidesG} / G {r.glucidesG}
                </ThemedText>
              </Pressable>
            ))}
          </Carte>
        );
      })}
      {duJour.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Appui long sur un aliment pour le supprimer.
        </ThemedText>
      )}
    </Ecran>
  );
}
