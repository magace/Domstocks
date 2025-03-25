/**
*  @filename    domstocks.js
*  @author      magace
*  @desc        file for auto stock system
*
*/
function getRandomString(length = 6) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomStr = "";
    for (let i = 0; i < length; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomStr;
}
include("common/Pickit.js");
var domstocks = {
  validRealms: [
      "escl",  "escnl",  "esccl",  "esccnl",  "ehcl",  "ehcnl",  "ehccl",  "ehccnl",
      "wscl",  "wscnl",  "wsccl",  "wsccnl",  "whcl",  "whcnl",  "whccl",  "whccnl",
      "euscl", "euscnl", "eusccl", "eusccnl", "euhcl", "euhcnl", "euhccl", "euhccnl",
      "ascl",  "ascnl",  "asccl",  "asccnl",  "ahcl",  "ahcnl",  "ahccl",  "ahccnl", 
      "d2rscl"
  ],
  
  getRealmAcro: function () {
      let realmAcro = "";

      switch (me.realm.toLowerCase()) {
          case 'useast':
              realmAcro = "e";
              break;
          case 'uswest':
              realmAcro = "w";
              break;
          case 'europe':
              realmAcro = "eu";
              break;
          case 'asia':
              realmAcro = "a";
              break;
          case 'resurrected':
              realmAcro = "d2r";
              break;
          case '':
              return "SP";
      }

      if (me.playertype) {
          realmAcro += "hc";
      } else {
          realmAcro += "sc";
      }

      if (!me.gametype) {
          realmAcro += "c";
      }

      if (me.ladder == 0) {
          realmAcro += "nl";
      } else {
          realmAcro += "l";
      }

      if (this.validRealms.indexOf(realmAcro) === -1) {
          D2Bot.printToConsole("invalid realm:" + realmAcro + " REALM: " + me.realm);
          return false;
      }

      return realmAcro;
  },
  addToPickit: function () {
    let myRealm = this.getRealmAcro();
    Config.PickitFiles.push("shop/" + domstocks.getRealmAcro() + ".nip");
    let nipPath = "pickit/shop/base/" + myRealm + ".nip";
    let contents = FileTools.readText(nipPath);

    if (!contents) {
        D2Bot.printToConsole("Error: Unable to read file: " + nipPath);
        return [];
    }

    let lines = contents.split(/\r?\n/);
    let cleanLines = [];

    lines.forEach(function (line) {
        let trimmed = line.trim();
        if (trimmed) {
            NTIP.addLine(trimmed, myRealm); 
            cleanLines.push(trimmed);
        }
    });

    D2Bot.printToConsole("Successfully added " + cleanLines.length + " lines to NTIP from " + nipPath);
    return cleanLines;
},
testPickit: function () {
    let myRealm = this.getRealmAcro();
    Config.PickitFiles.push("pickit/shop/base/" + domstocks.getRealmAcro() + ".nip");
    print("PICKIT ADDED?");
    return;
},
removeStocks: function (itemIds) {

},
logstocks: function () {
    
    let items = me.getItems();
    let itemsArray = [];
    let charname = me.charname;
    let account = me.account;
    let pass = "x";
    let myRealm = this.getRealmAcro();
    NTIP.Clear();
    NTIP.OpenFile("pickit/shop/base/" + myRealm + ".nip", true);
    D2Bot.printToConsole("Logging Stocks");
    D2Bot.printToConsole("Items count: " + items.length);
    D2Bot.printToConsole("Character: " + charname + " | Account: " + account);
    D2Bot.printToConsole("Realm: " + myRealm);

    let nipPath = "pickit/shop/base/" + myRealm + ".nip";
    if (!FileTools.exists(nipPath)) {
        D2Bot.printToConsole("❌ NIP file not found: " + nipPath);
        return;
    }

    let nipLines = FileTools.readText(nipPath).split(/\r?\n/);

    for (let i = 0; i < items.length; i++) {
        delay(100);
        let item = items[i];

        if ([22, 76, 77, 78].indexOf(item.itemType) !== -1) continue;
        if (item.mode === 1 && this.skipEquiped) continue;

        let result = Pickit.checkItem(item);

        if (result && typeof result === "object" && result.line) {
            //D2Bot.printToConsole("Checking item: " + item.name + " | Result line: " + result.line);
        
            let match = result.line.match(/^([a-zA-Z0-9_]+(?:\.nip)?)\s*#(\d+)$/);
        
            if (match) {
                let prefix = match[1].replace(".nip", "").trim(); // remove .nip if present
                let lineNum = parseInt(match[2], 10);
                lineNum = lineNum;
                if (prefix !== myRealm) {
                    //D2Bot.printToConsole("⚠️ Skipping item: " + item.name + " — Pickit prefix mismatch (" + prefix + ")");
                    continue;
                }
        
                itemsArray.push({

                    lineNumber: lineNum
                });
                //D2Bot.printToConsole("✅ Added item: " + item.name + " | Line #: " + lineNum);
            } else {
                //D2Bot.printToConsole("❌ Couldn't extract line number from result.line: " + result.line);
            }
        }
        
    }

    D2Bot.printToConsole("logstocks completed. Total valid items: " + itemsArray.length);

    if (itemsArray.length > 0) {
        let jsonData = {
            profile: me.profile,
            account: account,
            realm: myRealm,
            items: itemsArray,
            charname: charname,
            password: pass
        };



        let savePath = "shop/data/" + myRealm + "_" + getRandomString() + ".json";
        FileAction.write(savePath, JSON.stringify(jsonData, null, 4));
        //D2Bot.printToConsole("✅ Saved stock log to: " + savePath);
    } else {
        //D2Bot.printToConsole("❌ No valid items found to save.");
    }
},



};

D2Bot.printToConsole("domstocks loaded");
