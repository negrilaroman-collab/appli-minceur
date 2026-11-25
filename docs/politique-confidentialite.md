# Politique de confidentialité – Appli Minceur

_Dernière mise à jour : 25 novembre 2026_

Appli Minceur est une application personnelle de suivi alimentaire et sportif, développée par un particulier (Roman, contact : voir la fiche Google Play de l'application). Cette page explique quelles données l'application utilise et où elles vont.

## En résumé

- **Pas de compte, pas de serveur à nous.** Tout ce que tu saisis reste sur ton téléphone.
- **Pas de publicité, pas de traceur, pas de revente de données.**
- Les seules données qui quittent ton téléphone sont celles que tu envoies volontairement à **Google Gemini** pour analyser un repas ou parler au coach, avec **ta propre clé Gemini**.

## Données stockées sur ton téléphone

L'application enregistre localement (dans la mémoire de l'application sur ton téléphone) :

- ton profil : prénom, âge, sexe, taille, poids, poids visé, niveau d'activité, régime ou allergies éventuels ;
- ton journal : repas et calories, boissons, pesées, séances de sport faites ;
- ta clé Gemini, dans le stockage chiffré du téléphone (Android Keystore).

Ces données ne sont envoyées à personne par l'application. Elles sont effacées si tu désinstalles l'application ou si tu vides ses données dans les paramètres Android.

## Health Connect (pas et poids)

Si tu l'autorises, l'application **lit** dans Health Connect :

- ton **nombre de pas** (pour afficher ton activité de la journée et de la semaine) ;
- ton **poids** (pour remplir ta courbe de poids).

L'application n'écrit rien dans Health Connect. Ces données sont affichées dans l'application et gardées sur ton téléphone. Ton poids peut faire partie du contexte envoyé au coach Gemini (voir plus bas) quand tu lui écris. Les données Health Connect ne sont jamais utilisées pour de la publicité, jamais vendues, et ne sont transmises à aucun autre tiers. Tu peux retirer cette autorisation à tout moment dans Paramètres > Health Connect.

L'utilisation des informations reçues de Health Connect respecte la [politique d'autorisations de Health Connect](https://support.google.com/googleplay/android-developer/answer/12991134), y compris les exigences d'utilisation limitée (« Limited Use »).

## Appareil photo et photos

L'appareil photo sert uniquement à photographier un repas ou ton frigo. La photo est envoyée à Google Gemini pour estimer les calories ou proposer des idées de repas, puis n'est pas conservée par l'application au-delà de l'affichage.

## Données envoyées à Google Gemini

Quand tu analyses un repas (photo ou description) ou que tu écris au coach, l'application envoie à l'API Google Gemini (generativelanguage.googleapis.com), par une connexion chiffrée (HTTPS) :

- la photo ou la description du repas, et tes réponses aux questions ;
- pour le coach : ton message et un résumé de ta journée (objectif et calories du jour, repas du jour, poids et poids visé, régime ou allergies indiqués).

Ces envois utilisent **ta propre clé Gemini**, créée sur ton compte Google : c'est donc ton compte Google qui fait la demande, et Google traite ces données selon ses propres conditions : [conditions de l'API Gemini](https://ai.google.dev/gemini-api/terms) et [règles de confidentialité Google](https://policies.google.com/privacy). Avec l'offre gratuite de Gemini, Google indique pouvoir utiliser les contenus envoyés pour améliorer ses services : n'envoie pas de photo contenant des personnes ou des informations privées.

Rien n'est envoyé à Gemini si tu n'as pas saisi de clé ou si tu n'utilises pas ces fonctions.

## Conseils de santé

Les calories, objectifs et conseils sont des estimations générales et **ne remplacent pas un avis médical**. L'application ne s'adresse pas aux enfants (moins de 18 ans), ni aux personnes souffrant de troubles alimentaires sans suivi médical.

## Tes droits

Comme toutes les données sont sur ton téléphone, tu peux les consulter, les modifier ou les effacer directement dans l'application ou en la désinstallant. Pour les données envoyées à Google Gemini, adresse-toi à Google depuis ton compte Google. Pour toute question, écris à l'adresse e-mail indiquée sur la fiche Google Play de l'application.

## Changements

Si cette politique change, la nouvelle version sera publiée sur cette page avec sa date de mise à jour.
