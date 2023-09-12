module.exports = {
  readVersion: function (contents) {
      const versionRegex = /"version": "(\d+\.\d+\.\d+)",/;
      const match = contents.match(versionRegex);
      if (match) {
          return match[1];
      }
      return null;
  },
  writeVersion: function (contents, version) {
      const versionRegex = /val v = "(\d+\.\d+\.\d+)"/;
      const match = contents.match(versionRegex);
      if (!match) {
          throw new Error("Could not find version in info.json");
      }
      return contents.replace(versionRegex, `"version": "${version}",`);
  },
};
