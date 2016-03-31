const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const archiver = require('archiver');


const releaseType = process.argv[2];

const data = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
var packageJSON = JSON.parse(data.slice().toString());

const data2 = fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8');
var manifestJSON = JSON.parse(data2.slice().toString());

var version = packageJSON.version.split('.');

bumpRelease(version, releaseType);

var versionStr = version.join('.');

packageJSON.version = versionStr;
manifestJSON.version = versionStr;

fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJSON, null, '  '));
fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifestJSON, null, '  '));

process.env.NODE_ENV = 'production';
execSync('npm run build');
var dir = path.join(__dirname, 'dist');
try {
	fs.accessSync(dir);
} catch (e) {
    fs.mkdirSync(dir);
}

const output = fs.createWriteStream('dist/video-annotation-' + versionStr+ '.zip');
const archive = archiver('zip');

archive.pipe(output);
archive.bulk([
    { expand: true, cwd: 'builds', src: ['**']}
]);
archive.finalize();

execSync('git tag ' + versionStr);

output.on('close', () => {
	process.env.NODE_ENV = '';
	execSync('npm run build');
});


function bumpRelease (version, releaseType) {
	if (!releaseType) {
		++version[2];

	} else if (releaseType === 'minor') {
		++version[1];
		version[2] = 0;
	} else {
		++version[0];
		version[1] = version[2] = 0;
	}
}
