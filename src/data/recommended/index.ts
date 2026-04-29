import type { Note } from '../../types/note';

import lv100_ilv690 from './lv100_ilv690.json';
import lv100_ilv710 from './lv100_ilv710.json';
import lv100_ilv720 from './lv100_ilv720.json';
import lv100_ilv720_690 from './lv100_ilv720_690.json';
import lv100_ilv740 from './lv100_ilv740.json';
import lv100_ilv750 from './lv100_ilv750.json';
import lv100_ilv770 from './lv100_ilv770.json';
import lv50_ilv110 from './lv50_ilv110.json';
import lv50_ilv115 from './lv50_ilv115.json';
import lv60_ilv190 from './lv60_ilv190.json';
import lv60_ilv255 from './lv60_ilv255.json';
import lv60_ilv255_250 from './lv60_ilv255_250.json';
import lv70_ilv340 from './lv70_ilv340.json';
import lv70_ilv380 from './lv70_ilv380.json';
import lv70_ilv385 from './lv70_ilv385.json';
import lv80_ilv490 from './lv80_ilv490.json';
import lv80_ilv510 from './lv80_ilv510.json';
import lv80_ilv515 from './lv80_ilv515.json';
import lv90_ilv620 from './lv90_ilv620.json';
import lv90_ilv640 from './lv90_ilv640.json';
import lv90_ilv645 from './lv90_ilv645.json';

const allRecommendedNotes: Note[] = [
  ...(lv100_ilv690 as Note[]),
  ...(lv100_ilv710 as Note[]),
  ...(lv100_ilv720 as Note[]),
  ...(lv100_ilv720_690 as Note[]),
  ...(lv100_ilv740 as Note[]),
  ...(lv100_ilv750 as Note[]),
  ...(lv100_ilv770 as Note[]),
  ...(lv50_ilv110 as Note[]),
  ...(lv50_ilv115 as Note[]),
  ...(lv60_ilv190 as Note[]),
  ...(lv60_ilv255 as Note[]),
  ...(lv60_ilv255_250 as Note[]),
  ...(lv70_ilv340 as Note[]),
  ...(lv70_ilv380 as Note[]),
  ...(lv70_ilv385 as Note[]),
  ...(lv80_ilv490 as Note[]),
  ...(lv80_ilv510 as Note[]),
  ...(lv80_ilv515 as Note[]),
  ...(lv90_ilv620 as Note[]),
  ...(lv90_ilv640 as Note[]),
  ...(lv90_ilv645 as Note[]),
].sort((a, b) => {
  const getILv = (n: Note) => {
    const name = typeof n.name === "string" ? n.name : n.name.tw;
    const match = name.match(/iLv(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };
  return getILv(a) - getILv(b);
});

export default allRecommendedNotes;
