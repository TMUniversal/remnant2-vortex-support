import * as path from 'path';
import { types } from 'vortex-api';
import { GAME_ID } from '../common';
import { IExtensionContext } from 'vortex-api/lib/types/api';

export const PAK_MODS_PATH = path.join('Remnant2', 'Binaries', 'Win64', '~mods');
const PATTERN_PAK_MOD = '.pak';

async function testModDir(files: string[], gameId: string): Promise<{ supported: boolean, requiredFiles?: string[] }> {
  // We assume that any mod containing a ".pak" file at its archive root
  // is meant to be deployed to PAK_MODS_PATH.
  const pakFile = files.find(file => !file.includes('/') && file.endsWith(PATTERN_PAK_MOD));
  const supported = ((gameId === GAME_ID) && (pakFile !== undefined));

  return { supported };
}

async function installModDir(context: IExtensionContext, files: string[], destinationPath: string): Promise<types.IInstallResult> {
  const contentFile: string | undefined = files.find(file => file.endsWith(PATTERN_PAK_MOD));
  if (!contentFile) throw new Error('Could not install mod as it does not include a ".pak" file.');

  // We're going to deploy the .pak files to "/Remnant2/Binaries/Win64/~mods/"
  //  i.e. SomeMod.7z
  //  Will be deployed    : SomeMod.7z/SomeMod.pak => /Remnant2/Binaries/Win64/~mods/SomeMod.pak
  //  Will NOT be deployed: SomeMod.7z/Readme.txt

  const filtered = files.filter(file => !file.endsWith(path.sep) && (path.extname(file) !== '.txt'));

  const instructions: types.IInstruction[] = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(PAK_MODS_PATH, file),
    };
  });

  return { instructions };
}

export { testModDir, installModDir };
