import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { CourbePoids } from '@/components/courbe-poids';
import { Anneau, Barre, Bouton, C, Carte, Champ, Ecran, Texte } from '@/components/ui';
import { moyenne7Jours, objectifMacros } from '@/lib/nutrition';
import { aujourdhui, useStore } from '@/lib/store';
import { semainesJusquaCible, vitesseHebdo } from '@/lib/suivi';
import { genererProgramme } from '@/lib/training';

const CONSEILS = [
  'Une source de protéines à chaque repas : elles calent et protègent tes muscles.',
  'La moitié de l’assiette en légumes : beaucoup de volume pour peu de kcal.',
  'Une cuillère d’huile, c’est 90 kcal. Mesure-la au lieu de verser à l’œil.',
  'Bois un grand verre d’eau avant chaque repas : la soif se confond souvent avec la faim.',
  'Vise 8 000 pas par jour : c’est le moyen le plus simple de brûler plus.',
  'Les boissons sucrées et l’alcool font vite grimper les kcal sans caler.',
  'Dors 7 à 8 h : le manque de sommeil augmente la faim le lendemain.',
];

function dateLongue(): string {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function AujourdhuiScreen() {
  const { pret, profil, repas, pesees, ajouterPesee } = useStore();
  const [poids, setPoids] = useState('');

  if (!pret) return <Ecran titre="Aujourd'hui">{null}</Ecran>;

  if (!profil) {
    return (
      <Ecran titre="Bienvenue" sousTitre="Appli Minceur">
        <Carte accent={C.accent}>
          <Texte type="gras">Prêt à commencer ?</Texte>
          <Texte type="petit">
            Remplis ton profil : je calcule tes besoins en kcal et je prépare ton programme de sport sur 12 semaines.
          </Texte>
          <Bouton titre="Créer mon profil" onPress={() => router.navigate('/profil')} />
        </Carte>
      </Ecran>
    );
  }

  const objectif = objectifMacros(profil);
  const jour = aujourdhui();
  const duJour = repas.filter((r) => r.date === jour);
  const total = duJour.reduce(
    (t, r) => ({ kcal: t.kcal + r.kcal, p: t.p + r.proteinesG, l: t.l + r.lipidesG, g: t.g + r.glucidesG }),
    { kcal: 0, p: 0, l: 0, g: 0 },
  );
  const restant = Math.round(objectif.kcal - total.kcal);
  const moyenne = moyenne7Jours(pesees, jour);
  const perdu = pesees.length > 0 ? pesees[0].poidsKg - (moyenne ?? profil.poidsKg) : 0;
  const vitesse = vitesseHebdo(pesees, jour);
  const semainesRestantes = semainesJusquaCible(moyenne ?? profil.poidsKg, profil.poidsCibleKg, vitesse);
  const conseil = CONSEILS[new Date().getDate() % CONSEILS.length];

  const semaineNum = Math.min(12, Math.max(1, Math.floor((Date.now() - new Date(profil.debutProgramme).getTime()) / (7 * 864e5)) + 1));
  const semaine = genererProgramme({ niveau: profil.niveauSport, lieu: profil.lieuSport, joursParSemaine: profil.joursSport })[semaineNum - 1];

  const peser = () => {
    const v = Number(poids.replace(',', '.'));
    if (v >= 35 && v <= 300) {
      ajouterPesee({ date: jour, poidsKg: v });
      setPoids('');
    } else Alert.alert('Pesée', 'Entre ton poids en kg, par exemple 88,5.');
  };

  return (
    <Ecran titre="Aujourd'hui" sousTitre={dateLongue()}>
      <Carte>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Anneau valeur={total.kcal} cible={objectif.kcal}>
            <Texte type="grosChiffre" couleur={restant >= 0 ? C.text : C.danger}>
              {Math.abs(restant)}
            </Texte>
            <Texte type="label">{restant >= 0 ? 'KCAL RESTANTES' : 'KCAL EN TROP'}</Texte>
          </Anneau>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Texte type="chiffre">{Math.round(total.kcal)}</Texte>
            <Texte type="label">MANGÉES</Texte>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Texte type="chiffre" couleur={C.accent}>
              {objectif.kcal}
            </Texte>
            <Texte type="label">OBJECTIF</Texte>
          </View>
        </View>
      </Carte>

      <Carte>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Barre libelle="Protéines" valeur={total.p} cible={objectif.proteinesG} unite="g" couleur={C.orange} />
          <Barre libelle="Glucides" valeur={total.g} cible={objectif.glucidesG} unite="g" couleur={C.cyan} />
          <Barre libelle="Lipides" valeur={total.l} cible={objectif.lipidesG} unite="g" couleur={C.jaune} />
        </View>
      </Carte>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Bouton titre="+ Repas" onPress={() => router.navigate('/repas')} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="Coach IA" couleur={C.orange} onPress={() => router.navigate('/coach')} />
        </View>
      </View>

      <Carte>
        <Texte type="label">SÉANCE · SEMAINE {semaineNum}/12</Texte>
        <Texte type="gras">{semaine.bloc}</Texte>
        <Texte type="petit">
          {semaine.seances.length} séances cette semaine : {semaine.seances.map((s) => s.titre).join(', ')}.
        </Texte>
        <Bouton titre="Voir le programme" secondaire onPress={() => router.navigate('/sport')} />
      </Carte>

      <Carte>
        <Texte type="label">POIDS</Texte>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Texte type="chiffre">{moyenne ? moyenne.toFixed(1).replace('.', ',') : profil.poidsKg} kg</Texte>
            <Texte type="petit">moyenne 7 jours</Texte>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Texte type="chiffre" couleur={perdu > 0 ? C.accent : C.text}>
              {perdu > 0 ? `−${perdu.toFixed(1).replace('.', ',')}` : '0'} kg
            </Texte>
            <Texte type="petit">objectif {profil.poidsCibleKg} kg</Texte>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Champ keyboardType="decimal-pad" value={poids} onChangeText={setPoids} placeholder={`Pesée du jour (${profil.poidsKg})`} />
          </View>
          <Bouton titre="OK" secondaire onPress={peser} />
        </View>
        {vitesse !== null && (
          <Texte type="petit" couleur={vitesse < 0 ? C.accent : C.text}>
            {vitesse < -0.05
              ? `Tu perds environ ${(-vitesse).toFixed(1).replace('.', ',')} kg par semaine.`
              : vitesse > 0.05
                ? `Ton poids monte d’environ ${vitesse.toFixed(1).replace('.', ',')} kg par semaine ces 4 dernières semaines.`
                : 'Ton poids est stable ces 4 dernières semaines.'}
            {semainesRestantes ? ` À ce rythme, objectif atteint dans environ ${semainesRestantes} semaine${semainesRestantes > 1 ? 's' : ''}.` : ''}
          </Texte>
        )}
        <CourbePoids pesees={pesees} cible={profil.poidsCibleKg} aujourdhui={jour} />
      </Carte>

      <Carte accent={C.bordure}>
        <Texte type="label" couleur={C.orange}>
          CONSEIL DU JOUR
        </Texte>
        <Texte>{conseil}</Texte>
      </Carte>
    </Ecran>
  );
}
