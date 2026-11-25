// Plugin Expo : signe le build "release" avec la clé d'envoi Play Store
// quand la CI fournit ANDROID_KEYSTORE_PATH (+ mots de passe) en variables d'environnement.
// Sans ces variables, rien ne change : le build garde la clé de debug (APK partagé aux amis).
// La clé elle-même n'est JAMAIS dans le dépôt : elle vient des secrets GitHub.
const { withAppBuildGradle } = require('expo/config-plugins');

const BLOC_RELEASE = `
        release {
            if (System.getenv('ANDROID_KEYSTORE_PATH')) {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }`;

function ajouterSignature(gradle) {
  if (gradle.includes("System.getenv('ANDROID_KEYSTORE_PATH')")) return gradle;
  const avecConfig = gradle.replace(/signingConfigs\s*\{/, (m) => m + BLOC_RELEASE);
  // Dans buildTypes > release, remplace "signingConfig signingConfigs.debug".
  const avecRelease = avecConfig.replace(
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    "$1signingConfig System.getenv('ANDROID_KEYSTORE_PATH') ? signingConfigs.release : signingConfigs.debug",
  );
  if (avecConfig === gradle || avecRelease === avecConfig) {
    throw new Error('signature-release : build.gradle a un format inattendu, signature non ajoutée.');
  }
  return avecRelease;
}

module.exports = (config) =>
  withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ajouterSignature(cfg.modResults.contents);
    return cfg;
  });
module.exports.ajouterSignature = ajouterSignature;
