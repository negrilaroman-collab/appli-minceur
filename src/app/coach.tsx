import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, Modal, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance, type ViewInstance } from 'react-native';

import { C, Ecran, Texte } from '@/components/ui';
import { BottomTabInset } from '@/constants/theme';
import { demanderCoach, ErreurAnalyse, type MessageCoach } from '@/lib/ia';
import { objectifMacros } from '@/lib/nutrition';
import { choisirImage } from '@/lib/photo';
import { aujourdhui, useStore } from '@/lib/store';

const CLE = 'appli-minceur/coach-v1';
const MAX_MESSAGES = 40;

type Message = MessageCoach & { id: string; imageUri?: string; erreur?: boolean };

const SUGGESTIONS = [
  'Qu’est-ce que je mange ce soir ?',
  'Idée de petit-déj riche en protéines',
  'J’ai faim entre les repas, que faire ?',
  'Combien de kcal dans un kebab frites ?',
];

export default function CoachScreen() {
  const { profil, repas } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [attente, setAttente] = useState(false);
  const [grande, setGrande] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const racine = useRef<ViewInstance>(null);
  // Hauteur du clavier qui recouvre l'écran (Android affiche l'appli sous le clavier).
  const [clavier, setClavier] = useState<{ ouvert: boolean; recouvre: number }>({ ouvert: false, recouvre: 0 });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const montre = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      const hautClavier = e.endCoordinates.screenY;
      const repli = () => setClavier({ ouvert: true, recouvre: Math.max(0, e.endCoordinates.height - BottomTabInset) });
      if (!racine.current) return repli();
      racine.current.measureInWindow((_x, y, _l, h) => {
        if (!h) return repli();
        setClavier({ ouvert: true, recouvre: Math.max(0, y + h - hautClavier) });
        setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
      });
    });
    const cache = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setClavier({ ouvert: false, recouvre: 0 }),
    );
    return () => {
      montre.remove();
      cache.remove();
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((b) => b && setMessages(JSON.parse(b)))
      .catch(() => {});
  }, []);

  const sauver = (liste: Message[]) => {
    // On ne garde pas les photos en mémoire (trop lourdes), seulement le texte.
    const leger = liste.slice(-MAX_MESSAGES).map(({ imageBase64: _b, ...m }) => m);
    AsyncStorage.setItem(CLE, JSON.stringify(leger)).catch(() => {});
  };

  const contexte = () => {
    const obj = profil ? objectifMacros(profil) : { kcal: 2000, proteinesG: 120 };
    const duJour = repas.filter((r) => r.date === aujourdhui());
    return {
      objectifKcal: obj.kcal,
      proteinesG: obj.proteinesG,
      kcalMangees: duJour.reduce((s, r) => s + r.kcal, 0),
      proteinesMangees: duJour.reduce((s, r) => s + r.proteinesG, 0),
      repasDuJour: duJour.map((r) => `${r.nom} (${r.kcal} kcal)`),
      poidsKg: profil?.poidsKg ?? 0,
      poidsCibleKg: profil?.poidsCibleKg ?? 0,
    };
  };

  const envoyer = async (contenu?: string) => {
    const t = (contenu ?? texte).trim();
    if ((!t && !image) || attente) return;
    const nouveau: Message = {
      id: `${Date.now()}`,
      role: 'utilisateur',
      texte: t || (image ? 'Voici ce que j’ai. Que me conseilles-tu ?' : ''),
      imageBase64: image?.base64,
      imageUri: image?.uri,
    };
    const liste = [...messages.filter((m) => !m.erreur), nouveau];
    setMessages(liste);
    setTexte('');
    setImage(null);
    setAttente(true);
    try {
      const reponse = await demanderCoach(liste.slice(-20), contexte());
      const finale = [...liste, { id: `${Date.now()}-c`, role: 'coach' as const, texte: reponse }];
      setMessages(finale);
      sauver(finale);
    } catch (e) {
      const msg = e instanceof ErreurAnalyse ? e.message : 'Erreur inattendue.';
      // On retire le message qui n'a pas eu de réponse et on le remet dans la zone de texte.
      setTexte(contenu ? '' : t);
      if (nouveau.imageBase64 && nouveau.imageUri) setImage({ uri: nouveau.imageUri, base64: nouveau.imageBase64 });
      const aide = /clé/i.test(msg) ? '' : contenu ? '\n\nTouche à nouveau la suggestion pour réessayer.' : '\n\nTon message est remis en bas : touche ➤ pour réessayer.';
      setMessages([...liste.slice(0, -1), { id: `${Date.now()}-e`, role: 'coach', texte: msg + aide, erreur: true }]);
    } finally {
      setAttente(false);
    }
  };

  const ajouterPhoto = async (camera: boolean) => {
    const r = await choisirImage(camera);
    if (r && 'erreur' in r) Alert.alert('Photo', r.erreur);
    else if (r) setImage(r);
  };

  const menuPhoto = () =>
    Alert.alert('Ajouter une photo', 'Par exemple ton frigo, un plat ou une étiquette.', [
      { text: 'Prendre une photo', onPress: () => ajouterPhoto(true) },
      { text: 'Choisir dans la galerie', onPress: () => ajouterPhoto(false) },
      { text: 'Annuler', style: 'cancel' },
    ]);

  const effacer = () =>
    Alert.alert('Nouvelle conversation', 'Effacer toute la conversation avec le coach ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: () => {
          setMessages([]);
          AsyncStorage.removeItem(CLE).catch(() => {});
        },
      },
    ]);
  const [imagesCassees, setImagesCassees] = useState<Set<string>>(new Set());

  return (
    <Ecran titre="Coach" sousTitre="Ton coach IA" defilement={false}>
      <View ref={racine} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled">
          {messages.length === 0 && (
            <View style={{ gap: 10 }}>
              <Texte type="petit">
                Demande-moi une idée de repas, envoie une photo de ton frigo, ou décris ce que tu as mangé pour une estimation des kcal.
              </Texte>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => envoyer(s)} style={{ backgroundColor: C.backgroundElement, borderColor: C.bordure, borderWidth: 1, borderRadius: 14, padding: 12 }}>
                  <Texte>{s}</Texte>
                </Pressable>
              ))}
            </View>
          )}
          {messages.map((m) => {
            const moi = m.role === 'utilisateur';
            const versProfil = m.erreur && /clé/i.test(m.texte);
            return (
              <View key={m.id} style={{ alignSelf: moi ? 'flex-end' : 'flex-start', maxWidth: '86%', gap: 6, alignItems: moi ? 'flex-end' : 'flex-start' }}>
                {m.imageUri && !imagesCassees.has(m.imageUri) ? (
                  <Pressable onPress={() => setGrande(m.imageUri!)}>
                    <Image
                      source={{ uri: m.imageUri }}
                      onError={() => setImagesCassees((s) => new Set(s).add(m.imageUri!))}
                      style={{ width: 220, height: 165, borderRadius: 16, backgroundColor: C.backgroundElement }} />
                  </Pressable>
                ) : null}
              <View
                style={{
                  backgroundColor: moi ? C.accent : C.backgroundElement,
                  borderColor: m.erreur ? C.danger : C.bordure,
                  borderWidth: moi ? 0 : 1,
                  borderRadius: 18,
                  borderBottomRightRadius: moi ? 4 : 18,
                  borderBottomLeftRadius: moi ? 18 : 4,
                  padding: 12,
                  gap: 8,
                }}>
                <Texte couleur={moi ? C.accentText : m.erreur ? C.danger : C.text}>{m.texte}</Texte>
                {versProfil && (
                  <Pressable onPress={() => router.navigate({ pathname: '/profil', params: { cle: '1' } })} style={{ alignSelf: 'flex-start', backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Texte type="gras" couleur={C.accentText}>
                      Aller au Profil pour ajouter la clé
                    </Texte>
                  </Pressable>
                )}
              </View>
              </View>
            );
          })}
          {attente && (
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8 }}>
              <ActivityIndicator color={C.accent} />
              <Texte type="petit">Le coach réfléchit…</Texte>
            </View>
          )}
          {messages.length > 0 && !attente && (
            <Pressable onPress={effacer} style={{ alignSelf: 'center', padding: 6 }}>
              <Texte type="petit">Nouvelle conversation</Texte>
            </Pressable>
          )}
        </ScrollView>

        {image && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, marginBottom: 8, backgroundColor: C.backgroundElement, borderColor: C.bordure, borderWidth: 1, borderRadius: 16 }}>
            <Pressable onPress={() => setGrande(image.uri)}>
              <Image source={{ uri: image.uri }} style={{ width: 64, height: 64, borderRadius: 12 }} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Texte type="gras">Photo jointe</Texte>
              <Texte type="petit">Touche-la pour la voir en grand</Texte>
            </View>
            <Pressable onPress={() => setImage(null)} hitSlop={8} style={rond(C.backgroundSelected)}>
              <Texte type="gras" couleur={C.danger}>
                ✕
              </Texte>
            </Pressable>
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            paddingTop: 4,
            paddingBottom: clavier.ouvert ? clavier.recouvre + 8 : BottomTabInset + 8,
          }}>
          <Pressable onPress={menuPhoto} style={rond(C.backgroundSelected)}>
            <Texte type="gras">📷</Texte>
          </Pressable>
          <TextInput
            value={texte}
            onChangeText={setTexte}
            placeholder="Écris au coach…"
            placeholderTextColor={C.textSecondary}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              color: C.text,
              backgroundColor: C.backgroundElement,
              borderColor: C.bordure,
              borderWidth: 1,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 11,
              fontSize: 16,
            }}
          />
          <Pressable onPress={() => envoyer()} style={rond(texte.trim() || image ? C.accent : C.backgroundSelected)}>
            <Texte type="gras" couleur={texte.trim() || image ? C.accentText : C.textSecondary}>
              ➤
            </Texte>
          </Pressable>
        </View>
      </View>

      <Modal visible={!!grande} transparent animationType="fade" onRequestClose={() => setGrande(null)}>
        <Pressable onPress={() => setGrande(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}>
          {grande && <Image source={{ uri: grande }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          <View style={{ position: 'absolute', top: 48, right: 20, ...rond(C.backgroundSelected) }}>
            <Texte type="gras">✕</Texte>
          </View>
          <View style={{ position: 'absolute', bottom: 48, alignSelf: 'center' }}>
            <Texte type="petit">Touche l’écran pour fermer</Texte>
          </View>
        </Pressable>
      </Modal>
    </Ecran>
  );
}

const rond = (fond: string) => ({ width: 46, height: 46, borderRadius: 23, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: fond });
