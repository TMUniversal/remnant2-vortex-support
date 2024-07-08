import { fs } from "vortex-api";
import RemnantII from "./RemnantII";
import { AAM_MOD_PATH_XBOX } from "./installers/modEnabler";
import path = require("path");

async function isXboxStoreVersion(game: RemnantII): Promise<boolean> {
  const gamePath: string = await game.queryPath();

  // see if AAM_MOD_PATH_XBOX exists in the game path
  return fs.existsSync(path.join(gamePath, AAM_MOD_PATH_XBOX));
}

export { isXboxStoreVersion };
