// QuestForge Typography System
// Cinzel: headings, UI labels, combat text
// Crimson Text: body, descriptions, dialogue
// IM Fell English: narrative text (story prose)

import { Platform } from 'react-native';

export const fonts = {
  heading: Platform.select({
    ios: 'Cinzel-Bold',
    android: 'Cinzel-Bold',
    default: 'Cinzel',
  }),
  headingRegular: Platform.select({
    ios: 'Cinzel-Regular',
    android: 'Cinzel-Regular',
    default: 'Cinzel',
  }),
  body: Platform.select({
    ios: 'CrimsonText-Regular',
    android: 'CrimsonText-Regular',
    default: 'Crimson Text',
  }),
  bodyBold: Platform.select({
    ios: 'CrimsonText-Bold',
    android: 'CrimsonText-Bold',
    default: 'Crimson Text',
  }),
  bodyItalic: Platform.select({
    ios: 'CrimsonText-Italic',
    android: 'CrimsonText-Italic',
    default: 'Crimson Text',
  }),
  narrative: Platform.select({
    ios: 'IMFellEnglish-Regular',
    android: 'IMFellEnglish-Regular',
    default: 'IM Fell English',
  }),
  narrativeItalic: Platform.select({
    ios: 'IMFellEnglish-Italic',
    android: 'IMFellEnglish-Italic',
    default: 'IM Fell English',
  }),
} as const;

export const textStyles = {
  // UI Elements
  screenTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  sectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  buttonLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    letterSpacing: 1,
  },

  // Game Text
  narrative: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    lineHeight: 28,
  },
  dialogue: {
    fontFamily: fonts.bodyItalic,
    fontSize: 15,
    lineHeight: 24,
  },
  combatLog: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },

  // Character / Stats
  characterName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '900' as const,
  },

  // Choice buttons
  choiceText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  skillCheckLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 1,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
