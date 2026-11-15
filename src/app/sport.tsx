import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Bouton, C, Carte, Ecran, Texte } from '@/components/ui';
import { aujourdhui, useStore } from '@/lib/store';
import { genererProgramme } from '@/lib/training';

function semaineCourante(debutISO: string): number {
  const jours = Math.floor((Date.now() - new Date(debutISO).getTime()) / (24 * 3600 * 1000));
  return Math.min(12, Math.max(1, Math.floor(jours / 7) + 1));
}

export default function SportScreen() {
  const { profil, enregistrerProfil } = useStore();
  const programme = useMemo(
    () => (profil ? genererProgramme({ niveau: profil.niveauSport, lieu: profil.lieuSport, joursParSemaine: profil.joursSport }) : []),
    [profil],
  );
  const [choisie, setChoisie] = useState<number | null>(null);

  if (!profil) {
    return (
      <Ecran titre="Sport">
        <Carte>
          <Texte>Remplis ton profil pour générer ton programme de 12 semaines.</Texte>
          <Bouton titre="Créer mon profil" onPress={() => router.navigate('/profil')} />
        </Carte>
      </Ecran>
    );
  }

  const actuelle = semaineCourante(profil.debutProgramme);
  const fini = Date.now() - new Date(profil.debutProgramme).getTime() >= 12 * 7 * 24 * 3600 * 1000;
  const recommencer = () => {
    enregistrerProfil({ ...profil, debutProgramme: aujourdhui() });
    setChoisie(null);
  };
  const num = choisie ?? actuelle;
  const semaine = programme[num - 1];

  return (
    <Ecran titre="Sport" sousTitre={`Semaine ${num}/12 · ${semaine.bloc}${num === actuelle ? ' · en cours' : ''}`}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {programme.map((sem) => (
          <View
            key={sem.numero}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: sem.numero === num ? C.accent : sem.numero < actuelle ? C.textSecondary : sem.bloc === 'Allègement' ? C.cyan : C.backgroundSelected,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton titre="‹ Préc." secondaire onPress={() => setChoisie(Math.max(1, num - 1))} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Suiv. ›" secondaire onPress={() => setChoisie(Math.min(12, num + 1))} />
        </View>
      </View>

      {fini && (
        <Carte accent={C.accent}>
          <Texte type="gras">Bravo, tu as terminé les 12 semaines ! 🎉</Texte>
          <Texte type="petit">Recommence un cycle : pense à monter d'un niveau dans le Profil si c'était devenu facile.</Texte>
          <Bouton titre="Recommencer un cycle de 12 semaines" onPress={recommencer} />
        </Carte>
      )}

      {semaine.seances.map((s, i) => (
        <Carte key={i} accent={s.cardio ? C.bordure : undefined}>
          <Texte type="label" couleur={s.cardio ? C.cyan : C.orange}>
            SÉANCE {i + 1}
          </Texte>
          <Texte type="chiffre">{s.titre}</Texte>
          {s.cardio && <Texte>{s.cardio}</Texte>}
          {s.exercices.map((e) => (
            <View key={e.nom} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.bordure }}>
              <View style={{ flex: 1 }}>
                <Texte>{e.nom}</Texte>
                <Texte type="petit">repos {e.reposS} s</Texte>
              </View>
              <Texte type="gras" couleur={C.accent}>
                {e.series} × {e.reps}
              </Texte>
            </View>
          ))}
        </Carte>
      ))}

      <Carte>
        <Texte type="label">RÈGLE DE PROGRESSION</Texte>
        <Texte type="petit">
          Quand tu fais le haut de la fourchette de reps sur toutes les séries sans être à fond (difficulté 8/10 ou moins), augmente la charge ou passe à une variante plus dure à la séance suivante. Échauffe-toi 5 min avant chaque séance.
        </Texte>
      </Carte>
    </Ecran>
  );
}
