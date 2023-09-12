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

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Remnant2', 'Binaries', 'Win64', 'Mods'));
}

function main(context) {
	//This is the main function Vortex will run when detecting the game extension. 

  context.registerGame({
    id: GAME_ID,
    name: 'Remnant II',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    // most mods include the full path in their archive, so we don't need to extract them
    queryModPath: () => '.',
    logo: 'remnant2.jpg',
    executable: () => 'Remnant2.exe',
    requiresLauncher: true,
    requiredFiles: [
      'Remnant2.exe',
      'Remnant2/Binaries/Win64/Remnant2-Win64-Shipping.exe',
    ],
    setup: prepareForModding,
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