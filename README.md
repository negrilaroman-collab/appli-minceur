# Appli Minceur

Appli mobile (Android d'abord) pour perdre du poids : calcul des besoins en kcal et macros, journal des repas, programme de sport sur 12 semaines et suivi du poids.

Fiche complète du projet : https://claude.ai/artifact/A64jxs65iAFk4ZtqKpb1KS

## Ce qui marche déjà (étape 1, en cours)

- **Profil** : calcul du métabolisme de base (Mifflin-St Jeor), de la dépense totale, de l'objectif kcal (déficit 15 à 25 %, plafonné à 750 kcal, jamais sous 1 500 kcal pour un homme / 1 200 pour une femme) et des macros.
- **Aujourd'hui** : kcal restantes, barres protéines / lipides / glucides, pesée du jour et moyenne sur 7 jours.
- **Repas** : photo de l'assiette analysée par l'IA (Gemini gratuit par défaut, ou Claude payant) (aliments, grammes, kcal avec fourchette). Si l'IA doute (confiance < 0,7 ou fourchette > ± 20 %), elle pose 1 à 3 questions à boutons, au plus 2 fois. Tu peux ensuite ajuster chaque portion (± 10 %) ou retirer un aliment avant de valider. Ajout manuel aussi possible.
- **Sport** : programme de 12 semaines généré selon le niveau, le lieu et le nombre de jours (semaines 5 et 9 allégées).

À venir : base nutritionnelle CIQUAL intégrée (pour l'instant, les valeurs pour 100 g viennent de l'IA), mémorisation de tes portions habituelles, bilan hebdomadaire automatique.

## Clé API pour la photo

Dans l'onglet **Profil**, choisis le service puis colle ta clé :

- **Gemini (gratuit, par défaut)** : crée une clé gratuite sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey) avec un compte Google. Le quota gratuit est limité par jour. Avec la version gratuite, Google peut utiliser les photos envoyées pour améliorer ses produits.
- **Claude (payant)** : clé sur [console.anthropic.com](https://console.anthropic.com/settings/keys), environ 2 centimes par photo avec Sonnet 5.5.

Chaque personne peut utiliser sa propre clé, ou partager la même (le quota est alors partagé). La clé est stockée chiffrée sur le téléphone et n'est jamais dans le code. L'appli appelle le service directement depuis le téléphone : c'est adapté à un petit groupe de proches, pas à une appli publique.

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
