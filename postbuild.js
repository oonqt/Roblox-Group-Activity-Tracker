const fs = require('fs-extra');

if (fs.existsSync('build')) fs.removeSync('build');