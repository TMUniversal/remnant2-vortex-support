import * as path from 'path';
import { types } from 'vortex-api';
import { GAME_ID } from '../common';

export const PAK_MODS_PATH = path.join('Remnant2','Binaries','Win64','~mods');
const PATTERN_PAK_MOD = '.pak';

async function testModDir(files: string[], gameId: string): Promise<{ supported: boolean, requiredFiles?: string[] }> {
  // We assume that any mod containing a ".pak" file at its archive root
  // is meant to be deployed to PAK_MODS_PATH.
  const pakFile = files.find(file => file.endsWith(PATTERN_PAK_MOD));
  const supported = ((gameId === GAME_ID) && (pakFile !== undefined));

  return { supported };
}

async function installModDir(files: string[]): Promise<types.IInstallResult> {
  const contentFile: string | undefined = files.find(file => file.endsWith(PATTERN_PAK_MOD));
  if (!contentFile) throw new Error('Could not install mod as it does not include a ".pak" file.');
  const idx = (contentFile).indexOf(PATTERN_PAK_MOD) + 1;
  const ModDir = path.basename(contentFile.substring(0, idx));
  const filtered = files.filter(file => !file.endsWith(path.sep)&& (file.indexOf(ModDir) !== -1)&& (path.extname(file) !== '.txt'));
  const instructions: types.IInstruction[] = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file.substr(idx),
    };
  });

  return { instructions };
}

async function isModDirMod(instructions: types.IInstruction[]) {
  // Only interested in copy instructions.
  const copyInstructions = instructions.filter(instr => instr.type === 'copy');
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



export { testModDir, installModDir, isModDirMod };