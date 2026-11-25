// Complète app.json au moment du build.
// ANDROID_VERSION_CODE : numéro de version que Google Play exige plus grand à chaque envoi
// (la CI le remplit automatiquement). En local il reste à 1.
module.exports = ({ config }) => {
  const versionCode = Number(process.env.ANDROID_VERSION_CODE) || config.android?.versionCode || 1;
  return {
    ...config,
    android: { ...config.android, versionCode },
    plugins: [...(config.plugins ?? []), './plugins/signature-release'],
  };
};
