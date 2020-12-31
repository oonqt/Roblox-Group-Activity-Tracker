const fs = require('fs-extra');
const path = require('path');

const buildFolder = path.join(__dirname, '..', 'build');
const clientFolder = path.join(buildFolder, 'client');

if(!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);
if(fs.existsSync(clientFolder)) fs.removeSync(clientFolder);

fs.moveSync('build', clientFolder);

console.log('Completed postbuild successfully');