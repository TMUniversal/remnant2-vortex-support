//Import some assets from Vortex we'll need.
const path = require('path');
const { fs, log, util } = require('vortex-api');

const GAME_ID = 'remnant2';

//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = '1282100';

//GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = undefined; // remnant2 is not on GOG

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
    .then(game => game.gamePath);
}

function raiseNotify(api) {
  api.sendNotification({
    id: 'remnant2-missing-injector',
    type: 'warning',
    message: api.translate('An injector mod is required'),
    allowSuppress: true,
    actions: [
      {
        title: 'More',
        action: () => {
          api.showDialog('question', 'Action required', {
            text: '"Allow Asset Mods" is required to enable Remnant II mods. ' +
              'Please ensure it is installed and enabled.' +
              'If you are on Steam Deck, select the Steam Deck version of "Allow Asset Mods",' +
              'and refer to the mod page for additional setup instructions.'
          }, [
            { label: 'Cancel', action: (dismiss) => dismiss() },
            {
              label: 'Go to "Allow Asset Mods" mod page', action: (dismiss) => {
                util.opn('https://www.nexusmods.com/remnant2/mods/2').catch(err => undefined);
                dismiss();
              }
            },
          ]);
        },
      },
    ],
  });
}

function prepareForModding(discovery, api) {
  raiseNotify(api);
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Remnant2', 'Binaries', 'Win64', 'Mods'));
}

function main(context) {
  //This is the main function Vortex will run when detecting the game extension. 

  context.registerGame({
    id: GAME_ID,
    name: 'Remnant II',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [{
      // Remnant Save Guardian: Save backups and analysis
      // https://github.com/Razzmatazzz/RemnantSaveGuardian
      id: 'remnant-save-guardian',
      name: 'Remnant Save Guardian',
      shortName: 'RSG',
      logo: 'remnant-save-guardian.png',
      executable: () => 'RemnantSaveGuardian.exe',
      requiredFiles: [
        'RemnantSaveGuardian.exe',
      ],
    }],
    // most mods include the full path in their archive, so we don't need to extract them
    queryModPath: () => '.',
    logo: 'remnant2.jpg',
    executable: () => 'Remnant2.exe',
    requiresLauncher: () => true,
    requiredFiles: [
      'Remnant2.exe',
      'Remnant2/Binaries/Win64/Remnant2-Win64-Shipping.exe',
    ],
    setup: (discovery) => prepareForModding(discovery, context.api),
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      // gogAppId: GOGAPP_ID,
      // stopPatterns: [
      //   '(^|/)Scripts(/|$)'
      // ]
    },
  });

  return true;
}

module.exports = {
  default: main,
};