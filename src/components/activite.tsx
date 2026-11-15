// Carte « Activité » : pas du jour lus dans Health Connect (téléphone + montre connectée).
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, Pressable, View } from 'react-native';

import { Barre, Bouton, C, Carte, Texte } from '@/components/ui';
import { connecterSante, etatSante, installerHealthConnect, lirePas, lirePoids, ouvrirReglagesSante, type EtatSante } from '@/lib/sante';
import { useStore } from '@/lib/store';
import { kcalParJour } from '@/lib/suivi';

export const OBJECTIF_PAS = 8000;
const milliers = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');

export function CarteActivite({ jour }: { jour: string }) {
  const { pas, santeConnectee, enregistrerPas, definirSanteConnectee, importerPesees } = useStore();
  const [etat, setEtat] = useState<EtatSante | null>(null);
  const [chargement, setChargement] = useState(false);

  // Revérifié au retour dans l'appli : après l'installation de Health Connect depuis le Play Store,
  // ou pour actualiser les pas quand on revient sur l'appli (useFocusEffect ne se déclenche pas dans ce cas).
  const auRetour = useRef(() => {});
  useEffect(() => {
    const maj = () => etatSante().then(setEtat);
    maj();
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      maj();
      auRetour.current();
    });
    return () => sub.remove();
  }, []);

  const synchroniser = useCallback(async () => {
    try {
      enregistrerPas(await lirePas(jour));
      importerPesees(await lirePoids(jour));
    } catch {
      // Accès retiré dans les réglages : on le signalera au prochain appui sur « Connecter ».
      definirSanteConnectee(false);
    }
  }, [jour, enregistrerPas, importerPesees, definirSanteConnectee]);

  // Les fonctions du store changent à chaque mise à jour : on passe par une ref pour ne pas relancer la synchro en boucle.
  const synchroRef = useRef(synchroniser);
  synchroRef.current = synchroniser;
  auRetour.current = () => {
    if (santeConnectee && etat === 'pret') synchroniser();
  };
  useFocusEffect(
    useCallback(() => {
      if (santeConnectee && etat === 'pret') synchroRef.current();
    }, [santeConnectee, etat]),
  );

  if (Platform.OS !== 'android' || etat === null || etat === 'indisponible') return null;

  const connecter = async () => {
    setChargement(true);
    try {
      const ok = await connecterSante();
      definirSanteConnectee(ok);
      if (ok) await synchroniser();
      else
        Alert.alert('Accès refusé', 'Pour voir tes pas, autorise « Pas » pour Appli Minceur dans Health Connect.', [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Ouvrir Health Connect', onPress: ouvrirReglagesSante },
        ]);
    } catch {
      Alert.alert('Health Connect', 'Impossible de se connecter à Health Connect pour le moment.');
    } finally {
      setChargement(false);
    }
  };

  if (etat === 'a-installer') {
    return (
      <Carte>
        <Texte type="label" couleur={C.jaune}>
          ACTIVITÉ
        </Texte>
        <Texte type="petit">Pour voir tes pas (téléphone ou montre), installe ou mets à jour l’appli gratuite Health Connect de Google.</Texte>
        <Bouton titre="Installer Health Connect" secondaire onPress={installerHealthConnect} />
      </Carte>
    );
  }

  if (!santeConnectee) {
    return (
      <Carte>
        <Texte type="label" couleur={C.jaune}>
          ACTIVITÉ
        </Texte>
        <Texte type="gras">Affiche tes pas ici</Texte>
        <Texte type="petit">
          L’appli lit tes pas dans Health Connect, l’appli Santé d’Android. Elle regroupe les pas du téléphone et ceux de ta montre connectée (Samsung, Garmin, Fitbit, Xiaomi, etc.), si l’appli de ta montre est reliée à Health Connect. Si tu as une balance connectée, tes pesées arrivent aussi toutes seules.
        </Texte>
        <Bouton titre={chargement ? 'Connexion…' : 'Connecter mes pas'} desactive={chargement} onPress={connecter} />
      </Carte>
    );
  }

  const duJour = pas[jour] ?? 0;
  const semaine = kcalParJour([], jour, 7).map((d) => pas[d.date] ?? 0);
  const moyenne = semaine.reduce((s, x) => s + x, 0) / 7;

  return (
    <Carte>
      <Texte type="label" couleur={C.jaune}>
        ACTIVITÉ
      </Texte>
      <Barre libelle={`Pas · ${milliers(duJour)}`} valeur={duJour / 1000} cible={OBJECTIF_PAS / 1000} unite="k pas" couleur={C.jaune} decimales={1} plusEstMieux />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 }}>
        {semaine.map((n, i) => (
          <View key={i} style={{ flex: 1, height: `${Math.max(4, Math.min(100, (n / (OBJECTIF_PAS * 1.5)) * 100))}%`, backgroundColor: n >= OBJECTIF_PAS ? C.jaune : C.backgroundSelected, borderRadius: 4 }} />
        ))}
      </View>
      <Texte type="petit">
        Moyenne sur 7 jours : {milliers(moyenne)} pas. {duJour >= OBJECTIF_PAS ? 'Objectif du jour atteint, bravo !' : `Encore ${milliers(OBJECTIF_PAS - duJour)} pas pour atteindre ${milliers(OBJECTIF_PAS)}.`}
      </Texte>
      <Pressable onPress={synchroniser} style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
        <Texte type="petit" couleur={C.jaune}>
          ↻ Actualiser
        </Texte>
      </Pressable>
    </Carte>
  );
}
