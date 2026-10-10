// Uses the existing Netlify CLI login; never reads or prints credentials.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const {siteId} = JSON.parse(readFileSync(new URL('../.netlify/state.json', import.meta.url)));
if (!siteId) throw Error('Link the project with netlify link first.');
const makePublic = process.argv.includes('--public');
const payload = makePublic
  ? {site_id: siteId, body: {sso_login: false, password: ''}}
  : {site_id: siteId};
const result = spawnSync(process.execPath, [
  new URL('../node_modules/netlify-cli/bin/run.js', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'),
  'api', makePublic ? 'updateSite' : 'getSite', '--data', JSON.stringify(payload),
], {encoding: 'utf8', timeout: 120000});
if (result.status !== 0) throw Error(result.stderr || result.stdout || String(result.error));
const site = JSON.parse(result.stdout);
console.log(JSON.stringify({id:site.id, url:site.ssl_url, sso_login:site.sso_login,
  has_password:site.has_password, account_type:site.account_type,
  deploy_id:site.published_deploy?.id}, null, 2));
