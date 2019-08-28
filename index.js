#!/usr/bin/env node

'use strict';
const program = require('commander');
const colors = require('colors');

process.env.NODE_PATH = __dirname + '/node_modules/';
program.version(require('./package').version); // 设置版本
program.usage('[command][options][params]'.green);
program.description(require('./package').description);

program
  .command('parse <dir>')
  .description('解析工程目录')
  .alias('p')
  .action(dir => {
    require('./module/parse')(dir);
  });
program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
