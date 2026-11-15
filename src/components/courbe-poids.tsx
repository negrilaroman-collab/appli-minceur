// Courbe du poids : pesées (points) et tendance sur 7 jours (ligne), avec la cible si elle est proche.
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { C, Segments, Texte } from '@/components/ui';
import { courbePoids, decalerJour, ecartJours } from '@/lib/suivi';

type Periode = '30' | '90' | 'tout';
const H = 170;
const MARGE = { haut: 12, bas: 22, gauche: 34, droite: 8 };
const virgule = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

export function CourbePoids({ pesees, cible, aujourdhui }: { pesees: { date: string; poidsKg: number }[]; cible: number; aujourdhui: string }) {
  const [periode, setPeriode] = useState<Periode>('30');
  const [largeur, setLargeur] = useState(0);

  const depuis = periode === 'tout' ? undefined : decalerJour(aujourdhui, -Number(periode) + 1);
  const pts = courbePoids(pesees, depuis);

  if (pesees.length < 2) {
    return <Texte type="petit">Pèse-toi au moins 2 jours (idéalement chaque matin) pour voir ta courbe apparaître ici.</Texte>;
  }

  const debut = depuis ?? pts[0]?.date ?? aujourdhui;
  const duree = Math.max(1, ecartJours(debut, aujourdhui));
  const valeurs = pts.flatMap((p) => [p.poidsKg, p.tendanceKg]);
  let min = Math.min(...valeurs);
  let max = Math.max(...valeurs);
  const cibleVisible = cible > 0 && cible >= min - 3;
  if (cibleVisible) min = Math.min(min, cible);
  if (max - min < 2) {
    const milieu = (max + min) / 2;
    min = milieu - 1;
    max = milieu + 1;
  }
  const w = largeur - MARGE.gauche - MARGE.droite;
  const h = H - MARGE.haut - MARGE.bas;
  const x = (date: string) => MARGE.gauche + (ecartJours(debut, date) / duree) * w;
  const y = (kg: number) => MARGE.haut + ((max - kg) / (max - min)) * h;
  const ligne = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.tendanceKg).toFixed(1)}`).join(' ');
  const graduations = [max, (max + min) / 2, min];
  const court = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <View style={{ gap: 8 }}>
      <Segments
        valeur={periode}
        onChange={setPeriode}
        options={[
          { valeur: '30', texte: '1 mois' },
          { valeur: '90', texte: '3 mois' },
          { valeur: 'tout', texte: 'Tout' },
        ]}
      />
      <View onLayout={(e) => setLargeur(e.nativeEvent.layout.width)} style={{ height: H }}>
        {largeur > 0 && (
          <Svg width={largeur} height={H}>
            {graduations.map((g) => (
              <Line key={g} x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(g)} y2={y(g)} stroke={C.bordure} strokeWidth={1} />
            ))}
            {graduations.map((g) => (
              <SvgText key={`t${g}`} x={MARGE.gauche - 4} y={y(g) + 4} fill={C.textSecondary} fontSize={10} textAnchor="end">
                {virgule(g)}
              </SvgText>
            ))}
            {cibleVisible && (
              <>
                <Line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(cible)} y2={y(cible)} stroke={C.orange} strokeWidth={1.5} strokeDasharray="5,4" />
                <SvgText x={largeur - MARGE.droite} y={y(cible) - 4} fill={C.orange} fontSize={10} textAnchor="end">
                  objectif
                </SvgText>
              </>
            )}
            {pts.map((p) => (
              <Circle key={p.date} cx={x(p.date)} cy={y(p.poidsKg)} r={3} fill={C.textSecondary} />
            ))}
            {pts.length > 1 && <Path d={ligne} stroke={C.accent} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
            <SvgText x={MARGE.gauche} y={H - 6} fill={C.textSecondary} fontSize={10}>
              {court(debut)}
            </SvgText>
            <SvgText x={largeur - MARGE.droite} y={H - 6} fill={C.textSecondary} fontSize={10} textAnchor="end">
              {court(aujourdhui)}
            </SvgText>
          </Svg>
        )}
      </View>
      <Texte type="petit">Points gris : tes pesées. Ligne verte : ta tendance (moyenne sur 7 jours), qui gomme les variations d’eau d’un jour à l’autre.</Texte>
    </View>
  );
}
