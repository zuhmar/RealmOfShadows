/** Regional artwork overrides preserve object identity, floor anchors and collision. */
export function elderwoodPropTexture(key:string,region:string){
 return region.startsWith('elderwood')?key.replace(/^furn-(chest|bed|bench|tools|table|armor)-(down|left|right|up)$/,'elderwood-prop-$1-$2'):key;
}
