# Appli Minceur

Appli mobile (Android d'abord) pour perdre du poids : calcul des besoins en kcal et macros, journal des repas, programme de sport sur 12 semaines et suivi du poids.

Fiche complète du projet : https://claude.ai/artifact/A64jxs65iAFk4ZtqKpb1KS

## Ce qui marche déjà (étape 1, en cours)

- **Profil** : calcul du métabolisme de base (Mifflin-St Jeor), de la dépense totale, de l'objectif kcal (déficit 15 à 25 %, plafonné à 750 kcal, jamais sous 1 500 kcal pour un homme / 1 200 pour une femme) et des macros.
- **Aujourd'hui** : kcal restantes, barres protéines / lipides / glucides, pesée du jour et moyenne sur 7 jours.
- **Repas** : ajout manuel d'un aliment avec ses kcal et macros, liste par moment de la journée.
- **Sport** : programme de 12 semaines généré selon le niveau, le lieu et le nombre de jours (semaines 5 et 9 allégées).

À venir : photo de l'assiette analysée par l'IA avec questions en cas de doute, base nutritionnelle CIQUAL, bilan hebdomadaire automatique.

## Lancer l'appli sur ton téléphone Android

1. Installe [Node.js](https://nodejs.org) (version 20 ou plus) sur ton ordinateur.
2. Installe l'appli **Expo Go** depuis le Play Store sur ton téléphone.
3. Dans un terminal :
   ```bash
   git clone https://github.com/negrilaroman-collab/appli-minceur
   cd appli-minceur
   npm install
   npx expo start
   ```
4. Scanne le QR code affiché avec Expo Go (téléphone et ordinateur sur le même Wi-Fi).

## Commandes utiles

```bash
npm test          # tests des calculs (kcal, macros, programme)
npm run typecheck # vérification TypeScript
```

## Structure

- `src/lib/nutrition.ts` : calculs diététiques
- `src/lib/training.ts` : génération du programme de sport
- `src/lib/store.tsx` : données sauvegardées sur le téléphone
- `src/app/` : écrans (Aujourd'hui, Repas, Sport, Profil)

Conseils généraux uniquement : l'appli ne remplace pas un avis médical.
