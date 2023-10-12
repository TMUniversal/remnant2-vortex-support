import * as path from 'path';
import { types } from 'vortex-api';
import { GAME_ID } from '../common';

const PATTERN_ROOT_MOD = path.sep + 'Remnant2' + path.sep;

async function testRootDir(files: string[], gameId: string): Promise<{ supported: boolean, requiredFiles?: string[] }> {
  // We assume that any mod containing "/Remnant2/" in its directory
  //  structure is meant to be deployed to the root folder.
  const filtered = files.filter(file => file.endsWith(path.sep)).map(file => path.join('fakeDir', file));
  const contentDir = filtered.find(file => file.endsWith(PATTERN_ROOT_MOD));
  const supported = ((gameId === GAME_ID) && (contentDir !== undefined));

  return { supported };
}

async function installRootDir(files: string[]): Promise<types.IInstallResult> {
  // We're going to deploy "/Remnant2/" and whatever folders come alongside it.
  //  i.e. SomeMod.7z
  //  Will be deployed     => ../SomeMod/Remnant2/
  //  Will be deployed     => ../SomeMod/Mods/
  //  Will NOT be deployed => ../Readme.txt
  const contentFile: string | undefined = files.find(file => path.join('fakeDir', file).endsWith(PATTERN_ROOT_MOD));
  if (!contentFile) throw new Error('Could not install mod as it does not include a "Remnant2" folder.');
  const idx = (contentFile).indexOf(PATTERN_ROOT_MOD) + 1;
  const rootDir = path.basename(contentFile.substring(0, idx));
  const filtered = files.filter(file => !file.endsWith(path.sep) && (file.indexOf(rootDir) !== -1) && (path.extname(file) !== '.txt'));
  const instructions: types.IInstruction[] = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  });

  return { instructions };
}

async function isRootDirMod(instructions: types.IInstruction[]) {
  // Only interested in copy instructions.
  const copyInstructions = instructions.filter(instr => instr.type === 'copy');

  const hasContentFolder = copyInstructions.find(instr =>
    instr.destination?.startsWith('Remnant2' + path.sep)) !== undefined

  return Promise.resolve(hasContentFolder);
}



export { testRootDir, installRootDir, isRootDirMod };