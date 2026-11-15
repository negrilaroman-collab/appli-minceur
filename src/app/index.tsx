import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Barre, Bouton, Carte, Champ, Ecran, VERT } from '@/components/ui';
import { moyenne7Jours, objectifMacros } from '@/lib/nutrition';
import { aujourdhui, useStore } from '@/lib/store';

export default function AujourdhuiScreen() {
  const { pret, profil, repas, pesees, ajouterPesee } = useStore();
  const [poids, setPoids] = useState('');

  if (!pret) return <Ecran titre="Aujourd'hui">{null}</Ecran>;

  if (!profil) {
    return (
      <Ecran titre="Bienvenue">
        <Carte>
          <ThemedText>
            Remplis ton profil pour que je calcule tes besoins en kcal et que je prépare ton programme de sport sur 12 semaines.
          </ThemedText>
          <Bouton titre="Créer mon profil" onPress={() => router.navigate('/profil')} />
        </Carte>
      </Ecran>
    );
  }

  const objectif = objectifMacros(profil);
  const jour = aujourdhui();
  const duJour = repas.filter((r) => r.date === jour);
  const total = duJour.reduce(
    (t, r) => ({
      kcal: t.kcal + r.kcal,
      p: t.p + r.proteinesG,
      l: t.l + r.lipidesG,
      g: t.g + r.glucidesG,
    }),
    { kcal: 0, p: 0, l: 0, g: 0 },
  );
  const restant = objectif.kcal - total.kcal;
  const moyenne = moyenne7Jours(pesees, jour);

  const peser = () => {
    const v = Number(poids.replace(',', '.'));
    if (v >= 35 && v <= 300) {
      ajouterPesee({ date: jour, poidsKg: v });
      setPoids('');
    }
  };

  return (
    <Ecran titre="Aujourd'hui">
      <Carte>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <ThemedText type="title" style={{ color: restant >= 0 ? VERT : '#D9534F' }}>
            {Math.abs(Math.round(restant))}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{restant >= 0 ? 'kcal restantes' : 'kcal au-dessus de l’objectif'}</ThemedText>
        </View>
        <Barre libelle="Calories" valeur={total.kcal} cible={objectif.kcal} unite="kcal" />
        <Barre libelle="Protéines" valeur={total.p} cible={objectif.proteinesG} unite="g" />
        <Barre libelle="Lipides" valeur={total.l} cible={objectif.lipidesG} unite="g" />
        <Barre libelle="Glucides" valeur={total.g} cible={objectif.glucidesG} unite="g" />
        <Bouton titre="Ajouter un repas" onPress={() => router.navigate('/repas')} />
      </Carte>

      <Carte>
        <ThemedText type="smallBold">Poids</ThemedText>
        <ThemedText type="small">
          Actuel : {profil.poidsKg} kg · Moyenne 7 jours : {moyenne ? moyenne.toFixed(1) : '–'} kg · Objectif : {profil.poidsCibleKg} kg
        </ThemedText>
        <Champ libelle="Pesée du jour (kg)" keyboardType="decimal-pad" value={poids} onChangeText={setPoids} placeholder={String(profil.poidsKg)} />
        <Bouton titre="Enregistrer la pesée" onPress={peser} secondaire />
        <ThemedText type="small" themeColor="textSecondary">
          Pèse-toi le matin à jeun. Le poids varie de 1 à 2 kg d'un jour à l'autre (eau, sel) : c'est la moyenne sur 7 jours qui compte.
        </ThemedText>
      </Carte>

      <Carte>
        <ThemedText type="smallBold">Conseil du jour</ThemedText>
        <ThemedText type="small">
          Mets une source de protéines et des légumes dans chaque repas : la moitié de l'assiette en légumes, un quart en protéines, un quart en féculents.
        </ThemedText>
      </Carte>
    </Ecran>
  );
}
