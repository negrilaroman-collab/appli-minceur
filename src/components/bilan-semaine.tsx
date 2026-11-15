// Carte « Bilan de la semaine » : résumé des 7 derniers jours et ajustement de l'objectif kcal.
import { useState } from 'react';
import { View } from 'react-native';

import { Bouton, C, Carte, Texte } from '@/components/ui';
import { ajusterObjectif, objectifKcal } from '@/lib/nutrition';
import { cleSeance, useStore } from '@/lib/store';
import { bilanSemaine, ecartJours } from '@/lib/suivi';
import { genererProgramme } from '@/lib/training';

export function BilanSemaine({ jour, semaineNum }: { jour: string; semaineNum: number }) {
  const { profil, pesees, repas, bilans, seancesFaites, enregistrerBilan } = useStore();
  const [ouvert, setOuvert] = useState(false);
  if (!profil) return null;

  const dernier = bilans[bilans.length - 1]?.date ?? profil.debutProgramme;
  if (ecartJours(dernier, jour) < 7) return null;

  const kcal = objectifKcal(profil);
  const b = bilanSemaine(pesees, repas, jour, kcal, (pertes) => ajusterObjectif(profil, kcal, pertes));
  const prevues = genererProgramme({ niveau: profil.niveauSport, lieu: profil.lieuSport, joursParSemaine: profil.joursSport })[semaineNum - 1]?.seances.length ?? 0;
  const faites = Array.from({ length: prevues }, (_, i) => cleSeance(profil.debutProgramme, semaineNum, i)).filter((c) => seancesFaites.includes(c)).length;

  const terminer = (kcalApres: number) => enregistrerBilan({ date: jour, kcalAvant: kcal, kcalApres, perteKg: b.perteKg });

  if (!ouvert) {
    return (
      <Carte accent={C.orange}>
        <Texte type="label" couleur={C.orange}>
          BILAN DE LA SEMAINE
        </Texte>
        <Texte type="gras">Ton bilan est prêt 📊</Texte>
        <Texte type="petit">Une minute pour voir ta semaine et ajuster ton objectif si besoin.</Texte>
        <Bouton titre="Voir mon bilan" couleur={C.orange} onPress={() => setOuvert(true)} />
      </Carte>
    );
  }

  const ligne = (libelle: string, valeur: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.bordure }}>
      <Texte type="petit">{libelle}</Texte>
      <Texte type="gras">{valeur}</Texte>
    </View>
  );

  return (
    <Carte accent={C.orange}>
      <Texte type="label" couleur={C.orange}>
        BILAN DE LA SEMAINE
      </Texte>
      {ligne('Évolution du poids', b.perteKg === null ? '—' : `${b.perteKg > 0 ? '−' : '+'}${Math.abs(b.perteKg).toFixed(1).replace('.', ',')} kg`)}
      {ligne('Moyenne mangée', b.moyenneKcal === null ? '—' : `${b.moyenneKcal} kcal / jour`)}
      {ligne('Jours notés', `${b.joursNotes} / 7`)}
      {ligne('Séances faites (semaine en cours)', `${faites} / ${prevues}`)}
      <Texte>{b.message}</Texte>
      {b.kcalPropose !== kcal ? (
        <>
          <Bouton titre={`Passer à ${b.kcalPropose} kcal par jour`} onPress={() => terminer(b.kcalPropose)} />
          <Bouton titre={`Garder ${kcal} kcal`} secondaire onPress={() => terminer(kcal)} />
        </>
      ) : (
        <Bouton titre="OK, semaine suivante !" onPress={() => terminer(kcal)} />
      )}
    </Carte>
  );
}
