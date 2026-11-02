/** Shared sprite-space view. Grid coordinates, camera zoom and collision never pass through this. */
const view=require('../../packages/game-data/src/world-view.json');
function faceLighting(width,top,front,bottom,right=false){
 const d=view.depth.right;
 return `<path d="M0 ${top}H${width}" stroke="${view.artwork.topHighlight}" stroke-width="1" opacity=".6"/><path d="M0 ${front}H${width}V${bottom}H0Z" fill="${view.artwork.frontShadow}" opacity=".14"/>${right?`<path d="M${width-d} ${front}L${width} ${top}V${bottom-d}L${width-d} ${bottom}Z" fill="${view.artwork.rightShadow}" opacity=".48"/><path d="M${width-d} ${front}V${bottom}" stroke="#42382d" opacity=".65"/>`:''}`;
}
module.exports={view,faceLighting};
