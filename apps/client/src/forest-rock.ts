/** Shared illustrated strata for forest and village cliffs; coordinates stay native 32px. */
export function paintForestRock(ctx:CanvasRenderingContext2D,px:number,py:number,width:number,height:number,village=false){
 const row=Math.floor(py/32)-1;
 const colors=village?['#707d6b','#808a76','#5e7061','#89907a','#66786a']:['#657568','#758273','#53685e','#7e8875','#5b7067'];
 ctx.save();ctx.beginPath();ctx.rect(px,py,width,height);ctx.clip();ctx.fillStyle=village?'#3d5042':'#354d40';ctx.fillRect(px,py,width,height);
 for(let band=0;band<Math.ceil(height/22);band++)for(let x=px-34+(band%2)*19;x<px+width;x+=47){
  const top=py+band*22,j=Math.abs(Math.floor(x)+row*7+band*5)%9;
  ctx.beginPath();ctx.moveTo(x,top+3);ctx.lineTo(x+25,top-2);ctx.lineTo(x+51,top+4);ctx.lineTo(x+45,top+20+j);ctx.lineTo(x+12,top+27);ctx.lineTo(x-2,top+18);ctx.closePath();ctx.fillStyle=colors[Math.abs(Math.floor(x/47)+band+row)%5];ctx.fill();
  ctx.strokeStyle='#344b3f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+13,top+9);ctx.lineTo(x+18,top+15);ctx.lineTo(x+14,top+21);ctx.stroke();
 }
 ctx.restore();
}
