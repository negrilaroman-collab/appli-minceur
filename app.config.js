// Complète app.json au moment du build.
// ANDROID_VERSION_CODE : numéro de version, rempli par la CI (numéro du build GitHub).
// L'appli le compare à version.json publié avec l'APK pour proposer les mises à jour.
module.exports = ({ config }) => {
  const versionCode = Number(process.env.ANDROID_VERSION_CODE) || config.android?.versionCode || 1;
  return {
    ...config,
    version: `1.0.${versionCode}`,
    android: { ...config.android, versionCode },
  };
};
