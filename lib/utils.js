'use strict';

var crypto = require('crypto');
var sprintf = require("sprintf-js").sprintf;

exports.randomID = function() {
    return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest();
};

exports.decodeNodes = function(data) {
    var nodes = [];
    for (var i = 0; i + 26 <= data.length; i += 26) {
        nodes.push({
            nid: data.slice(i, i + 20),
            address: data[i + 20] + '.' + data[i + 21] + '.' +
                data[i + 22] + '.' + data[i + 23],
            port: data.readUInt16BE(i + 24)
        });
    }
    return nodes;
};

exports.genNeighborID = function(target, nid) {
    return  Buffer.concat([target.slice(0, 10), nid.slice(10)]);
};

exports.readableFileSize = function(x){
    if(x === 0) return '1B';
    var label = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB'];
    var m = Math.floor((Math.log(x) / Math.log(2)) / 10);
    var b = Math.pow(2, m * 10);
    return sprintf('%.1f%s', (Math.floor(x / b) + (x % b) / (Math.pow(1024, m))), label[Math.floor(m)])
};
