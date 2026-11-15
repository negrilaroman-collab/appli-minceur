// Parcours photo : prise de vue → analyse → questions si doute → correction → validation.
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Bouton, Carte, Champ, VERT } from '@/components/ui';
import { analyser, ErreurAnalyse, premierTour, tourReponses, type Tour } from '@/lib/claude';
import {
  ajusterPortion,
  arrondirTotaux,
  doitPoserQuestions,
  totaux,
  type AnalysePhoto,
} from '@/lib/photo-logic';
import { useTheme } from '@/hooks/use-theme';

type Etape =
  | { nom: 'repos' }
  | { nom: 'analyse' }
  | { nom: 'questions'; analyse: AnalysePhoto }
  | { nom: 'resultat'; analyse: AnalysePhoto }
  | { nom: 'erreur'; message: string };

export interface ResultatPhoto {
  nom: string;
  kcal: number;
  proteinesG: number;
  lipidesG: number;
  glucidesG: number;
}

export function PhotoRepas({ onValider }: { onValider: (r: ResultatPhoto) => void }) {
  const theme = useTheme();
  const [etape, setEtape] = useState<Etape>({ nom: 'repos' });
  const [image, setImage] = useState<string | null>(null);
  const [precision, setPrecision] = useState('');
  const [historique, setHistorique] = useState<Tour[]>([]);
  const [tours, setTours] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({});

  const lancer = async (tourList: Tour[], toursFaits: number) => {
    setEtape({ nom: 'analyse' });
    try {
      const { analyse, historique: h } = await analyser(tourList);
      setHistorique(h);
      setReponses({});
      if (doitPoserQuestions(analyse, toursFaits)) setEtape({ nom: 'questions', analyse });
      else setEtape({ nom: 'resultat', analyse });
    } catch (e) {
      setEtape({ nom: 'erreur', message: e instanceof ErreurAnalyse ? e.message : 'Erreur inattendue, réessaie.' });
    }
  };

  const choisirPhoto = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setEtape({ nom: 'erreur', message: camera ? "Autorise l'accès à l'appareil photo." : "Autorise l'accès aux photos." });
      return;
    }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled || !res.assets[0]) return;

    // Réduit l'image (1024 px) pour un envoi rapide et sous la limite de taille de l'API.
    const petite = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 1024 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (!petite.base64) {
      setEtape({ nom: 'erreur', message: 'Impossible de lire la photo.' });
      return;
    }
    setImage(petite.uri);
    setTours(0);
    const h = [premierTour(petite.base64, precision.trim())];
    await lancer(h, 0);
  };

  const envoyerReponses = async (analyse: AnalysePhoto) => {
    const liste = analyse.questions
      .filter((q) => reponses[q.id])
      .map((q) => ({ question: q.question, reponse: reponses[q.id] }));
    if (liste.length === 0) {
      setEtape({ nom: 'resultat', analyse });
      return;
    }
    const n = tours + 1;
    setTours(n);
    await lancer([...historique, tourReponses(liste)], n);
  };

  const reinitialiser = () => {
    setEtape({ nom: 'repos' });
    setImage(null);
    setPrecision('');
    setHistorique([]);
    setTours(0);
  };

  const Fourchette = ({ analyse }: { analyse: AnalysePhoto }) => {
    const t = arrondirTotaux(totaux(analyse.aliments));
    return (
      <View style={{ alignItems: 'center' }}>
        <ThemedText type="subtitle" style={{ color: VERT }}>
          {t.kcal} kcal
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          entre {t.kcalMin} et {t.kcalMax} kcal · P {t.proteinesG} g · L {t.lipidesG} g · G {t.glucidesG} g
        </ThemedText>
      </View>
    );
  };

  return (
    <Carte>
      <ThemedText type="smallBold">Photo de l'assiette</ThemedText>
      {image && <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />}

      {etape.nom === 'repos' && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Photographie le plat de haut, en entier, avec une fourchette à côté pour l'échelle.
          </ThemedText>
          <Champ libelle="Précision (facultatif)" value={precision} onChangeText={setPrecision} placeholder="ex. cuit à l'huile d'olive, moitié mangée" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Bouton titre="Prendre une photo" onPress={() => choisirPhoto(true)} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton titre="Galerie" secondaire onPress={() => choisirPhoto(false)} />
            </View>
          </View>
        </>
      )}

      {etape.nom === 'analyse' && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <ActivityIndicator color={VERT} />
          <ThemedText type="small" themeColor="textSecondary">
            Analyse du repas…
          </ThemedText>
        </View>
      )}

      {etape.nom === 'erreur' && (
        <>
          <ThemedText type="small" style={{ color: '#D9534F' }}>
            {etape.message}
          </ThemedText>
          <Bouton titre="Recommencer" secondaire onPress={reinitialiser} />
        </>
      )}

      {etape.nom === 'questions' && (
        <>
          <Fourchette analyse={etape.analyse} />
          <ThemedText type="small">J'ai un doute, aide-moi à être plus précis :</ThemedText>
          {etape.analyse.questions.map((q) => (
            <View key={q.id} style={{ gap: 6 }}>
              <ThemedText type="smallBold">{q.question}</ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {q.options.map((o) => {
                  const actif = reponses[q.id] === o;
                  return (
                    <Pressable
                      key={o}
                      onPress={() => setReponses((r) => ({ ...r, [q.id]: o }))}
                      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: actif ? VERT : theme.backgroundSelected }}>
                      <ThemedText type="small" style={{ color: actif ? '#fff' : theme.text }}>
                        {o}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Bouton titre="Affiner l'estimation" onPress={() => envoyerReponses(etape.analyse)} />
          <Bouton titre="Passer" secondaire onPress={() => setEtape({ nom: 'resultat', analyse: etape.analyse })} />
        </>
      )}

      {etape.nom === 'resultat' && (
        <>
          {etape.analyse.aliments.length === 0 ? (
            <ThemedText type="small">{etape.analyse.remarque || 'Aucun aliment reconnu.'}</ThemedText>
          ) : (
            <>
              <Fourchette analyse={etape.analyse} />
              {etape.analyse.aliments.map((a, i) => (
                <View key={`${a.nom}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small">
                      {a.nom} · {a.grammes} g · {Math.round((a.grammes * a.kcal100g) / 100)} kcal
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {a.cuisson}
                    </ThemedText>
                  </View>
                  {(['−', '+'] as const).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        const aliments = etape.analyse.aliments.map((x, j) => (j === i ? ajusterPortion(x, s === '+' ? 1.1 : 0.9) : x));
                        setEtape({ nom: 'resultat', analyse: { ...etape.analyse, aliments } });
                      }}
                      style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundSelected }}>
                      <ThemedText>{s}</ThemedText>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => {
                      const aliments = etape.analyse.aliments.filter((_, j) => j !== i);
                      setEtape({ nom: 'resultat', analyse: { ...etape.analyse, aliments } });
                    }}>
                    <ThemedText type="small" style={{ color: '#D9534F' }}>
                      ✕
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
              {etape.analyse.remarque ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {etape.analyse.remarque}
                </ThemedText>
              ) : null}
              <Bouton
                titre="Valider ce repas"
                onPress={() => {
                  const t = arrondirTotaux(totaux(etape.analyse.aliments));
                  onValider({
                    nom: etape.analyse.aliments.map((a) => a.nom).join(', '),
                    kcal: t.kcal,
                    proteinesG: t.proteinesG,
                    lipidesG: t.lipidesG,
                    glucidesG: t.glucidesG,
                  });
                  reinitialiser();
                }}
              />
            </>
          )}
          <Bouton titre="Annuler" secondaire onPress={reinitialiser} />
        </>
      )}
    </Carte>
  );
}
