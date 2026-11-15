# Appli Minceur

Appli Android pour perdre du poids, pour un petit groupe de proches : suivi des kcal, estimation des repas par IA (photo ou description), coach IA, programme de sport sur 12 semaines et suivi du poids.

Fiche complète du projet : https://claude.ai/artifact/A64jxs65iAFk4ZtqKpb1KS

## Fonctionnalités

- **Aujourd'hui** : anneau des kcal restantes, protéines / glucides / lipides, séance de la semaine, pesée et moyenne sur 7 jours, conseil du jour.
- **Repas** : trois façons d'ajouter un repas.
  - *Photo* : l'IA reconnaît les aliments et estime grammes et kcal, avec une fourchette.
  - *Décrire* : tu écris ce que tu as mangé (« pâtes bolognaise et un yaourt »), l'IA calcule les kcal.
  - *À la main* : saisie libre.

  Si l'IA doute (confiance < 0,7 ou fourchette > ± 20 %), elle pose 1 à 3 questions à boutons, au plus 2 fois. Tu peux ajuster chaque portion (± 10 %) ou retirer un aliment avant de valider.
- **Coach** : discussion avec un coach IA qui connaît ton objectif et ce que tu as mangé aujourd'hui. Idées de repas, photo du frigo (bouton appareil photo, appui long pour la galerie), estimation de kcal, questions nutrition et sport.
- **Sport** : programme de 12 semaines selon ton niveau, ton lieu et tes jours disponibles (semaines 5 et 9 allégées).
- **Profil** : calcul des besoins (Mifflin-St Jeor, déficit plafonné à 750 kcal, jamais sous 1 500 kcal pour un homme / 1 200 pour une femme) et clé IA.

## Installer l'APK

Le dernier APK est publié automatiquement dans les [Releases](https://github.com/negrilaroman-collab/appli-minceur/releases/tag/apk) à chaque mise à jour (workflow `APK Android`). Ouvre `appli-minceur.apk` sur le téléphone, autorise l'installation, puis « Installer quand même » si Play Protect avertit.

## Clé IA (Gemini, gratuite)

Dans l'onglet **Profil**, colle une clé créée gratuitement sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey) avec un compte Google. Chaque personne peut avoir sa propre clé, ou partager la même (le quota quotidien est alors partagé). La clé est stockée chiffrée sur le téléphone et l'appli appelle Gemini directement. Avec la version gratuite, Google peut utiliser les photos envoyées pour améliorer ses produits.

## Développement

```bash
npm install
npx expo start    # puis scanner le QR code avec Expo Go
npm test          # tests (kcal, macros, programme, logique photo, Gemini simulé)
npm run typecheck # vérification TypeScript
```

## Structure

- `src/lib/nutrition.ts` : calculs diététiques
- `src/lib/training.ts` : génération du programme de sport
- `src/lib/gemini.ts`, `src/lib/ia.ts`, `src/lib/ia-texte.ts` : appels à Gemini, consignes de l'IA
- `src/lib/photo-logic.ts` : totaux, fourchettes, décision de poser des questions
- `src/lib/store.tsx` : données sauvegardées sur le téléphone
- `src/components/ui.tsx` : composants du thème sombre
- `src/app/` : écrans (Aujourd'hui, Repas, Coach, Sport, Profil)

Conseils généraux uniquement : l'appli ne remplace pas un avis médical.
