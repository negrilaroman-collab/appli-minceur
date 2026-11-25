import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { Bouton, C, Carte, Texte } from '@/components/ui';
import { LIEN_APK, majDisponible, versionPubliee } from '@/lib/mise-a-jour';

const versionInstallee = Constants.expoConfig?.android?.versionCode;

/** Bandeau « Nouvelle version disponible » (Android uniquement). */
export function BandeauMiseAJour() {
  const [dispo, setDispo] = useState(false);
  const [cache, setCache] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const verifier = () => versionPubliee().then((v) => setDispo(majDisponible(versionInstallee, v)));
    verifier();
    const abo = AppState.addEventListener('change', (etat) => etat === 'active' && verifier());
    return () => abo.remove();
  }, []);

  if (!dispo || cache) return null;
  return (
    <Carte accent={C.accent}>
      <Texte type="gras">Nouvelle version disponible 🎉</Texte>
      <Texte type="petit">
        Appuie sur « Mettre à jour » : le fichier se télécharge, ouvre-le puis appuie sur « Mettre à jour » ou « Installer ». Tes données sont gardées.
      </Texte>
      <Bouton titre="Mettre à jour" onPress={() => Linking.openURL(LIEN_APK)} />
      <Bouton titre="Plus tard" secondaire onPress={() => setCache(true)} />
    </Carte>
  );
}
