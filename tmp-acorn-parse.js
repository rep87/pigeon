const fs=require('fs');
const acorn=require('acorn');
const code=fs.readFileSync('src/game.js','utf8');
const ast=acorn.parse(code,{ecmaVersion:'latest',sourceType:'module'});
ast.body.forEach((n,i)=>{
  if(n.type==='FunctionDeclaration') console.log(i,'FunctionDeclaration', n.id&&n.id.name,'range',n.start,n.end);
  else console.log(i,n.type);
});
