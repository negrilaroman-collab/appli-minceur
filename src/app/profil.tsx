import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Bouton, Carte, Champ, Choix, Ecran } from '@/components/ui';
import {
  LIBELLES_ACTIVITE,
  depenseTotale,
  metabolismeDeBase,
  objectifMacros,
  perteHebdoAttendue,
  type NiveauActivite,
  type Rythme,
  type Sexe,
} from '@/lib/nutrition';
import {
  enregistrerCleApi,
  enregistrerFournisseur,
  LIBELLES_FOURNISSEUR,
  LIENS_CLE,
  lireCleApi,
  lireFournisseur,
  type Fournisseur,
} from '@/lib/ia-commun';
import { aujourdhui, useStore, type ProfilComplet } from '@/lib/store';
import type { Lieu, Niveau } from '@/lib/training';

const nombre = (s: string) => Number(s.replace(',', '.'));

export default function ProfilScreen() {
  const { profil, enregistrerProfil, ajouterPesee } = useStore();
  const [sexe, setSexe] = useState<Sexe>(profil?.sexe ?? 'homme');
  const [age, setAge] = useState(String(profil?.age ?? ''));
  const [taille, setTaille] = useState(String(profil?.tailleCm ?? ''));
  const [poids, setPoids] = useState(String(profil?.poidsKg ?? ''));
  const [cible, setCible] = useState(String(profil?.poidsCibleKg ?? ''));
  const [activite, setActivite] = useState<NiveauActivite>(profil?.activite ?? 'leger');
  const [rythme, setRythme] = useState<Rythme>(profil?.rythme ?? 'normal');
  const [niveau, setNiveau] = useState<Niveau>(profil?.niveauSport ?? 'debutant');
  const [lieu, setLieu] = useState<Lieu>(profil?.lieuSport ?? 'maison');
  const [jours, setJours] = useState(String(profil?.joursSport ?? 3));
  const [cleApi, setCleApi] = useState('');
  const [aUneCle, setAUneCle] = useState(false);
  const [fournisseur, setFournisseur] = useState<Fournisseur>('gemini');

  useEffect(() => {
    lireFournisseur().then(setFournisseur);
  }, []);
  useEffect(() => {
    lireCleApi(fournisseur).then((c) => setAUneCle(!!c));
  }, [fournisseur]);

  const changerFournisseur = async (f: Fournisseur) => {
    setFournisseur(f);
    await enregistrerFournisseur(f);
  };

  const sauverCle = async () => {
    await enregistrerCleApi(fournisseur, cleApi);
    setAUneCle(!!cleApi.trim());
    setCleApi('');
    Alert.alert(cleApi.trim() ? 'Clé enregistrée' : 'Clé supprimée', cleApi.trim() ? 'La photo des repas est prête.' : '');
  };

  const brouillon: ProfilComplet = {
    sexe,
    age: nombre(age),
    tailleCm: nombre(taille),
    poidsKg: nombre(poids),
    poidsCibleKg: nombre(cible) || nombre(poids),
    activite,
    rythme,
    niveauSport: niveau,
    lieuSport: lieu,
    joursSport: Math.min(6, Math.max(2, nombre(jours) || 3)),
    debutProgramme: profil?.debutProgramme ?? aujourdhui(),
  };
  const valide =
    brouillon.age >= 16 && brouillon.age <= 100 && brouillon.tailleCm >= 120 && brouillon.tailleCm <= 230 &&
    brouillon.poidsKg >= 35 && brouillon.poidsKg <= 300;

  const enregistrer = () => {
    if (!valide) {
      Alert.alert('Profil incomplet', "Vérifie l'âge (16-100), la taille en cm et le poids en kg.");
      return;
    }
    enregistrerProfil(brouillon);
    if (!profil || profil.poidsKg !== brouillon.poidsKg) ajouterPesee({ date: aujourdhui(), poidsKg: brouillon.poidsKg });
    router.navigate('/');
  };

  const macros = valide ? objectifMacros(brouillon) : null;

  return (
    <Ecran titre="Mon profil">
      <Carte>
        <Choix libelle="Sexe" valeur={sexe} onChange={setSexe} options={[{ valeur: 'homme', texte: 'Homme' }, { valeur: 'femme', texte: 'Femme' }]} />
        <Champ libelle="Âge" keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="30" />
        <Champ libelle="Taille (cm)" keyboardType="number-pad" value={taille} onChangeText={setTaille} placeholder="180" />
        <Champ libelle="Poids actuel (kg)" keyboardType="decimal-pad" value={poids} onChangeText={setPoids} placeholder="90" />
        <Champ libelle="Poids visé (kg)" keyboardType="decimal-pad" value={cible} onChangeText={setCible} placeholder="80" />
      </Carte>

      <Carte>
        <Choix
          libelle="Activité au quotidien"
          valeur={activite}
          onChange={setActivite}
          options={(Object.keys(LIBELLES_ACTIVITE) as NiveauActivite[]).map((k) => ({ valeur: k, texte: LIBELLES_ACTIVITE[k] }))}
        />
        <Choix
          libelle="Rythme de perte"
          valeur={rythme}
          onChange={setRythme}
          options={[
            { valeur: 'doux', texte: 'Doux' },
            { valeur: 'normal', texte: 'Normal' },
            { valeur: 'rapide', texte: 'Rapide' },
          ]}
        />
      </Carte>

      <Carte>
        <ThemedText type="smallBold">Sport</ThemedText>
        <Choix
          libelle="Niveau"
          valeur={niveau}
          onChange={setNiveau}
          options={[
            { valeur: 'debutant', texte: 'Débutant' },
            { valeur: 'intermediaire', texte: 'Intermédiaire' },
            { valeur: 'avance', texte: 'Avancé' },
          ]}
        />
        <Choix
          libelle="Lieu"
          valeur={lieu}
          onChange={setLieu}
          options={[
            { valeur: 'maison', texte: 'Maison sans matériel' },
            { valeur: 'halteres', texte: 'Maison avec haltères' },
            { valeur: 'salle', texte: 'Salle' },
          ]}
        />
        <Champ libelle="Jours de sport par semaine (2 à 6)" keyboardType="number-pad" value={jours} onChangeText={setJours} />
      </Carte>

      {macros && (
        <Carte>
          <ThemedText type="smallBold">Tes chiffres</ThemedText>
          <ThemedText type="small">Métabolisme de base : {metabolismeDeBase(brouillon)} kcal</ThemedText>
          <ThemedText type="small">Dépense totale : {depenseTotale(brouillon)} kcal</ThemedText>
          <ThemedText type="small">
            Objectif : {macros.kcal} kcal/jour · {macros.proteinesG} g protéines · {macros.lipidesG} g lipides · {macros.glucidesG} g glucides
          </ThemedText>
          <ThemedText type="small">Perte attendue : environ {perteHebdoAttendue(brouillon).toFixed(2).replace('.', ',')} kg/semaine</ThemedText>
        </Carte>
      )}

      <Bouton titre="Enregistrer" onPress={enregistrer} />

      <Carte>
        <ThemedText type="smallBold">IA pour la photo des repas</ThemedText>
        <Choix
          libelle="Service"
          valeur={fournisseur}
          onChange={changerFournisseur}
          options={(['gemini', 'claude'] as Fournisseur[]).map((f) => ({ valeur: f, texte: LIBELLES_FOURNISSEUR[f] }))}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {aUneCle ? 'Une clé est enregistrée pour ce service.' : 'Aucune clé enregistrée pour ce service.'} Elle est stockée chiffrée sur ton téléphone.
          {fournisseur === 'gemini' ? ' Avec la version gratuite, Google peut utiliser tes photos pour améliorer ses produits.' : ''}
        </ThemedText>
        <Bouton titre="Obtenir une clé" secondaire onPress={() => Linking.openURL(LIENS_CLE[fournisseur])} />
        <Champ
          libelle={aUneCle ? 'Remplacer la clé (laisser vide pour la supprimer)' : 'Colle ta clé ici'}
          value={cleApi}
          onChangeText={setCleApi}
          placeholder={fournisseur === 'gemini' ? 'AIza...' : 'sk-ant-...'}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Bouton titre="Enregistrer la clé" secondaire onPress={sauverCle} />
      </Carte>
      <ThemedText type="small" themeColor="textSecondary">
        Conseils généraux, ne remplace pas un avis médical. En cas de maladie, grossesse ou troubles alimentaires, demande l'avis d'un professionnel.
      </ThemedText>
    </Ecran>
  );
}
