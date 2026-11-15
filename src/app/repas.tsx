import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { EstimationRepas } from '@/components/estimation-repas';
import { Bouton, C, Carte, Champ, Choix, Ecran, Segments, Texte } from '@/components/ui';
import { aujourdhui, useStore, type Repas } from '@/lib/store';

const MOMENTS: { valeur: Repas['moment']; texte: string }[] = [
  { valeur: 'petit-dej', texte: 'Petit-déj' },
  { valeur: 'dejeuner', texte: 'Déjeuner' },
  { valeur: 'diner', texte: 'Dîner' },
  { valeur: 'collation', texte: 'Collation' },
];

function momentParDefaut(): Repas['moment'] {
  const h = new Date().getHours();
  if (h < 11) return 'petit-dej';
  if (h < 15) return 'dejeuner';
  if (h < 18) return 'collation';
  return 'diner';
}

type Mode = 'photo' | 'texte' | 'manuel';
const n = (s: string) => Math.max(0, Number(s.replace(',', '.')) || 0);

export default function RepasScreen() {
  const { repas, ajouterRepas, supprimerRepas } = useStore();
  const [moment, setMoment] = useState<Repas['moment']>(momentParDefaut());
  const [mode, setMode] = useState<Mode>('photo');
  const [nom, setNom] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [l, setL] = useState('');
  const [g, setG] = useState('');

  const jour = aujourdhui();
  const duJour = repas.filter((r) => r.date === jour);
  const totalJour = duJour.reduce((s, r) => s + r.kcal, 0);

  const ajouterManuel = () => {
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
    <Ecran titre="Repas" sousTitre={`${Math.round(totalJour)} kcal aujourd'hui`}>
      <Choix valeur={moment} onChange={setMoment} options={MOMENTS} />
      <Segments
        valeur={mode}
        onChange={setMode}
        options={[
          { valeur: 'photo', texte: 'Photo' },
          { valeur: 'texte', texte: 'Décrire' },
          { valeur: 'manuel', texte: 'À la main' },
        ]}
      />

      {mode !== 'manuel' ? (
        <EstimationRepas key={mode} mode={mode} onValider={(r) => ajouterRepas({ date: jour, moment, ...r })} />
      ) : (
        <Carte>
          <Champ libelle="ALIMENT OU PLAT" value={nom} onChangeText={setNom} placeholder="Poulet riz brocolis" />
          <Champ libelle="KCAL" keyboardType="number-pad" value={kcal} onChangeText={setKcal} placeholder="550" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Champ libelle="PROT. (G)" keyboardType="number-pad" value={p} onChangeText={setP} />
            </View>
            <View style={{ flex: 1 }}>
              <Champ libelle="LIP. (G)" keyboardType="number-pad" value={l} onChangeText={setL} />
            </View>
            <View style={{ flex: 1 }}>
              <Champ libelle="GLUC. (G)" keyboardType="number-pad" value={g} onChangeText={setG} />
            </View>
          </View>
          <Bouton titre="Ajouter" onPress={ajouterManuel} />
        </Carte>
      )}

      {MOMENTS.map((m) => {
        const liste = duJour.filter((r) => r.moment === m.valeur);
        if (liste.length === 0) return null;
        return (
          <Carte key={m.valeur}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Texte type="label">{m.texte.toUpperCase()}</Texte>
              <Texte type="label" couleur={C.accent}>
                {liste.reduce((s, r) => s + r.kcal, 0)} KCAL
              </Texte>
            </View>
            {liste.map((r) => (
              <Pressable
                key={r.id}
                onLongPress={() =>
                  Alert.alert('Supprimer ?', r.nom, [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: () => supprimerRepas(r.id) },
                  ])
                }>
                <Texte>{r.nom}</Texte>
                <Texte type="petit">
                  {r.kcal} kcal · P {r.proteinesG} g · G {r.glucidesG} g · L {r.lipidesG} g
                </Texte>
              </Pressable>
            ))}
          </Carte>
        );
      })}
      {duJour.length > 0 && <Texte type="petit">Appui long sur un repas pour le supprimer.</Texte>}
    </Ecran>
  );
}
