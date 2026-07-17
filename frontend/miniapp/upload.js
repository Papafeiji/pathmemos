const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

function getNextVersion() {
  const versionFile = path.join(__dirname, '.version');
  const now = new Date();
  const dateStr = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  let seq = 1;
  if (fs.existsSync(versionFile)) {
    const content = fs.readFileSync(versionFile, 'utf-8').trim();
    if (content.startsWith(dateStr)) {
      const prevSeq = parseInt(content.slice(6), 10);
      if (!isNaN(prevSeq)) {
        seq = prevSeq + 1;
      }
    }
  }

  const version = `${dateStr}${String(seq).padStart(2, '0')}`;
  fs.writeFileSync(versionFile, version, 'utf-8');
  return version;
}





const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.replace(/^--/, '').split('=');
  if (k && v) acc[k] = v;
  return acc;
}, {});

const APPID = args.appid || process.env.MINIPROGRAM_APPID;
const PRIVATE_KEY_PATH = args.key || process.env.MINIPROGRAM_PRIVATE_KEY;
const PROJECT_PATH = process.env.MINIPROGRAM_PROJECT_PATH || __dirname;

if (!APPID) {
  console.error('错误：请通过 --appid=xxx 或环境变量 MINIPROGRAM_APPID 指定小程序 AppID');
  process.exit(1);
}
if (!PRIVATE_KEY_PATH) {
  console.error('错误：请通过 --key=./private.key 或环境变量 MINIPROGRAM_PRIVATE_KEY 指定私钥路径');
  process.exit(1);
}

(async () => {
  const project = new ci.Project({
    appid: APPID,
    type: 'miniProgram',
    projectPath: PROJECT_PATH,
    privateKeyPath: PRIVATE_KEY_PATH,
    ignores: ['node_modules/**/*', 'upload.js', '.version'],
  });

  const version = getNextVersion();
  const now = new Date();

  const result = await ci.upload({
    project,
    version,
    desc: `CI upload ${now.toISOString()}`,
    setting: {
      es6: true,
      minifyWXSS: true,
      minifyWXML: true,
      useCompilerPlugins: ['typescript', 'less'],
      ignoreUploadUnusedFiles: false,
    },
  });

  console.log('上传成功，版本号:', version);
  console.log(result);
})().catch(err => {
  console.error('上传失败:', err);
  process.exit(1);
});
