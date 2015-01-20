var nconf = require('nconf'),
    path = require('path');

nconf.argv()
    .env()
    .file({ file: path.resolve(global.appRoot, 'config.json') });

module.exports = nconf;