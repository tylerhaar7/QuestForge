const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: IS_DEV ? "QuestForge (Dev)" : "QuestForge",
    slug: "questforge",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0d0a08",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? "com.fauni.questforge.dev"
        : "com.fauni.questforge",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundColor: "#0d0a08",
      },
      package: IS_DEV
        ? "com.fauni.questforge.dev"
        : "com.fauni.questforge",
    },
    scheme: "questforge",
    plugins: ["expo-router", "expo-font", "expo-secure-store", "expo-av"],
    extra: {
      router: {},
      eas: {
        projectId: "a8b3635a-9bba-496a-971d-e3164413b6c5",
      },
    },
  },
};
