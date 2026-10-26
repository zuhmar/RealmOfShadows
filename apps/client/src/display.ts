// Phaser 3 renders one canvas pixel per game unit. Use a larger backing canvas
// and matching camera zoom so Retina screens keep the same view and hit targets.
// Cap density at 2 to avoid a 9x fill-rate cost on high-density mobile devices.
export function displayDensity(){return Math.max(1,Math.min(window.devicePixelRatio||1,2));}
export function displaySize(){const density=displayDensity();return {width:Math.round(window.innerWidth*density),height:Math.round(window.innerHeight*density)};}
