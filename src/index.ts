import { log } from "vortex-api";
import { IExtensionContext } from "vortex-api/lib/types/api";
import { GAME_ID } from "./common";
import { testModDir, installModDir } from "./installers/pak";
import {
  testRootDir,
  installRootDir,
  isRootDirMod,
} from "./installers/rootDirectory";
import RemnantII from "./RemnantII";
import { installAAM, isAAMModType, testAAM } from "./installers/modEnabler";

function main(context: IExtensionContext) {
  // Register the game so it can be discovered.
  context.registerGame(new RemnantII(context));

  const getDiscoveryPath = (): string => {
    const state = context.api.getState();
    const discovery = state.settings?.gameMode?.discovered?.[GAME_ID];
    if (!discovery || !discovery.path) {
      log(
        "error",
        "Remnant II game path could not be found as the game is not discovered",
      );
      return undefined;
    }
    return discovery.path;
  };

  // Register the installers and modTypes we'll need to handle different kinds of mod.

  // mods containing .pak files at the root need to be installed in the "~mods" folder
  context.registerInstaller("r2-pak-installer", 50, testModDir, installModDir);

  // Allow Asset Mods (AAM) is a mod that allows other mods to be loaded.
  context.registerInstaller("r2-aam-installer", 30, testAAM, installAAM);
  context.registerModType(
    "AAM",
    30,
    (gameId) => gameId === GAME_ID,
    getDiscoveryPath,
    isAAMModType,
  );

  // Other mods that need to be added to the root folder
  context.registerInstaller("r2rootDir", 50, testRootDir, installRootDir);
  context.registerModType(
    "r2rootDir",
    25,
    (gameId) => gameId === GAME_ID,
    () => getDiscoveryPath(),
    isRootDirMod,
  );

  return true;
}

module.exports = {
  default: main,
};
