import { router } from 'expo-router';
// Estimation d'un repas par l'IA, à partir d'une photo ou d'une description :
// analyse → questions si doute → correction des portions → validation.
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { Bouton, C, Carte, Champ, Texte } from '@/components/ui';
import { demarrerAnalyse, ErreurAnalyse, repondreQuestions, type Session } from '@/lib/ia';
import { choisirImage } from '@/lib/photo';
import { ajusterPortion, arrondirTotaux, doitPoserQuestions, totaux, type AnalysePhoto } from '@/lib/photo-logic';

type Etape =
  | { nom: 'repos' }
  | { nom: 'analyse' }
  | { nom: 'questions'; analyse: AnalysePhoto }
  | { nom: 'resultat'; analyse: AnalysePhoto }
  | { nom: 'erreur'; message: string };

export interface ResultatEstimation {
  nom: string;
  kcal: number;
  proteinesG: number;
  lipidesG: number;
  glucidesG: number;
}

export function EstimationRepas({ mode, onValider }: { mode: 'photo' | 'texte'; onValider: (r: ResultatEstimation) => void }) {
  const [etape, setEtape] = useState<Etape>({ nom: 'repos' });
  const [image, setImage] = useState<string | null>(null);
  const [texte, setTexte] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [tours, setTours] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({});

  // Dernier appel lancé, pour pouvoir réessayer sans reprendre la photo.
  const dernier = useRef<(() => Promise<void>) | null>(null);

  const lancer = async (appel: () => Promise<{ analyse: AnalysePhoto; session: Session }>, toursFaits: number) => {
    dernier.current = () => lancer(appel, toursFaits);
    setEtape({ nom: 'analyse' });
    try {
      const { analyse, session: s } = await appel();
      setSession(s);
      setReponses({});
      setEtape(doitPoserQuestions(analyse, toursFaits) ? { nom: 'questions', analyse } : { nom: 'resultat', analyse });
    } catch (e) {
      setEtape({ nom: 'erreur', message: e instanceof ErreurAnalyse ? e.message : 'Erreur inattendue, réessaie.' });
    }
  };

  const photo = async (camera: boolean) => {
    const r = await choisirImage(camera);
    if (!r) return;
    if ('erreur' in r) return setEtape({ nom: 'erreur', message: r.erreur });
    setImage(r.uri);
    setTours(0);
    await lancer(() => demarrerAnalyse(r.base64, texte.trim()), 0);
  };

  const decrire = async () => {
    if (texte.trim().length < 3) return;
    setTours(0);
    await lancer(() => demarrerAnalyse(null, texte.trim()), 0);
  };

  const envoyerReponses = async (analyse: AnalysePhoto) => {
    const liste = analyse.questions.filter((q) => reponses[q.id]).map((q) => ({ question: q.question, reponse: reponses[q.id] }));
    if (liste.length === 0 || !session) return setEtape({ nom: 'resultat', analyse });
    const n = tours + 1;
    setTours(n);
    await lancer(() => repondreQuestions(session, liste), n);
  };

  const reinitialiser = () => {
    setEtape({ nom: 'repos' });
    setImage(null);
    setTexte('');
    setSession(null);
    setTours(0);
    dernier.current = null;
  };

  const majAliments = (analyse: AnalysePhoto, aliments: AnalysePhoto['aliments']) =>
    setEtape({ nom: 'resultat', analyse: { ...analyse, aliments } });

  const Total = ({ analyse }: { analyse: AnalysePhoto }) => {
    const t = arrondirTotaux(totaux(analyse.aliments));
    return (
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Texte type="grosChiffre" couleur={C.accent}>
          {t.kcal}
        </Texte>
        <Texte type="label">KCAL · ENTRE {t.kcalMin} ET {t.kcalMax}</Texte>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
          <Texte type="petit" couleur={C.orange}>P {t.proteinesG} g</Texte>
          <Texte type="petit" couleur={C.cyan}>G {t.glucidesG} g</Texte>
          <Texte type="petit" couleur={C.jaune}>L {t.lipidesG} g</Texte>
        </View>
      </View>
    );
  };

  return (
    <Carte>
      {image && <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 16 }} resizeMode="cover" />}

      {etape.nom === 'repos' && mode === 'photo' && (
        <>
          <Texte type="gras">Photographie ton assiette</Texte>
          <Texte type="petit">De haut, en entier, avec une fourchette à côté pour l'échelle.</Texte>
          <Champ value={texte} onChangeText={setTexte} placeholder="Précision (facultatif) : cuit au beurre, moitié mangée…" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Bouton titre="📷 Photo" onPress={() => photo(true)} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton titre="Galerie" secondaire onPress={() => photo(false)} />
            </View>
          </View>
        </>
      )}

      {etape.nom === 'repos' && mode === 'texte' && (
        <>
          <Texte type="gras">Décris ce que tu as mangé</Texte>
          <Texte type="petit">Je calcule les kcal pour toi et je te pose une question si c'est flou.</Texte>
          <Champ
            value={texte}
            onChangeText={setTexte}
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
            placeholder="ex. une assiette de pâtes bolognaise, un yaourt nature et une pomme"
          />
          <Bouton titre="Estimer les kcal" onPress={decrire} desactive={texte.trim().length < 3} />
        </>
      )}

      {etape.nom === 'analyse' && (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Texte type="petit">J'analyse ton repas…</Texte>
        </View>
      )}

      {etape.nom === 'erreur' && (
        <>
          <Texte couleur={C.danger}>{etape.message}</Texte>
          {/clé/i.test(etape.message) && (
            <Bouton titre="Aller au Profil pour ajouter la clé" onPress={() => router.navigate({ pathname: '/profil', params: { cle: '1' } })} />
          )}
          {dernier.current && !/clé/i.test(etape.message) && (
            <Bouton titre={image ? 'Réessayer avec la même photo' : 'Réessayer'} onPress={() => dernier.current?.()} />
          )}
          <Bouton titre="Recommencer" secondaire onPress={reinitialiser} />
        </>
      )}

      {etape.nom === 'questions' && (
        <>
          <Total analyse={etape.analyse} />
          <Texte type="gras">J'ai un doute, aide-moi à être plus précis :</Texte>
          {etape.analyse.questions.map((q) => (
            <View key={q.id} style={{ gap: 8 }}>
              <Texte>{q.question}</Texte>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {q.options.map((o) => {
                  const actif = reponses[q.id] === o;
                  return (
                    <Pressable
                      key={o}
                      onPress={() => setReponses((r) => ({ ...r, [q.id]: o }))}
                      style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: actif ? C.accent : C.backgroundSelected }}>
                      <Texte type="petit" couleur={actif ? C.accentText : C.text}>
                        {o}
                      </Texte>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Bouton titre="Affiner" onPress={() => envoyerReponses(etape.analyse)} />
          <Bouton titre="Passer" secondaire onPress={() => setEtape({ nom: 'resultat', analyse: etape.analyse })} />
        </>
      )}

      {etape.nom === 'resultat' && (
        <>
          {etape.analyse.aliments.length === 0 ? (
            <Texte>{etape.analyse.remarque || 'Aucun aliment reconnu.'}</Texte>
          ) : (
            <>
              <Total analyse={etape.analyse} />
              {etape.analyse.aliments.map((a, i) => (
                <View key={`${a.nom}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Texte type="gras">{a.nom}</Texte>
                    <Texte type="petit">
                      {a.grammes} g · {Math.round((a.grammes * a.kcal100g) / 100)} kcal · {a.cuisson}
                    </Texte>
                  </View>
                  {(['−', '+'] as const).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => majAliments(etape.analyse, etape.analyse.aliments.map((x, j) => (j === i ? ajusterPortion(x, s === '+' ? 1.1 : 0.9) : x)))}
                      style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.backgroundSelected }}>
                      <Texte type="gras">{s}</Texte>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => majAliments(etape.analyse, etape.analyse.aliments.filter((_, j) => j !== i))} hitSlop={8}>
                    <Texte couleur={C.danger}>✕</Texte>
                  </Pressable>
                </View>
              ))}
              {etape.analyse.remarque ? (
                <Texte type="petit" couleur={C.orange}>
                  {etape.analyse.remarque}
                </Texte>
              ) : null}
              <Bouton
                titre="Ajouter au journal"
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
