// Carte « Clé IA » du Profil : guide pas à pas pour débutants, bouton Coller, test de la clé.
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';

import { Bouton, C, Carte, Champ, Texte } from '@/components/ui';
import { enregistrerCleApi, LIEN_CLE_GEMINI, lireCleApi } from '@/lib/ia-commun';
import { ErreurAnalyse, testerCleGemini } from '@/lib/ia';

const ETAPES: { titre: string; detail: string }[] = [
  {
    titre: 'Ouvre le site de Google',
    detail: 'Appuie sur le bouton vert « 1. Ouvrir le site de Google » juste en dessous. Une page s’ouvre dans ton navigateur (Chrome).',
  },
  {
    titre: 'Connecte-toi avec ton compte Google',
    detail:
      'C’est le même compte que pour Gmail, YouTube ou le Play Store. Choisis-le dans la liste, ou tape ton adresse Gmail et ton mot de passe. Pas de compte ? Appuie sur « Créer un compte ».',
  },
  {
    titre: 'Accepte les conditions (seulement la 1re fois)',
    detail:
      'Une fenêtre « Google AI Studio » peut s’afficher, parfois en anglais. Coche la case (« I accept… ») puis appuie sur « Continuer » ou « Continue ». Si une visite guidée s’affiche, ferme-la.',
  },
  {
    titre: 'Crée la clé',
    detail:
      'Appuie sur le bouton « Créer une clé API » (en anglais : « Create API key »). Si une fenêtre te demande un nom ou un projet, laisse ce qui est proposé et appuie sur « Créer » (« Create key »). Si la page est trop petite, tourne ton téléphone ou zoome avec deux doigts.',
  },
  {
    titre: 'Copie la clé',
    detail:
      'Une longue suite de lettres et de chiffres apparaît (elle commence souvent par « AIza »). Appuie sur l’icône copier (deux petits carrés) à côté. Sinon, appuie longuement sur la clé puis sur « Copier ».',
  },
  {
    titre: 'Reviens dans l’appli',
    detail: 'Utilise le bouton retour du téléphone, ou rouvre l’appli Appli Minceur. Tu reviens sur cette page.',
  },
  {
    titre: 'Colle et teste',
    detail: 'Appuie sur « 2. Coller ma clé », puis sur « 3. Tester et enregistrer ». Si le message est vert, c’est fini !',
  },
];

type Etat = { type: 'ok' | 'attention' | 'erreur'; texte: string } | null;

