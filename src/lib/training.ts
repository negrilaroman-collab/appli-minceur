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
    haut: ['Pompes (genoux si besoin)', 'Rowing avec une serviette ou sous une table', 'Superman au sol'],
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

// Exercices tenus en secondes, pas en répétitions.
const EN_SECONDES = new Set(['Gainage planche', 'Mountain climbers']);

function parametres(bloc: Semaine['bloc'], n: number, niveau: Niveau, lieu: Lieu) {
  // Intermédiaire : +1 série après les 4 premières semaines ; avancé : +1 série partout et repos plus courts.
  const bonus = niveau === 'avance' ? 1 : niveau === 'intermediaire' && bloc !== 'Fondations' && bloc !== 'Allègement' ? 1 : 0;
  const moinsRepos = niveau === 'avance' ? 15 : 0;
  // Au poids du corps, on progresse en ajoutant des répétitions (moins de reps rendrait l'effort plus facile).
  const poidsDuCorps = lieu === 'maison';
  switch (bloc) {
    case 'Fondations':
      // +1 série en semaine 3-4 (progression de volume ≤ 10 %/sem en moyenne).
      return { series: 2 + (n >= 3 ? 1 : 0) + bonus, reps: '10-15', secondes: '20-30 s', reposS: 60 - moinsRepos };
    case 'Allègement':
      return { series: 2, reps: '10-12', secondes: '20-30 s', reposS: 60 };
    case 'Développement':
      return { series: 3 + (n === 8 ? 1 : 0) + bonus, reps: poidsDuCorps ? '12-20' : '8-12', secondes: '30-45 s', reposS: 75 - moinsRepos };
    case 'Intensification':
      return {
        series: 3 + (n >= 11 ? 1 : 0) + bonus,
        reps: poidsDuCorps ? '15-25, descente lente (3 s)' : '6-10',
        secondes: '40-60 s',
        reposS: 90 - moinsRepos,
      };
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
    const p = parametres(bloc, n, opts.niveau, opts.lieu);
    const ex = (noms: string[]): Exercice[] =>
      noms.map((nom) => ({ nom, series: p.series, reps: EN_SECONDES.has(nom) ? p.secondes : p.reps, reposS: p.reposS }));
    const seances: Seance[] = [];

    const splitHautBas = bloc !== 'Fondations' && bloc !== 'Allègement' && muscu >= 3;
    // Semaine allégée : on garde au moins une marche, sans dépasser le nombre de jours choisi.
    const nbMuscu = bloc === 'Allègement' ? Math.min(2, muscu, jours - 1) : bloc === 'Fondations' ? Math.min(3, muscu) : muscu;
    const corpsEntier = (): Seance => ({ titre: 'Corps entier', exercices: ex([e.bas[0], e.haut[0], e.bas[1], e.haut[1], e.tronc[0]]) });
    const haut = (): Seance => ({ titre: 'Haut du corps', exercices: ex([...e.haut, e.tronc[0]]) });
    const bas = (): Seance => ({ titre: 'Bas du corps', exercices: ex([...e.bas, e.tronc[1]]) });

    for (let i = 0; i < nbMuscu; i++) {
      if (!splitHautBas) seances.push(corpsEntier());
      // 3 jours : bas / haut / corps entier, pour équilibrer jambes et haut du corps.
      else if (nbMuscu === 3) seances.push([bas, haut, corpsEntier][i]());
      else seances.push(i % 2 === 0 ? haut() : bas());
    }

    const cardioRestant = jours - nbMuscu;
    for (let i = 0; i < cardioRestant; i++) {
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
