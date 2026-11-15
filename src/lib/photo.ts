// Prise de photo / choix dans la galerie, réduite à 1024 px en JPEG base64.
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type ResultatImage = { uri: string; base64: string } | { erreur: string } | null;

export async function choisirImage(camera: boolean): Promise<ResultatImage> {
  const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { erreur: camera ? "Autorise l'accès à l'appareil photo." : "Autorise l'accès aux photos." };
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
