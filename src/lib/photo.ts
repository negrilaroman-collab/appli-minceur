// Prise de photo / choix dans la galerie, réduite à 1024 px en JPEG base64.
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type ResultatImage = { uri: string; base64: string } | { erreur: string } | null;

export async function choisirImage(camera: boolean): Promise<ResultatImage> {
  try {
    return await choisir(camera);
  } catch {
    return { erreur: camera ? "Impossible d'ouvrir l'appareil photo." : "Impossible d'ouvrir la photo." };
  }
}

async function choisir(camera: boolean): Promise<ResultatImage> {
  // La galerie passe par le sélecteur de photos du système : pas besoin de permission.
  if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return { erreur: "Autorise l'accès à l'appareil photo." };
  const res = camera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const petite = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 1024 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!petite.base64) return { erreur: 'Impossible de lire la photo.' };
  return { uri: petite.uri, base64: petite.base64 };
}
