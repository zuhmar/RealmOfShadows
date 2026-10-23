import idle from '../../../assets/monsters/Wolf_idle_animations.png?url';
import walk from '../../../assets/monsters/Wolf_walk_animations.png?url';
// Source rectangles preserve the original PNGs. Rows: down, left, right, up.
export const wolfAssets=[
 {key:'wolf-idle',url:idle,fps:3,rows:[[[290,20,270,310],[730,20,270,310]],[[180,335,445,290],[675,335,445,290]],[[140,625,440,280],[670,625,440,280]],[[270,905,290,330],[730,905,290,330]]]},
 {key:'wolf-walk',url:walk,fps:6,rows:[[[290,10,270,335],[730,10,270,335]],[[150,345,495,300],[650,345,500,300]],[[90,650,500,275],[640,650,500,275]],[[270,915,290,325],[730,915,290,325]]]},
] as const;
