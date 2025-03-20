/**
*  @filename    domstocks.js
*  @author      magace
*  @desc        file for auto stock system
*
*/
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
    var path = "pickit/shop/" + myRealm + ".nip"; 
    var contents = FileTools.readText(path);

    if (!contents) {
        print("Error: Unable to read file: " + path);
        return; 
    }

    var lines = contents.split(/\r?\n/); // Split file into lines

    //  Loop through each line and add it to NTIP
    lines.forEach(function (line) {
        if (line.trim()) { // 
            NTIP.addLine(line,myRealm);
        }
    });

    print(" Successfully added " + lines.length + " lines to NTIP.");
},


  logstocks: function () {
    let items = me.getItems();
    let itemsArray = [];
    let charname = me.charname;
    let account = me.account;
    let pass = "x";
    let myRealm = this.getRealmAcro();
    this.addToPickit();
    print("logstocks function started");
    print("Items count: " + items.length);
    print("Character: " + charname + " | Account: " + account);
    print("Realm: " + myRealm);

   

    for (let i = 0; i < items.length; i++) {
        delay(100);

        if ([22, 76, 77, 78].indexOf(items[i].itemType) !== -1) {
            print("Skipping item (scrolls/potions): " + items[i].name);
            continue;
        }

        if (items[i].mode === 1 && this.skipEquiped) {
            print("Skipping equipped item: " + items[i].name);
            continue;
        }

        var result = Pickit.checkItem(items[i]); // Get pickit result
        print("Processing item: " + items[i].name);
        print("CheckItem result: " + JSON.stringify(result));

        // Ensure result.line exists and matches myRealm
        if (typeof result === "object" && result.line) {
            var lineMatch = result.line.match(/#(\d+)/);
            var lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : "N/A";

            print("Extracted line number: " + lineNumber);

            // Ensure it's from the correct pickit file (myRealm.nip)
            if (!result.line.includes(myRealm + "")) {
                print("Skipping item (not from myRealm pickit file): " + items[i].name);
                continue;
            }

            var path = "pickit/shop/" + myRealm + ".nip";
            var contents = FileTools.readText(path);

            if (!contents) {
                print("Error: Unable to read file: " + path);
                continue;
            }

            var lines = contents.split(/\r?\n/);
            var lineContent = (lineNumber > 0 && lineNumber <= lines.length) ? lines[lineNumber - 1] : null;

            if (lineContent !== null) {
                print("Item added: " + items[i].name + " - " + lineContent);

                itemsArray.push({
                    name: items[i].name,
                    pickitLine: lineContent
                });
            } else {
                print("Skipping item (no valid pickit match in file): " + items[i].name);
            }
        } else {
            print("Skipping item (Pickit check failed or wrong file): " + items[i].name);
        }
    }

    print("logstocks completed. Total valid items: " + itemsArray.length);
    if (itemsArray.length > 0) {
        var jsonData = {
            profile: me.profile,
            account: account,
            realm: myRealm,
            items: itemsArray,
            charname: charname,
            password: pass
            
        };

        function getRandomString(length = 6) {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let randomStr = "";
            for (let i = 0; i < length; i++) {
                randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return randomStr;
        }
        
        // Generate a random filename
        var randomStr = getRandomString();
        var savePath = "shop/data/" + myRealm + "_" + randomStr + ".json";
        
        // Save JSON file
        FileAction.write(savePath, JSON.stringify(jsonData, null, 4));
    } else {
        print("No valid items found, skipping JSON save.");
    }
}


};

print("domstocks loaded");
