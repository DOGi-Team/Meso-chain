var program = require('commander');

function range(val) {
return val.split('..').map(Number);
}

function list(val) {
return val.split(',');
}
let a;

program
.version('0.0.1')
.usage('test')
.option('-C, --chdir [value]', '设置服务器节点','/home/conan/server')
.option('-c, --config [value]', '设置配置文件','./deploy.conf')
.option('-m, --max <n>', '最大连接数', parseInt)
.option('-s, --seed <n>', '出始种子', parseFloat)
.option('-r, --range <a>..<b>', '阈值区间', range)
.option('-l, --list <items>', 'IP列表', list)

program
.command('deploy <name>')
.description('Deploy hub.')
.option('--ne','internal hub address')
.action(function(option,cmd){
console.log(cmd.isNe);
});

program.parse(process.argv);

console.log(' chdir - %s ', program.chdir);
console.log(' config - %s ', program.config);
console.log(' max: %j', program.max);
console.log(' seed: %j', program.seed);
program.range = program.range || [];
console.log(' range: %j..%j', program.range[0], program.range[1]);
console.log(' list: %j', program.list);