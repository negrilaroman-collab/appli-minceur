import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Bouton, Carte, Ecran } from '@/components/ui';
import { useStore } from '@/lib/store';
import { genererProgramme } from '@/lib/training';

function semaineCourante(debutISO: string): number {
  const jours = Math.floor((Date.now() - new Date(debutISO).getTime()) / (24 * 3600 * 1000));
  return Math.min(12, Math.max(1, Math.floor(jours / 7) + 1));
}

export default function SportScreen() {
  const { profil } = useStore();
  const programme = useMemo(
    () => (profil ? genererProgramme({ niveau: profil.niveauSport, lieu: profil.lieuSport, joursParSemaine: profil.joursSport }) : []),
    [profil],
  );
  const [choisie, setChoisie] = useState<number | null>(null);

  if (!profil) {
    return (
      <Ecran titre="Sport">
        <Carte>
          <ThemedText>Remplis ton profil pour générer ton programme de 12 semaines.</ThemedText>
          <Bouton titre="Créer mon profil" onPress={() => router.navigate('/profil')} />
        </Carte>
      </Ecran>
    );
  }

  const actuelle = semaineCourante(profil.debutProgramme);
  const num = choisie ?? actuelle;
  const semaine = programme[num - 1];

  return (
    <Ecran titre="Sport">
      <ThemedText themeColor="textSecondary">
        Semaine {num} sur 12 · Bloc {semaine.bloc}
        {num === actuelle ? ' (cette semaine)' : ''}
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Bouton titre="‹ Précédente" secondaire onPress={() => setChoisie(Math.max(1, num - 1))} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Suivante ›" secondaire onPress={() => setChoisie(Math.min(12, num + 1))} />
        </View>
      </View>

      {semaine.seances.map((s, i) => (
        <Carte key={i}>
          <ThemedText type="smallBold">
            Séance {i + 1} · {s.titre}
          </ThemedText>
          {s.cardio && <ThemedText type="small">{s.cardio}</ThemedText>}
          {s.exercices.map((e) => (
            <ThemedText key={e.nom} type="small">
              {e.nom} : {e.series} × {e.reps} reps, repos {e.reposS} s
            </ThemedText>
          ))}
        </Carte>
      ))}

      <Carte>
        <ThemedText type="smallBold">Règle de progression</ThemedText>
        <ThemedText type="small">
          Quand tu fais le haut de la fourchette de reps sur toutes les séries sans être à fond (difficulté 8/10 ou moins), augmente la charge ou passe à une variante plus dure à la séance suivante. Échauffe-toi 5 min avant chaque séance.
        </ThemedText>
      </Carte>
    </Ecran>
  );
}