export function CarteCleGemini() {
  const [cle, setCle] = useState('');
  const [aUneCle, setAUneCle] = useState(false);
  const [guideOuvert, setGuideOuvert] = useState(true);
  const [test, setTest] = useState(false);
  const [etat, setEtat] = useState<Etat>(null);

  useEffect(() => {
    lireCleApi().then((c) => {
      setAUneCle(!!c);
      setGuideOuvert(!c);
    });
  }, []);

  const coller = async () => {
    const t = (await Clipboard.getStringAsync()).trim();
    if (!t) setEtat({ type: 'erreur', texte: 'Rien à coller : retourne sur le site de Google et appuie sur l’icône copier à côté de la clé.' });
    else {
      setCle(t);
      setEtat(null);
    }
  };

  const testerEtEnregistrer = async () => {
    const c = cle.replace(/\s/g, '');
    if (!c) {
      setEtat({ type: 'erreur', texte: 'Colle d’abord ta clé (étape 2).' });
      return;
    }
    setTest(true);
    setEtat(null);
    try {
      await testerCleGemini(c);
      await enregistrerCleApi(c);
      setAUneCle(true);
      setCle('');
      setGuideOuvert(false);
      setEtat({ type: 'ok', texte: 'Clé valide et enregistrée ✓ Tu peux utiliser la photo des repas et le coach.' });
    } catch (e) {
      const msg = e instanceof ErreurAnalyse ? e.message : 'Erreur inattendue.';
      if (/refusée/i.test(msg)) {
        setEtat({ type: 'erreur', texte: 'Google refuse cette clé. Vérifie que tu l’as copiée en entier (refais l’étape 5 avec l’icône copier), puis recommence.' });
      } else if (/pays/i.test(msg)) {
        setEtat({ type: 'erreur', texte: msg });
      } else {
        // Pas de réseau ou quota : on garde quand même la clé.
        await enregistrerCleApi(c);
        setAUneCle(true);
        setCle('');
        setEtat({ type: 'attention', texte: `Clé enregistrée, mais le test n’a pas pu se faire : ${msg}` });
      }
    } finally {
      setTest(false);
    }
  };

  const supprimer = async () => {
    await enregistrerCleApi('');
    setAUneCle(false);
    setGuideOuvert(true);
    setEtat({ type: 'attention', texte: 'Clé supprimée.' });
  };

  const couleurEtat = etat?.type === 'ok' ? C.accent : etat?.type === 'attention' ? C.jaune : C.danger;

  return (
    <Carte accent={aUneCle ? undefined : C.accent}>
      <Texte type="label">CLÉ IA GEMINI (GRATUITE)</Texte>
      <Texte type="gras" couleur={aUneCle ? C.accent : C.orange}>
        {aUneCle ? '✓ Une clé est enregistrée' : 'Aucune clé : la photo des repas et le coach ne marchent pas encore'}
      </Texte>
      <Texte type="petit">
        La clé est un mot de passe qui permet à l’appli d’utiliser l’IA de Google. Elle est gratuite et ne demande aucune carte bancaire. Compte 5 minutes.
      </Texte>

      <Pressable onPress={() => setGuideOuvert(!guideOuvert)} style={{ paddingVertical: 6 }}>
        <Texte type="gras" couleur={C.cyan}>
          {guideOuvert ? '▾ Masquer le guide pas à pas' : '▸ Voir le guide pas à pas'}
        </Texte>
      </Pressable>

      {guideOuvert && (
        <View style={{ gap: 12 }}>
          {ETAPES.map((e, i) => (
            <View key={e.titre} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Texte type="gras" couleur={C.accentText}>
                  {i + 1}
                </Texte>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Texte type="gras">{e.titre}</Texte>
                <Texte type="petit">{e.detail}</Texte>
              </View>
            </View>
          ))}
          <View style={{ backgroundColor: C.backgroundSelected, borderRadius: 12, padding: 10, gap: 4 }}>
            <Texte type="gras">Bon à savoir</Texte>
            <Texte type="petit">
              • Si Google te demande une carte bancaire, tu n’es pas au bon endroit : reviens ici et rappuie sur le bouton 1.{'\n'}• Ne publie pas ta clé sur internet. Tu peux la partager avec un proche, mais le quota gratuit du jour sera partagé.{'\n'}• Avec la version gratuite, Google peut utiliser les photos envoyées pour améliorer ses produits.
            </Texte>
          </View>
        </View>
      )}

      <Bouton titre="1. Ouvrir le site de Google" onPress={() => Linking.openURL(LIEN_CLE_GEMINI)} />
      <Bouton titre="2. Coller ma clé" secondaire onPress={coller} />
      <Champ
        libelle={aUneCle ? 'Nouvelle clé (pour remplacer l’ancienne)' : 'Ta clé'}
        value={cle}
        onChangeText={setCle}
        placeholder="AIza..."
        autoCapitalize="none"
        autoCorrect={false}
      />
      {test ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <ActivityIndicator color={C.accent} />
          <Texte>Test de la clé…</Texte>
        </View>
      ) : (
        <Bouton titre="3. Tester et enregistrer" onPress={testerEtEnregistrer} desactive={!cle.trim()} />
      )}
      {etat && (
        <Texte type="gras" couleur={couleurEtat}>
          {etat.texte}
        </Texte>
      )}
      {aUneCle && (
        <Pressable onPress={supprimer} style={{ alignSelf: 'center', padding: 6 }}>
          <Texte type="petit" couleur={C.danger}>
            Supprimer la clé
          </Texte>
        </Pressable>
      )}
    </Carte>
  );
}
