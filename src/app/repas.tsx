import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { EstimationRepas } from '@/components/estimation-repas';
import { Bouton, C, Carte, Champ, Choix, Ecran, Segments, Texte } from '@/components/ui';
import { objectifMacros } from '@/lib/nutrition';
import { aujourdhui, useStore, type Repas } from '@/lib/store';
import { decalerJour, kcalParJour } from '@/lib/suivi';

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
  const { profil, repas, ajouterRepas, supprimerRepas } = useStore();
  const [moment, setMoment] = useState<Repas['moment']>(momentParDefaut());
  const [mode, setMode] = useState<Mode>('photo');
  const [nom, setNom] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [l, setL] = useState('');
  const [g, setG] = useState('');

  const auj = aujourdhui();
  const [choisi, setChoisi] = useState<string | null>(null);
  const jour = choisi ?? auj;
  const estAujourdhui = jour === auj;
  const objectifKcal = profil ? objectifMacros(profil).kcal : 2000;
  const semaine = kcalParJour(repas, auj, 7);
  const libelleJour = estAujourdhui
    ? "aujourd'hui"
    : jour === decalerJour(auj, -1)
      ? 'hier'
      : new Date(`${jour}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const duJour = repas.filter((r) => r.date === jour);
  const totalJour = duJour.reduce((s, r) => s + r.kcal, 0);

  const ajouterManuel = () => {
    if (!nom.trim() || n(kcal) === 0) {
      Alert.alert('Repas incomplet', 'Indique au moins un nom et les kcal.');
      return;
    }
    ajouterRepas({ date: jour, moment, nom: nom.trim(), kcal: Math.round(n(kcal)), proteinesG: Math.round(n(p)), lipidesG: Math.round(n(l)), glucidesG: Math.round(n(g)) });
    setNom('');
    setKcal('');
    setP('');
    setL('');
    setG('');
  };

  return (
    <Ecran titre="Repas" sousTitre={`${Math.round(totalJour)} / ${objectifKcal} kcal ${libelleJour}`}>
      <Carte>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable hitSlop={10} onPress={() => setChoisi(decalerJour(jour, -1))}>
            <Texte type="gras" couleur={C.accent}>
              ‹ Veille
            </Texte>
          </Pressable>
          <Texte type="gras">{libelleJour.charAt(0).toUpperCase() + libelleJour.slice(1)}</Texte>
          <Pressable hitSlop={10} disabled={estAujourdhui} onPress={() => setChoisi(decalerJour(jour, 1) >= auj ? null : decalerJour(jour, 1))}>
            <Texte type="gras" couleur={estAujourdhui ? C.backgroundSelected : C.accent}>
              Lendemain ›
            </Texte>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 74 }}>
          {semaine.map((d) => {
            const ratio = Math.min(d.kcal / (objectifKcal * 1.3), 1);
            const selection = d.date === jour;
            return (
              <Pressable key={d.date} onPress={() => setChoisi(d.date === auj ? null : d.date)} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '100%', height: 50, justifyContent: 'flex-end', backgroundColor: C.backgroundSelected, borderRadius: 6, overflow: 'hidden', borderWidth: selection ? 2 : 0, borderColor: C.text }}>
                  <View style={{ height: `${ratio * 100}%`, backgroundColor: d.kcal > objectifKcal ? C.danger : C.accent }} />
                </View>
                <Texte type="petit" couleur={selection ? C.text : C.textSecondary}>
                  {new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase()}
                </Texte>
              </Pressable>
            );
          })}
        </View>
        <Texte type="petit">
          Tes 7 derniers jours (vert : dans l’objectif, rouge : au-dessus). Touche un jour pour voir ses repas{estAujourdhui ? '' : ' ou en ajouter un oublié'}.
        </Texte>
        {!estAujourdhui && <Bouton titre="Revenir à aujourd'hui" secondaire onPress={() => setChoisi(null)} />}
      </Carte>
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
              <Champ libelle="GLUC. (G)" keyboardType="number-pad" value={g} onChangeText={setG} />
            </View>
            <View style={{ flex: 1 }}>
              <Champ libelle="LIP. (G)" keyboardType="number-pad" value={l} onChangeText={setL} />
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
      {duJour.length === 0 && !estAujourdhui && <Texte type="petit">Aucun repas noté ce jour-là.</Texte>}
      {duJour.length > 0 && <Texte type="petit">Appui long sur un repas pour le supprimer.</Texte>}
    </Ecran>
  );
}
