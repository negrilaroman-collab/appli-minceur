# Mettre Appli Minceur sur le Google Play Store – ce que tu dois faire

Le code est prêt : à chaque fusion sur `photo-kcal`, GitHub construit l'appli au format Play Store (AAB), signée avec **ta** clé, avec un numéro de version qui augmente tout seul, et peut l'envoyer seule sur Google Play. Il reste des étapes que seul toi peux faire (paiement, identité, formulaires). Compte environ 1 h de démarches, puis **14 jours de test obligatoire** avant la publication publique.

> ⚠️ **Tes amis qui ont déjà l'APK** : la version Play Store n'a pas la même signature. Pour l'installer, ils devront d'abord **désinstaller** l'APK, ce qui **efface leur journal**. Si tu veux éviter ça, demande-moi d'ajouter d'abord une fonction « Sauvegarder / Restaurer mes données ».

---

## Étape 1 – Créer ton compte développeur (25 $, une seule fois)

1. Va sur https://play.google.com/console/signup avec le compte Google que tu veux utiliser (idéalement un compte dédié).
2. Choisis **« Pour vous »** (compte personnel).
3. Paie les **25 $** (carte bancaire).
4. Vérifie ton **identité** (photo de ta pièce d'identité, nom et adresse identiques au moyen de paiement) et ton **numéro de téléphone**. La validation prend de quelques heures à quelques jours.
5. Google demande aussi si tu as un **appareil Android** : installe l'appli Play Console sur ton téléphone et connecte-toi, c'est une vérification obligatoire.

## Étape 2 – Créer ta clé d'envoi (sur ton ordinateur, 5 min)

Cette clé prouve à Google que les mises à jour viennent bien de toi. **Ne la mets jamais dans le dépôt GitHub** et garde une copie (clé USB, gestionnaire de mots de passe).

Il faut Java. Si la commande `keytool` n'existe pas, installe « Temurin JDK 17 » depuis https://adoptium.net (bouton de téléchargement, puis Suivant > Suivant).

Dans PowerShell (Windows) ou Terminal (Mac) :

```
keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Il te demande un mot de passe (note-le !), ton nom, etc. Ensuite, pour copier la clé sous forme de texte :

- **Windows (PowerShell)** : `[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload.jks")) | Set-Clipboard`
- **Mac** : `base64 -i upload.jks | pbcopy`

Le texte est maintenant dans ton presse-papiers.

(Si c'est trop compliqué, dis-le-moi : je peux te guider pas à pas.)

## Étape 3 – Donner la clé à GitHub (secrets)

Va sur https://github.com/negrilaroman-collab/appli-minceur/settings/secrets/actions et clique **« New repository secret »** 4 fois :

| Nom | Valeur |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | le texte copié à l'étape 2 (Ctrl+V) |
| `ANDROID_KEYSTORE_PASSWORD` | ton mot de passe |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | le même mot de passe |

Les secrets sont chiffrés : personne ne peut les relire, même si le dépôt est public.

## Étape 4 – Construire le premier fichier AAB

1. Va dans l'onglet **Actions** du dépôt > **Google Play** > **Run workflow** > branche `photo-kcal` > **Run workflow**.
2. Attends la coche verte (20 à 40 min la première fois).
3. Ouvre le run, en bas **Artifacts** > télécharge `appli-minceur-aab` (un zip contenant `appli-minceur-N.aab`). Dézippe-le.

## Étape 5 – Créer l'appli dans la Play Console

1. **Créer une application** : nom « Appli Minceur », langue Français, Application, Gratuite. Coche les déclarations.
2. Remplis la **fiche** et le **contenu de l'appli** en copiant les réponses de [`store/fiche-play-store.md`](fiche-play-store.md) (confidentialité, public cible 18+, sécurité des données, applis de santé, Health Connect…).
3. Ajoute l'icône et la bannière (dossier `store/`) et 2 captures minimum (envoie-moi tes captures téléphone, je les mets au bon format).

## Étape 6 – Test interne (toi seul, tout de suite)

1. **Tester > Tests internes > Créer une release**.
2. Accepte **« Signature d'application par Google Play »** (Google garde la clé finale, la tienne sert juste à envoyer).
3. Glisse le fichier `.aab` de l'étape 4, puis **Enregistrer > Vérifier > Déployer**.
4. Onglet **Testeurs** : crée une liste avec ton adresse Gmail, copie le **lien d'inscription**, ouvre-le sur ton téléphone, accepte, installe depuis le Play Store.

## Étape 7 – Test fermé obligatoire : 12 testeurs pendant 14 jours

Pour les comptes personnels récents, Google exige avant la publication publique un **test fermé avec au moins 12 testeurs inscrits pendant 14 jours d'affilée**.

1. **Tester > Test fermé** > crée une piste, ajoute une liste d'e-mails Gmail (tes ~5 amis + famille/collègues pour arriver à **12 au moins**, prévoir 14-15 en marge).
2. Envoie la release (« Promouvoir » la version du test interne, ou lance le workflow avec la piste `alpha`).
3. Partage le lien d'inscription. Chaque testeur doit **accepter le lien ET installer l'appli**, et la garder 14 jours. Qu'ils l'ouvrent de temps en temps.
4. Après 14 jours : **Tableau de bord > Demander l'accès à la production**, et réponds au questionnaire (comment s'est passé le test, ce que tu as corrigé). Google répond en quelques jours.
5. Une fois accepté : **Production > Créer une release**, choisis les pays (France…), envoie. L'appli est publique après validation (1 à 7 jours).

## Étape 8 (facultatif mais pratique) – Envoi automatique des mises à jour

Sans ça, il faut télécharger l'AAB à chaque fois (étape 4) et l'envoyer à la main. Avec ça, chaque fusion sur `photo-kcal` arrive seule sur la piste de test interne.

1. Sur https://console.cloud.google.com : crée un projet, active **« Google Play Android Developer API »**.
2. **IAM > Comptes de service > Créer** (nom : `github-play`), puis **Clés > Ajouter une clé > JSON** : un fichier se télécharge.
3. Dans la Play Console : **Utilisateurs et autorisations > Inviter** l'adresse e-mail du compte de service, donne-lui l'accès à Appli Minceur avec « Publier dans les pistes de test » et « Gérer les releases ».
4. Sur GitHub, ajoute le secret `PLAY_SERVICE_ACCOUNT_JSON` avec **tout le contenu** du fichier JSON.
5. Tant que l'appli n'a jamais été publiée, les envois arrivent en **brouillon** : il suffit d'appuyer sur « Déployer » dans la console. Quand l'appli est publiée, va dans https://github.com/negrilaroman-collab/appli-minceur/settings/variables/actions et crée la variable `PLAY_RELEASE_STATUS` = `completed` : les mises à jour partiront alors seules.

## Ensuite, au quotidien

- Une nouvelle fonction est fusionnée sur `photo-kcal` → GitHub construit l'AAB (numéro de version +1) → envoi sur le test interne.
- Pour la donner à tout le monde : Play Console > la release > **Promouvoir** vers la production. Les téléphones se mettent à jour tout seuls via le Play Store.
- L'APK pour les amis (lien GitHub) continue d'exister en parallèle tant que tu veux.
