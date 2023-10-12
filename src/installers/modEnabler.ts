import * as path from 'path';
import { types, util, selectors, actions } from 'vortex-api';
import { GAME_ID } from '../common';

const AAM_MOD_ID = 2;
const PATTERN_ROOT_MOD = path.sep + 'Remnant2' + path.sep;
export const XINPUT_DLL = 'xinput1_3.dll';

function testAAM(files: string[], gameId: string): { supported: boolean, requiredFiles?: string[] } {
  const supported = ((gameId === GAME_ID) && (!!files.find(f => path.basename(f) === XINPUT_DLL)));
  return { supported, requiredFiles: [] };
}

export async function downloadAAM(api: types.IExtensionApi, update?: boolean) {
  api.dismissNotification('aam-missing');
  api.sendNotification({
    id: 'aam-installing',
    message: update ? 'Updating AAM' : 'Installing AAM',
    type: 'activity',
    noDismiss: true,
    allowSuppress: false,
  });

  if (api.ext?.ensureLoggedIn !== undefined) {
    await api.ext.ensureLoggedIn();
  }

  try {
    const modFiles = await api.ext.nexusGetModFiles!(GAME_ID, AAM_MOD_ID);

    const fileTime = (input: any) => Number.parseInt(input.uploaded_time, 10);

    const file = modFiles
      .filter(file => file.category_id === 1)
      .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];

    if (file === undefined) {
      throw new util.ProcessCanceled('No AAM main file found');
    }

    const dlInfo = {
      game: GAME_ID,
      name: 'AAM',
    };

    const nxmUrl = `nxm://${GAME_ID}/mods/${AAM_MOD_ID}/files/${file.file_id}`;
    const dlId = await util.toPromise<string>(cb =>
      api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, undefined, { allowInstall: false }));
    const modId = await util.toPromise<string>(cb =>
      api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));
    const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
    await actions.setModsEnabled(api, profileId, [modId], true, {
      allowAutoDeploy: false,
      installed: true,
    });

    // await deployAAM(api);
  } catch (err) {
    api.showErrorNotification!('Failed to download/install AAM', err);
    util.opn(AAM_URL).catch(() => null);
  } finally {
    api.dismissNotification!('aam-installing');
  }
}

async function installAAM(files: string[]): Promise<types.IInstallResult> {
  // We're going to deploy "/Remnant2/" and whatever folders come alongside it.
  //  i.e. SomeMod.7z
  //  Will be deployed     => ../SomeMod/Remnant2/
  //  Will be deployed     => ../SomeMod/Mods/
  //  Will NOT be deployed => ../Readme.doc
  const contentFile: string | undefined = files.find(file => path.join('fakeDir', file).endsWith(PATTERN_ROOT_MOD));
  if (!contentFile) throw new Error('Could not install mod as it does not include a "Remnant2" folder.');
  const idx = (contentFile).indexOf(PATTERN_ROOT_MOD) + 1;
  const rootDir = path.basename(contentFile.substring(0, idx));
  const filtered = files.filter(file => !file.endsWith(path.sep)
    && (file.indexOf(rootDir) !== -1)
    && (path.extname(file) !== '.txt'));
  const instructions: types.IInstruction[] = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  });

  return { instructions };
}

async function isAAMModType(instructions: types.IInstruction[]) {
  // Only interested in copy instructions.
  const copyInstructions = instructions.filter(instr => instr.type === 'copy');
  // This is a tricky pattern so we're going to 1st present the different packaging
  //  patterns we need to cater for:
  //  1. Replacement mod with "Remnant2" folder. Does not require AAM so no
  //    manifest files are included.
  //  2. Replacement mod with "Remnant2" folder + one or more AAM mods included
  //    alongside the Remnant2 folder inside a "Mods" folder.
  //  3. A regular AAM mod with a "Remnant2" folder inside the mod's root dir.
  //
  // pattern 1:
  //  - Ensure we don't have manifest files
  //  - Ensure we have a "Remnant2" folder
  //
  // To solve patterns 2 and 3 we're going to:
  //  Check whether we have any manifest files, if we do, we expect the following
  //    archive structure in order for the modType to function correctly:
  //    archive.zip =>
  //      ../Remnant2/
  //      ../Mods/
  //      ../Mods/A_AAM_MOD\manifest.json
  const hasManifest = copyInstructions.find(instr =>
    instr.destination?.endsWith(MANIFEST_FILE))
  const hasModsFolder = copyInstructions.find(instr =>
    instr.destination?.startsWith('Mods' + path.sep)) !== undefined;
  const hasContentFolder = copyInstructions.find(instr =>
    instr.destination?.startsWith('Remnant2' + path.sep)) !== undefined

  return (hasManifest)
    ? Promise.resolve(hasContentFolder && hasModsFolder)
    : Promise.resolve(hasContentFolder);
}



export { testAAM, installAAM, isAAMModType };