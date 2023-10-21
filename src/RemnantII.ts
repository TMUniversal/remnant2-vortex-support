import * as path from "path";
import { fs, log, types, util } from "vortex-api";
import { GAME_ID, SCRIPT_MODS_PATH, STEAMAPP_ID } from "./common";
import { PAK_MODS_PATH } from "./installers/pak";
import { XINPUT_DLL, downloadAAM } from "./installers/modEnabler";

export default class RemnantII implements types.IGame {
  private context: types.IExtensionContext;
  public id: string;
  public name: string;
  public logo: string;
  public requiredFiles: string[];
  public environment: { [key: string]: string };
  public details: Object;
  public supportedTools: any[];
  public mergeMods: boolean;
  public requiresCleanup: boolean;
  public shell: boolean;

  constructor(context: types.IExtensionContext) {
    this.context = context;
    this.id = GAME_ID;
    this.name = "Remnant II";
    this.logo = "gameart.jpg";
    this.requiredFiles = [
      "Remnant2.exe",
      "Remnant2/Binaries/Win64/Remnant2-Win64-Shipping.exe",
    ];
    this.environment = {
      SteamAppId: STEAMAPP_ID,
    };
    this.details = {
      steamAppId: parseInt(STEAMAPP_ID),
      // gogAppId: GOGAPP_ID,
      // xboxAppId: XBOXAPP_ID,
    };
    this.supportedTools = [
      {
        // Remnant Save Guardian: Save backups and analysis
        // https://github.com/Razzmatazzz/RemnantSaveGuardian
        id: "remnant-save-guardian",
        name: "Remnant Save Guardian",
        shortName: "RSG",
        logo: "remnant-save-guardian.png",
        executable: () => "RemnantSaveGuardian.exe",
        requiredFiles: ["RemnantSaveGuardian.exe"],
      },
    ];
    this.mergeMods = true;
    this.requiresCleanup = true;
    this.shell = false;
  }

  async queryPath() {
    const game: types.IGameStoreEntry = await util.GameStoreHelper.findByAppId([
      STEAMAPP_ID,
    ]);
    if (!!game) return game.gamePath;
  }

  // The EXE to launch the game, file ext omitted for Linux/MacOS
  executable(): string {
    return "Remnant2.exe";
  }

  queryModPath = (): string => PAK_MODS_PATH;

  // Setup function that runs when the game is managed and when switching to it.
  async setup(discovery: types.IDiscoveryResult) {
    try {
      await fs.ensureDirWritableAsync(
        path.join(discovery.path, SCRIPT_MODS_PATH),
      );
      await fs.ensureDirWritableAsync(path.join(discovery.path, PAK_MODS_PATH));
    } catch (err) {
      return Promise.reject(
        new Error(
          "Unable to write to Mods folder for Remnant II: " + err.message,
        ),
      );
    }

    // Check if Allow Asset Mods (RE-UE4SS) is installed/deployed.
    const allowModsPath = path.join(
      discovery.path,
      "Remnant2",
      "Binaries",
      "Win64",
      XINPUT_DLL,
    );
    try {
      await fs.statAsync(allowModsPath);
    } catch (err) {
      if (err.code !== "ENOENT")
        log(
          "warn",
          'Unexpected error checking for "Allow Asset Mods" mod',
          err,
        );
      return this.context.api.sendNotification({
        id: "remnant2-missing-injector",
        type: "warning",
        message: this.context.api.translate(
          '"Allow Asset Mods" is required to enable Remnant II modding.',
        ),
        allowSuppress: true,
        actions: [
          {
            title: "More",
            action: async (dismiss) => {
              this.context.api.showDialog(
                "question",
                "Action required",
                {
                  text:
                    '"Allow Asset Mods" is required to enable Remnant II mods. ' +
                    "Please ensure it is installed and enabled." +
                    ' If you are on Steam Deck, select the Steam Deck version of "Allow Asset Mods",' +
                    "and refer to the mod page for additional setup instructions.",
                },
                [
                  { label: "Cancel", action: () => dismiss() },
                  {
                    label: "Download automatically",
                    action: () => downloadAAM(this.context.api, false),
                  },
                  {
                    label: 'Go to "Allow Asset Mods" mod page',
                    action: () => {
                      util
                        .opn("https://www.nexusmods.com/remnant2/mods/2")
                        .catch(() => undefined);
                      dismiss();
                    },
                  },
                ],
              );
            },
          },
        ],
      });
    }
  }
}
