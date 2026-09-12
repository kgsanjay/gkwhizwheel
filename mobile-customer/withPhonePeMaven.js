const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withPhonePeMaven(config) {
  return withProjectBuildGradle(config, async (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;
      const mavenRepo = `maven { url "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android" }`;
      
      // Add it to allprojects -> repositories
      if (!buildGradle.includes('phonepe.mycloudrepo.io')) {
        buildGradle = buildGradle.replace(
          /allprojects\s*{\s*repositories\s*{/,
          `allprojects {\n    repositories {\n        ${mavenRepo}`
        );
        config.modResults.contents = buildGradle;
      }
    }
    return config;
  });
};
