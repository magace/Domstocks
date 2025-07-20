const AutoPerm = new Runnable(function AutoPerm () {
  var permed = false;
  include("systems/domstocks/domstocks.js");

  var autopermPath = "shop/autoperm/" + me.profile + ".json";

  if (!FileTools.exists(autopermPath)) {
      D2Bot.printToConsole("❌ AutoPerm file not found: " + autopermPath);
      return false;
  }

  var content = FileTools.readText(autopermPath).trim();
  if (!content) {
      D2Bot.printToConsole("❌ AutoPerm file is empty.");
      return false;
  }

  var job;
  try {
      job = JSON.parse(content);
  } catch (e) {
      D2Bot.printToConsole("❌ Failed to parse AutoPerm JSON: " + e);
      return false;
  }

  if (!job.charname || !job.account || !job.password) {
      D2Bot.printToConsole("❌ Incomplete AutoPerm job data.");
      return false;
  }

  // Refresh Label
  var statusLabel = job.status === "needsrefresh" ? "Refreshing" : "Perming";

  // Timing settings
  var minGameMinutes, permTime;
  if (job.status === "needsrefresh") {
      D2Bot.printToConsole("NeedsRefresh detected — using 30m perm duration.");
      minGameMinutes = 30;
      permTime = 30;
  } else {
      minGameMinutes = 120;
      permTime = 120;
  }

  var antiidleRefresh = 1;

  me.maxgametime = 0;
  var forcRealmPerm = ["escnl"];
  var myrealm = domstocks.getRealmAcro();
  D2Bot.printToConsole("Realm detected: " + myrealm);

  var minpermgametime = minGameMinutes * 60;
  var antiMin = antiidleRefresh * 60;
  var timeout = getTickCount() + (permTime * 60 * 1000);

  MuleLogger.logChar();

  // === Perming Loop ===
  var lastRefresh = getTickCount();
  var totalTime = permTime * 60;
  var barLength = 15;

  while (!permed) {
      delay(1000);

      var elapsed = Math.floor((getTickCount() - me.gamestarttime) / 1000);
      var progressBar = getProgressBar(elapsed, totalTime, barLength);

      var elapsedStr = formatTime(elapsed);
      var totalStr = formatTime(totalTime);

      var fullStatus = statusLabel + " " + me.name + " | Realm: " + myrealm + " | " + elapsedStr + " / " + totalStr + " " + progressBar;
      D2Bot.updateStatus(fullStatus);
      me.overhead(statusLabel + "... " + elapsedStr);
      

      if (me.charlvl >= 5 || getTickCount() > timeout || forcRealmPerm.indexOf(myrealm) > -1) {
          if (forcRealmPerm.indexOf(myrealm) > -1) {
              D2Bot.printToConsole("Realm override active for: " + myrealm + " — forcing perm.");
          }

          var now = new Date();
          job.status = "perm";
          job.time = now.toISOString();

          var expireDate = new Date();
          expireDate.setDate(now.getDate() + 50);
          job.expires = expireDate.toISOString();

          var writeSuccess = false;
          for (var attempt = 1; attempt <= 5; attempt++) {
              if (FileAction.write(autopermPath, JSON.stringify(job, null, 4))) {
                  writeSuccess = true;
                  break;
              }
              D2Bot.printToConsole("Attempt " + attempt + " to save perm JSON failed. Retrying...");
              delay(1000);
          }

          if (!writeSuccess) {
              D2Bot.printToConsole("Failed to save perm JSON after 5 attempts!");
              return false;
          }

          D2Bot.printToConsole("Permed! Char: " + job.charname);
          permed = true;
      }

      if (getTickCount() - lastRefresh >= antiMin * 1000) {
          Packet.questRefresh();
          lastRefresh = getTickCount();
      }
  }

// === Post-Perm Stay In Game ===
lastRefresh = getTickCount();

while (true) {
    delay(1000);

    var elapsed = Math.floor((getTickCount() - me.gamestarttime) / 1000);
    var progressBar = getProgressBar(elapsed, minpermgametime, barLength);
    var elapsedStr = formatTime(elapsed);
    var totalStr = formatTime(minpermgametime);

    var fullStatus =  statusLabel + " " + me.name + " | Realm: " + myrealm + " | " + elapsedStr + " / " + totalStr + " " + progressBar;

    D2Bot.updateStatus(fullStatus);


      if (getTickCount() - lastRefresh >= antiMin * 1000) {
          Packet.questRefresh();
          lastRefresh = getTickCount();
      }

      if (elapsed >= minpermgametime) {
          me.overhead("Min Perm Time met. Restarting.");
          print("Perm duration met. Restarting bot...");
          D2Bot.restart();
          break;
      }
  }

  return true;

  // === Helpers ===
  function formatTime(seconds) {
      var mins = Math.floor(seconds / 60);
      var secs = seconds % 60;
      return mins + "m " + (secs < 10 ? "0" : "") + secs + "s";
  }

  function getProgressBar(elapsed, totalSeconds, barLength) {
    var percent = Math.min(elapsed / totalSeconds, 1);
    var filled = Math.floor(barLength * percent);
    var empty = barLength - filled;
    var bar = "[";

    for (var i = 0; i < filled; i++) bar += "■";
    for (var j = 0; j < empty; j++) bar += "□";

    bar += "] " + Math.floor(percent * 100) + "%";
    return bar;
}

});
