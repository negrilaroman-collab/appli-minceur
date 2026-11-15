// Génération du programme de sport sur 12 semaines (3 blocs + 2 semaines d'allègement).

export type Niveau = 'debutant' | 'intermediaire' | 'avance';
export type Lieu = 'maison' | 'halteres' | 'salle';

export interface Exercice {
  nom: string;
  series: number;
  reps: string;
  reposS: number;
}

export interface Seance {
  titre: string;
  exercices: Exercice[];
  cardio?: string;
}

export interface Semaine {
  numero: number;
  bloc: 'Fondations' | 'Allègement' | 'Développement' | 'Intensification';
  seances: Seance[];
}

const EXOS: Record<Lieu, { bas: string[]; haut: string[]; tronc: string[] }> = {
  maison: {
    bas: ['Squat au poids du corps', 'Fentes alternées', 'Pont fessier'],
    haut: ['Pompes (genoux si besoin)', 'Dips sur chaise', 'Superman au sol'],
    tronc: ['Gainage planche', 'Mountain climbers'],
  },
  halteres: {
    bas: ['Goblet squat', 'Fentes avec haltères', 'Soulevé de terre roumain haltères'],
    haut: ['Pompes', 'Rowing haltère un bras', 'Développé épaules haltères'],
    tronc: ['Gainage planche', 'Russian twist'],
  },
  salle: {
    bas: ['Squat barre ou presse', 'Soulevé de terre roumain', 'Leg curl'],
    haut: ['Développé couché', 'Tirage vertical', 'Rowing assis'],
    tronc: ['Gainage planche', 'Relevés de genoux'],
  },
};

function blocDeSemaine(n: number): Semaine['bloc'] {
  if (n <= 4) return 'Fondations';
  if (n === 5 || n === 9) return 'Allègement';
  if (n <= 8) return 'Développement';
  return 'Intensification';
}

function parametres(bloc: Semaine['bloc'], n: number, niveau: Niveau) {
  const bonus = niveau === 'avance' ? 1 : 0;
  switch (bloc) {
    case 'Fondations':
      // +1 série en semaine 3-4 (progression de volume ≤ 10 %/sem en moyenne).
      return { series: 2 + (n >= 3 ? 1 : 0) + bonus, reps: '10-15', reposS: 60 };
    case 'Allègement':
      return { series: 2, reps: '10-12', reposS: 60 };
    case 'Développement':
      return { series: 3 + (n === 8 ? 1 : 0) + bonus, reps: '8-12', reposS: 75 };
    case 'Intensification':
      return { series: 3 + (n >= 11 ? 1 : 0) + bonus, reps: '6-10', reposS: 90 };
  }
}

export function genererProgramme(opts: {
  niveau: Niveau;
  lieu: Lieu;
  joursParSemaine: number; // 2 à 6
}): Semaine[] {
  const jours = Math.min(6, Math.max(2, opts.joursParSemaine));
  const muscu = Math.min(jours, 4);
  const e = EXOS[opts.lieu];
  const semaines: Semaine[] = [];

  for (let n = 1; n <= 12; n++) {
    const bloc = blocDeSemaine(n);
    const p = parametres(bloc, n, opts.niveau);
    const ex = (noms: string[]): Exercice[] => noms.map((nom) => ({ nom, ...p }));
    const seances: Seance[] = [];

    const splitHautBas = bloc !== 'Fondations' && bloc !== 'Allègement' && muscu >= 3;
    const nbMuscu = bloc === 'Allègement' ? Math.min(2, muscu) : bloc === 'Fondations' ? Math.min(3, muscu) : muscu;

    for (let i = 0; i < nbMuscu; i++) {
      if (splitHautBas) {
        const haut = i % 2 === 0;
        seances.push({
          titre: haut ? 'Haut du corps' : 'Bas du corps',
          exercices: ex(haut ? [...e.haut, e.tronc[0]] : [...e.bas, e.tronc[1]]),
        });
      } else {
        seances.push({ titre: 'Corps entier', exercices: ex([e.bas[0], e.haut[0], e.bas[1], e.haut[1], e.tronc[0]]) });
      }
    }

    const cardioRestant = jours - nbMuscu;
    for (let i = 0; i < Math.max(cardioRestant, bloc === 'Allègement' ? 1 : 0); i++) {
      const intervalles = (bloc === 'Développement' && i === 1) || (bloc === 'Intensification' && i >= 1);
      seances.push({
        titre: intervalles ? 'Cardio intervalles' : 'Cardio zone 2',
        exercices: [],
        cardio: bloc === 'Allègement'
          ? '30 min de marche'
          : intervalles
            ? '8 × (30 s rapide / 90 s lent), 5 min échauffement'
            : `${bloc === 'Fondations' ? 25 : bloc === 'Développement' ? 30 : 35} min à allure où tu peux parler`,
      });
    }

    semaines.push({ numero: n, bloc, seances });
  }
  return semaines;
}

/** Double progression : augmente la charge si toutes les séries atteignent le haut de la fourchette avec RPE ≤ 8. */
export function chargeSuivante(chargeKg: number, repsFaites: number[], fourchetteHaute: number, rpe: number): number {
  const reussi = repsFaites.length > 0 && repsFaites.every((r) => r >= fourchetteHaute) && rpe <= 8;
  if (rpe >= 10) return Math.round(chargeKg * 0.95 * 2) / 2;
  if (!reussi) return chargeKg;
  const hausse = Math.max(chargeKg * 0.025, 1);
  return Math.round((chargeKg + hausse) * 2) / 2;
}
