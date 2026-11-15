// État de l'appli (profil, repas, pesées), sauvegardé sur le téléphone.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Profil } from './nutrition';
import type { Lieu, Niveau } from './training';

export interface ProfilComplet extends Profil {
  niveauSport: Niveau;
  lieuSport: Lieu;
  joursSport: number;
  debutProgramme: string; // ISO date
}

export interface Repas {
  id: string;
  date: string; // YYYY-MM-DD
  moment: 'petit-dej' | 'dejeuner' | 'diner' | 'collation' | 'boisson';
  nom: string;
  kcal: number;
  proteinesG: number;
  lipidesG: number;
  glucidesG: number;
}

export interface Pesee {
  date: string; // YYYY-MM-DD
  poidsKg: number;
}

export interface BilanEnregistre {
  date: string;
  kcalAvant: number;
  kcalApres: number;
  perteKg: number | null;
}

interface Donnees {
  profil: ProfilComplet | null;
  repas: Repas[];
  pesees: Pesee[];
  bilans: BilanEnregistre[];
  seancesFaites: string[]; // clés « début du cycle:semaine:séance »
  eauMl: Record<string, number>; // eau bue par jour (YYYY-MM-DD → ml)
  pas: Record<string, number>; // pas par jour lus dans Health Connect
  santeConnectee: boolean;
}

interface Store extends Donnees {
  pret: boolean;
  enregistrerProfil: (p: ProfilComplet) => void;
  ajouterRepas: (r: Omit<Repas, 'id'>) => void;
  supprimerRepas: (id: string) => void;
  ajouterPesee: (p: Pesee) => void;
  enregistrerBilan: (b: BilanEnregistre) => void;
  basculerSeance: (cle: string) => void;
  ajouterEau: (date: string, ml: number) => void;
  enregistrerPas: (pas: Record<string, number>) => void;
  definirSanteConnectee: (v: boolean) => void;
  /** Ajoute les pesées venues d'une balance connectée, sans écraser celles notées à la main. */
  importerPesees: (p: Pesee[]) => void;
}

export const cleSeance = (debutProgramme: string, semaine: number, seance: number) => `${debutProgramme}:${semaine}:${seance}`;

const CLE = 'appli-minceur/v1';
const VIDE: Donnees = { profil: null, repas: [], pesees: [], bilans: [], seancesFaites: [], eauMl: {}, pas: {}, santeConnectee: false };
const Ctx = createContext<Store | null>(null);

export function aujourdhui(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const jj = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${jj}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [donnees, setDonnees] = useState<Donnees>(VIDE);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((brut) => {
        if (brut) setDonnees({ ...VIDE, ...JSON.parse(brut) });
      })
      .catch(() => {})
      .finally(() => setPret(true));
  }, []);

  useEffect(() => {
    if (pret) AsyncStorage.setItem(CLE, JSON.stringify(donnees)).catch(() => {});
  }, [donnees, pret]);

  const store = useMemo<Store>(
    () => ({
      ...donnees,
      pret,
      enregistrerProfil: (profil) => setDonnees((d) => ({ ...d, profil })),
      ajouterRepas: (r) =>
        setDonnees((d) => ({ ...d, repas: [...d.repas, { ...r, id: `${Date.now()}-${Math.random()}` }] })),
      supprimerRepas: (id) => setDonnees((d) => ({ ...d, repas: d.repas.filter((r) => r.id !== id) })),
      ajouterPesee: (p) =>
        setDonnees((d) => ({
          ...d,
          pesees: [...d.pesees.filter((x) => x.date !== p.date), p].sort((a, b) => a.date.localeCompare(b.date)),
          profil: d.profil ? { ...d.profil, poidsKg: p.poidsKg } : d.profil,
        })),
      enregistrerBilan: (b) =>
        setDonnees((d) => ({
          ...d,
          bilans: [...d.bilans, b],
          profil: d.profil ? { ...d.profil, ajustementKcal: (d.profil.ajustementKcal ?? 0) + (b.kcalApres - b.kcalAvant) } : d.profil,
        })),
      ajouterEau: (date, ml) => setDonnees((d) => ({ ...d, eauMl: { ...d.eauMl, [date]: Math.max(0, (d.eauMl[date] ?? 0) + ml) } })),
      enregistrerPas: (pas) => setDonnees((d) => ({ ...d, pas: { ...d.pas, ...pas } })),
      definirSanteConnectee: (v) => setDonnees((d) => ({ ...d, santeConnectee: v })),
      importerPesees: (liste) =>
        setDonnees((d) => {
          const nouvelles = liste.filter((p) => !d.pesees.some((x) => x.date === p.date));
          if (!nouvelles.length) return d;
          const pesees = [...d.pesees, ...nouvelles].sort((a, b) => a.date.localeCompare(b.date));
          const derniere = pesees[pesees.length - 1];
          return { ...d, pesees, profil: d.profil ? { ...d.profil, poidsKg: derniere.poidsKg } : d.profil };
        }),
      basculerSeance: (cle) =>
        setDonnees((d) => ({
          ...d,
          seancesFaites: d.seancesFaites.includes(cle) ? d.seancesFaites.filter((c) => c !== cle) : [...d.seancesFaites, cle],
        })),
    }),
    [donnees, pret],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore doit être utilisé dans StoreProvider');
  return s;
}
