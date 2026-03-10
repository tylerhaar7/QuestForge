import type { ClassName } from '@/types/game';
import { ImageSourcePropType } from 'react-native';

export const CLASS_ICONS: Record<ClassName, ImageSourcePropType> = {
  barbarian: require('../../assets/icons/classes/barbarian.png'),
  bard: require('../../assets/icons/classes/bard.png'),
  cleric: require('../../assets/icons/classes/cleric.png'),
  druid: require('../../assets/icons/classes/druid.png'),
  fighter: require('../../assets/icons/classes/fighter.png'),
  monk: require('../../assets/icons/classes/monk.png'),
  paladin: require('../../assets/icons/classes/paladin.png'),
  ranger: require('../../assets/icons/classes/ranger.png'),
  rogue: require('../../assets/icons/classes/rogue.png'),
  sorcerer: require('../../assets/icons/classes/sorcerer.png'),
  warlock: require('../../assets/icons/classes/warlock.png'),
  wizard: require('../../assets/icons/classes/wizard.png'),
  artificer: require('../../assets/icons/classes/artificer.png'),
};
