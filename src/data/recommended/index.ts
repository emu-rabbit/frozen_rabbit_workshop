import type { Note } from '../../types/note';

import lv50_il110 from './lv50_il110.json';
import lv60_il190 from './lv60_il190.json';
import lv60_il255_250 from './lv60_il255_250.json';
import lv70_il340 from './lv70_il340.json';
import lv70_il380 from './lv70_il380.json';
import lv80_il490 from './lv80_il490.json';
import lv80_il510 from './lv80_il510.json';
import lv90_il620 from './lv90_il620.json';
import lv90_il640 from './lv90_il640.json';
import lv100_il690 from './lv100_il690.json';
import lv100_il710 from './lv100_il710.json';
import lv100_il720_690 from './lv100_il720_690.json';
import lv100_il720 from './lv100_il720.json';

const allRecommendedNotes: Note[] = [
  ...(lv50_il110 as Note[]),
  ...(lv60_il190 as Note[]),
  ...(lv60_il255_250 as Note[]),
  ...(lv70_il340 as Note[]),
  ...(lv70_il380 as Note[]),
  ...(lv80_il490 as Note[]),
  ...(lv80_il510 as Note[]),
  ...(lv90_il620 as Note[]),
  ...(lv90_il640 as Note[]),
  ...(lv100_il690 as Note[]),
  ...(lv100_il710 as Note[]),
  ...(lv100_il720_690 as Note[]),
  ...(lv100_il720 as Note[]),
];

// Sort by date or other criteria if needed, 
// here we keep it simple as it's aggregated by version.
export default allRecommendedNotes;
