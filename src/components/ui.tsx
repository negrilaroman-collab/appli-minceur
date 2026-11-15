// Composants d'interface partagés — style « sombre et sportif ».
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { BottomTabInset, Colors, Spacing } from '@/constants/theme';

export const C = Colors.dark;
/** Couleur d'accent principale (vert fluo). */
export const VERT = C.accent;

export function Titre({ children, sousTitre }: { children: ReactNode; sousTitre?: string }) {
  return (
    <View style={{ gap: 2 }}>
      {sousTitre ? <Text style={styles.surTitre}>{sousTitre.toUpperCase()}</Text> : null}
      <Text style={styles.titre}>{children}</Text>
    </View>
  );
}

export function Ecran({ titre, sousTitre, children, defilement = true }: { titre: string; sousTitre?: string; children: ReactNode; defilement?: boolean }) {
  const contenu = (
    <>
      <Titre sousTitre={sousTitre}>{titre}</Titre>
      {children}
    </>
  );
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {defilement ? (
          <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
            {contenu}
          </ScrollView>
        ) : (
          <View style={[styles.contenu, { flex: 1, paddingBottom: 0 }]}>{contenu}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

export function Carte({ children, accent }: { children: ReactNode; accent?: string }) {
  return <View style={[styles.carte, accent ? { borderColor: accent } : null]}>{children}</View>;
}

export function Texte({
  children,
  type = 'normal',
  couleur,
  style,
}: {
  children: ReactNode;
  type?: 'normal' | 'petit' | 'gras' | 'label' | 'chiffre' | 'grosChiffre';
  couleur?: string;
  style?: object;
}) {
  return <Text style={[styles[type], couleur ? { color: couleur } : null, style]}>{children}</Text>;
}

export function Bouton({
  titre,
  onPress,
  secondaire,
  couleur,
  desactive,
}: {
  titre: string;
  onPress: () => void;
  secondaire?: boolean;
  couleur?: string;
  desactive?: boolean;
}) {
  const fond = secondaire ? C.backgroundSelected : couleur ?? C.accent;
  return (
    <Pressable
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [styles.bouton, { backgroundColor: fond, opacity: desactive ? 0.4 : pressed ? 0.75 : 1 }]}>
      <Text style={[styles.boutonTexte, { color: secondaire ? C.text : C.accentText }]}>{titre}</Text>
    </Pressable>
  );
}

export function Champ({ libelle, style, ...props }: TextInputProps & { libelle?: string }) {
  return (
    <View style={{ gap: Spacing.one }}>
      {libelle ? <Text style={styles.label}>{libelle}</Text> : null}
      <TextInput placeholderTextColor={C.textSecondary} style={[styles.champ, style]} {...props} />
    </View>
  );
}

export function Choix<T extends string>({
  libelle,
  options,
  valeur,
  onChange,
}: {
  libelle?: string;
  options: { valeur: T; texte: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: Spacing.one }}>
      {libelle ? <Text style={styles.label}>{libelle}</Text> : null}
      <View style={styles.choix}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <Pressable key={o.valeur} onPress={() => onChange(o.valeur)} style={[styles.puce, actif ? styles.puceActive : null]}>
              <Text style={[styles.puceTexte, { color: actif ? C.accentText : C.text }]}>{o.texte}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Onglets segmentés (ex. Photo / Décrire / À la main). */
export function Segments<T extends string>({ options, valeur, onChange }: { options: { valeur: T; texte: string }[]; valeur: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segments}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable key={o.valeur} onPress={() => onChange(o.valeur)} style={[styles.segment, actif ? { backgroundColor: C.accent } : null]}>
            <Text style={[styles.puceTexte, { color: actif ? C.accentText : C.textSecondary, fontWeight: '800' }]}>{o.texte}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Barre({
  libelle,
  valeur,
  cible,
  unite,
  couleur = C.accent,
  decimales = 0,
  plusEstMieux = false,
}: {
  libelle: string;
  valeur: number;
  cible: number;
  unite: string;
  couleur?: string;
  decimales?: number;
  plusEstMieux?: boolean;
}) {
  const ratio = cible > 0 ? Math.min(valeur / cible, 1) : 0;
  const depasse = valeur > cible && !plusEstMieux;
  const fmt = (n: number) => n.toFixed(decimales).replace('.', ',');
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={styles.label}>{libelle.toUpperCase()}</Text>
      <Text style={styles.chiffre} numberOfLines={1} adjustsFontSizeToFit>
        {decimales ? fmt(valeur) : Math.round(valeur)}
        <Text style={styles.petit}>{` / ${decimales ? String(Number(cible.toFixed(decimales))).replace('.', ',') : cible} ${unite}`}</Text>
      </Text>
      <View style={styles.piste}>
        <View style={[styles.remplissage, { width: `${ratio * 100}%`, backgroundColor: depasse ? C.danger : couleur }]} />
      </View>
    </View>
  );
}

/** Anneau de progression des kcal. */
export function Anneau({ valeur, cible, taille = 210, epaisseur = 16, children }: { valeur: number; cible: number; taille?: number; epaisseur?: number; children?: ReactNode }) {
  const r = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * r;
  const ratio = cible > 0 ? Math.min(valeur / cible, 1) : 0;
  const couleur = valeur > cible ? C.danger : C.accent;
  return (
    <View style={{ width: taille, height: taille, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={taille} height={taille} style={StyleSheet.absoluteFill}>
        <Circle cx={taille / 2} cy={taille / 2} r={r} stroke={C.backgroundSelected} strokeWidth={epaisseur} fill="none" />
        <Circle
          cx={taille / 2}
          cy={taille / 2}
          r={r}
          stroke={couleur}
          strokeWidth={epaisseur}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circonference} ${circonference}`}
          strokeDashoffset={circonference * (1 - ratio)}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  surTitre: { color: C.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  titre: { color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  carte: { backgroundColor: C.backgroundElement, borderRadius: 22, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: C.bordure },
  normal: { color: C.text, fontSize: 16, lineHeight: 23 },
  petit: { color: C.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  gras: { color: C.text, fontSize: 16, fontWeight: '800' },
  label: { color: C.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  chiffre: { color: C.text, fontSize: 22, fontWeight: '900' },
  grosChiffre: { color: C.text, fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  bouton: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center' },
  boutonTexte: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  champ: {
    borderWidth: 1,
    borderColor: C.bordure,
    backgroundColor: C.background,
    color: C.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  puce: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.backgroundSelected },
  puceActive: { backgroundColor: C.accent },
  puceTexte: { fontSize: 13, fontWeight: '700' },
  segments: { flexDirection: 'row', backgroundColor: C.backgroundElement, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: C.bordure },
  segment: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  piste: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: C.backgroundSelected },
  remplissage: { height: '100%', borderRadius: 4 },
});
