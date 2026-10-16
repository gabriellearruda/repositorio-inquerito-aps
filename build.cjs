const fs = require('fs');

const senha = process.env.SENHADOPAINEL || '';
if (!senha) {
  console.error('AVISO: variavel SENHADOPAINEL nao definida');
}

const path = 'vital/index.html';
let content = fs.readFileSync(path, 'utf8');
content = content.replaceAll('__SENHADOPAINEL__', senha);
fs.writeFileSync(path, content, 'utf8');
console.log('Senha injetada com', senha.length, 'caracteres');
