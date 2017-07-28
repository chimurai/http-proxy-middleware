// Skip StandardJS on older node versions: < node@4.0.0
// https://travis-ci.org/chimurai/http-proxy-middleware/builds/212791414

var execSync = require('child_process').execSync
var command = 'standard -v'

if (!process.mainModule.children.length) {  // workaround? prevent duplicate linting...
  if (isLegacyNodeJs()) {
    console.log('StandardJS: Skipping StandardJS on older Node versions')
  } else {
    execSync(command, {stdio: [0, 1, 2]})   // https://stackoverflow.com/a/31104898/3841188
  }
}

function isLegacyNodeJs () {
  var majorVersion = parseInt(process.versions.node[0], 10)
  var isModernNodeJs = (majorVersion > 0)
  return !isModernNodeJs
}
