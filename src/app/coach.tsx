import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from 'react-native';

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
  const scroll = useRef<ScrollViewInstance>(null);

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
      const msg = e instanceof ErreurAnalyse ? e.message : 'Erreur inattendue, réessaie.';
      setMessages([...liste, { id: `${Date.now()}-e`, role: 'coach', texte: msg, erreur: true }]);
    } finally {
      setAttente(false);
    }
  };

  const ajouterPhoto = async (camera: boolean) => {
    const r = await choisirImage(camera);
    if (r && !('erreur' in r)) setImage(r);
  };

  const effacer = () => {
    setMessages([]);
    AsyncStorage.removeItem(CLE).catch(() => {});
  };

  return (
    <Ecran titre="Coach" sousTitre="Ton coach IA" defilement={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            return (
              <View
                key={m.id}
                style={{
                  alignSelf: moi ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  backgroundColor: moi ? C.accent : C.backgroundElement,
                  borderColor: m.erreur ? C.danger : C.bordure,
                  borderWidth: moi ? 0 : 1,
                  borderRadius: 18,
                  borderBottomRightRadius: moi ? 4 : 18,
                  borderBottomLeftRadius: moi ? 18 : 4,
                  padding: 12,
                  gap: 8,
                }}>
                {m.imageUri ? <Image source={{ uri: m.imageUri }} style={{ width: 200, height: 150, borderRadius: 12 }} /> : null}
                <Texte couleur={moi ? C.accentText : m.erreur ? C.danger : C.text}>{m.texte}</Texte>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
            <Image source={{ uri: image.uri }} style={{ width: 56, height: 56, borderRadius: 10 }} />
            <Pressable onPress={() => setImage(null)}>
              <Texte type="petit" couleur={C.danger}>
                Retirer la photo
              </Texte>
            </Pressable>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: BottomTabInset + 8 }}>
          <Pressable onPress={() => ajouterPhoto(true)} onLongPress={() => ajouterPhoto(false)} style={rond(C.backgroundSelected)}>
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
      </KeyboardAvoidingView>
    </Ecran>
  );
}

const rond = (fond: string) => ({ width: 46, height: 46, borderRadius: 23, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: fond });
