# Fiche Google Play – textes à copier-coller

Package (définitif, ne peut plus changer) : `com.appliminceur.app`
Politique de confidentialité : https://github.com/negrilaroman-collab/appli-minceur/blob/photo-kcal/docs/politique-confidentialite.md

## Fiche principale (Croissance > Présence sur le Store > Fiche principale)

**Nom de l'application** (30 caractères max)
```
Appli Minceur – Calories photo
```

**Description courte** (80 caractères max)
```
Photo de ton assiette = calories. Coach IA, courbe de poids et programme sport.
```

**Description complète** (4000 caractères max)
```
Appli Minceur t'aide à perdre du poids sans te prendre la tête : tu photographies ton repas, l'appli estime les calories, et tu vois en un coup d'œil ce qu'il te reste pour la journée.

📸 CALORIES EN PHOTO
Prends ton assiette en photo : l'intelligence artificielle reconnaît les aliments, estime les portions et les calories. Si elle hésite, elle te pose une ou deux questions (« cuit au beurre ? », « quelle taille de part ? ») pour être plus précise. Tu peux aussi décrire ton repas avec tes mots ou le saisir à la main.

🎯 TON OBJECTIF CALCULÉ POUR TOI
À partir de ton âge, ta taille, ton poids et ton activité, l'appli calcule tes besoins, ton objectif de calories et tes protéines, glucides et lipides. Chaque semaine, un bilan regarde ta courbe de poids et ajuste l'objectif si besoin.

📉 COURBE DE POIDS
Note ta pesée du jour : la courbe de tendance lisse les variations d'eau et te montre ta vraie progression, avec une estimation de la date d'arrivée à ton objectif.

💬 COACH IA
Pose tes questions au coach : idées de repas avec ce qu'il reste dans ton frigo (en photo), recettes riches en protéines adaptées aux calories qui te restent, conseils nutrition et sport.

🏋️ PROGRAMME SPORT
Un programme de 12 semaines, à la maison ou en salle, adapté à ton niveau, avec la progression semaine après semaine et les séances cochées.

👟 PAS ET POIDS AVEC HEALTH CONNECT
Si tu le souhaites, l'appli lit tes pas et ton poids dans Health Connect (téléphone, montre, balance connectée).

🔒 TES DONNÉES RESTENT CHEZ TOI
Pas de compte, pas de publicité, pas de traceur. Ton journal reste sur ton téléphone. Les analyses photo et le coach utilisent Google Gemini avec ta propre clé gratuite (l'appli t'explique comment la créer en 2 minutes).

Les calories et conseils sont des estimations et ne remplacent pas l'avis d'un médecin ou d'un diététicien.
```

**Catégorie** : Santé et remise en forme
**Tags** : Compteur de calories, Perte de poids, Nutrition, Entraînement
**E-mail de contact** : une adresse que tu veux bien rendre publique (elle s'affiche sur la fiche).

**Images** (dans le dossier `store/`)
- Icône 512 × 512 : `store/icone-512.png`
- Image de présentation 1024 × 500 : `store/banniere-1024x500.png`
- Captures téléphone : 2 à 8 images. Fais des captures sur ton téléphone (Accueil, Repas après une analyse photo, Courbe de poids, Coach, Sport) et envoie-les-moi : je les mets au bon format (Google refuse les images plus de 2 fois plus hautes que larges, ce qui est le cas des captures brutes de la plupart des téléphones).

## Contenu de l'application (Règles > Contenu de l'application)

| Rubrique | Réponse |
|---|---|
| Règles de confidentialité | l'URL ci-dessus |
| Accès à l'application | « Toutes les fonctionnalités sont disponibles sans restriction d'accès » (pas de compte). Dans la note, préciser : « L'analyse photo et le coach demandent une clé Gemini gratuite que l'utilisateur crée lui-même (guide intégré dans l'onglet Profil). » |
| Annonces | Non, pas de publicité |
| Classification du contenu | Catégorie « Toutes les autres applis ». Réponds Non à violence, sexualité, langage, drogues, jeux d'argent. Interaction entre utilisateurs : Non. |
| Public cible | 18 ans et plus uniquement (évite les règles « Familles » et c'est cohérent pour une appli minceur) |
| Applis d'actualités | Non |
| Applis de santé | Coche « Gestion de la nutrition et du poids » et « Activité physique et remise en forme ». Ce n'est PAS un dispositif médical. |
| Health Connect | Déclare `Pas` (READ_STEPS) : « Afficher l'activité du jour et de la semaine ». `Poids` (READ_WEIGHT) : « Remplir la courbe de poids à partir de la balance ou d'autres applis ». Lecture seule. |
| Fonctionnalités financières | Aucune |
| Appli gouvernementale | Non |
| ID publicitaire | Non, l'appli ne l'utilise pas |

## Sécurité des données (formulaire « Data safety »)

- L'appli collecte-t-elle ou partage-t-elle des données ? **Oui** (les photos et textes envoyés à Gemini comptent comme « collectés »).
- Toutes les données sont-elles chiffrées en transit ? **Oui** (HTTPS).
- Les utilisateurs peuvent-ils demander la suppression ? **Oui** (tout est sur le téléphone : suppression des données de l'appli ou désinstallation).

Types de données à cocher (pour chacun : **Collectées : oui · Partagées : non · Traitement éphémère : non · Obligatoire : non, l'utilisateur choisit · Finalité : Fonctionnalités de l'application**) :

| Catégorie | Type |
|---|---|
| Photos et vidéos | Photos |
| Santé et remise en forme | Informations de santé (poids, régime/allergies) |
| Santé et remise en forme | Informations de remise en forme (repas, calories, séances) |
| Messages | Autres messages intégrés à l'appli (questions au coach) |

Ne PAS cocher : localisation, contacts, identifiants, données financières, e-mail, historique de navigation. Les pas lus dans Health Connect restent sur le téléphone : non collectés.
