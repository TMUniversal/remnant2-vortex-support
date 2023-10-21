import * as path from "path";
import { types, util, selectors, actions } from "vortex-api";
import { GAME_ID } from "../common";

const AAM_MOD_ID = 2;
const AAM_URL = `https://www.nexusmods.com/remnant2/mods/${AAM_MOD_ID}`;
const PATTERN_ROOT_MOD = path.sep + "Remnant2" + path.sep;
export const XINPUT_DLL = "xinput1_3.dll";

function testAAM(
  files: string[],
  gameId: string,
): { supported: boolean; requiredFiles?: string[] } {
  const supported =
    gameId === GAME_ID && !!files.find((f) => path.basename(f) === XINPUT_DLL);
  return { supported, requiredFiles: [] };
}

export async function downloadAAM(api: types.IExtensionApi, update?: boolean) {
  api.dismissNotification("remnant2-missing-injector");
  api.sendNotification({
    id: "aam-installing",
    message: update ? "Updating AAM" : "Installing AAM",
    type: "activity",
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
      .filter((file) => file.category_id === 1)
      .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];

    if (file === undefined) {
      throw new util.ProcessCanceled("No AAM main file found");
    }

    const dlInfo = {
      game: GAME_ID,
      name: "AAM",
    };

    const nxmUrl = `nxm://${GAME_ID}/mods/${AAM_MOD_ID}/files/${file.file_id}`;
    const dlId = await util.toPromise<string>((cb) =>
      api.events.emit(
        "start-download",
        [nxmUrl],
        dlInfo,
        undefined,
        cb,
        undefined,
        { allowInstall: false },
      ),
    );
    const modId = await util.toPromise<string>((cb) =>
      api.events.emit(
        "start-install-download",
        dlId,
        { allowAutoEnable: false },
        cb,
      ),
    );
    const profileId = selectors.lastActiveProfileForGame(
      api.getState(),
      GAME_ID,
    );
    await actions.setModsEnabled(api, profileId, [modId], true, {
      allowAutoDeploy: false,
      installed: true,
    });

    // await deployAAM(api);
  } catch (err) {
    api.showErrorNotification!("Failed to download/install AAM", err);
    util.opn(AAM_URL).catch(() => null);
  } finally {
    api.dismissNotification!("aam-installing");
  }
}

async function installAAM(
  getDiscoveryPath: () => string,
  files: string[],
  destinationPath: string,
): Promise<types.IInstallResult> {
  const contentFile: string | undefined = files.find((file) =>
    path.join("fakeDir", file).endsWith(PATTERN_ROOT_MOD),
  );
  if (!contentFile)
    throw new Error(
      'Could not install mod as it does not include a "Remnant2" folder.',
    );

  const filtered = files.filter((file) => !file.endsWith(path.sep));

  const instructions: types.IInstruction[] = filtered.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: file,
    };
  });

  return { instructions };
}

async function isAAMModType(instructions: types.IInstruction[]) {
  // Only interested in copy instructions.
  const copyInstructions = instructions.filter(
    (instr) => instr.type === "copy",
  );

  // if the mod contains `Remnant2/Binaries/Win64/xinput1_3.dll` then it is the mod enabler
  return Promise.resolve(
    copyInstructions.find(
      (instr) =>
        instr.destination?.startsWith(
          path.join("Remnant2", "Binaries", "Win64", XINPUT_DLL),
        ),
    ) !== undefined,
  );
}

export { testAAM, installAAM, isAAMModType };
