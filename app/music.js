const { ids } = require("./cache");

function isAMusicChannel(id) {
    var ret = false;
    ids.channels.musica.forEach(channel => {
        if (id === channel)
            ret = true;
    });
    return ret;
}

module.exports = { isAMusicChannel }