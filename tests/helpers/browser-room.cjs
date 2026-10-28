// Door state is intentionally shared in a room. Parallel browser suites each
// create a fresh room so another suite cannot close their test entrance.
module.exports=async function browserRoom(page,offline){
 await page.route('**/matchmake/**',route=>{
  if(offline)return route.abort();
  const url=route.request().url();return route.continue({url:url.replace('/joinOrCreate/','/create/')});
 });
};
