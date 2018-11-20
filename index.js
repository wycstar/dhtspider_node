'use strict';

var P2PSpider = require('./lib');
var chardet = require('jschardet');
var iconv = require("iconv-lite");
var mongo = require('mongodb').MongoClient;
var getFileType = require('./lib/filetype');

var p2p = P2PSpider({
    nodesMaxSize: 400,
    maxConnections: 800,
    timeout: 10000
});

p2p.on('metadata', function (metadata) {
    var files = [];
    var resource_name = '';
    var utf_enable = false;
    var encoding_list = ['UTF-8', 'ascii', 'TIS-620', 'GB2312', 'Big5'];

    if(metadata.info.hasOwnProperty('name.utf-8')){
        resource_name = metadata.info['name.utf-8'];
        utf_enable = true;
    }else if(metadata.info.hasOwnProperty('name')){
        resource_name = metadata.info['name'];
    }else{
        return
    }

    var encoding = chardet.detect(resource_name).encoding;
    if(encoding_list.indexOf(encoding) < 0) return;

    if(metadata.info.hasOwnProperty('files')){
        metadata.info.files.forEach(function (t) {
            var item_name = t[ utf_enable === true ? 'path.utf-8' : 'path'].join('/');
            if(item_name.indexOf('padding_file') === -1){
                files.push({
                    'n': item_name,
                    'l': t['length']
                })
            }
        })
    }else{
        files.push({
            'n': iconv.decode(resource_name, encoding),
            'l': metadata.info['length']
        })
    }
    var insert_data = function (db, callback) {
        var collection = db.collection(process.env['MONGO_COLLECTION']);
        collection.updateOne({'_id': metadata.infohash},
            {
                '$setOnInsert': {
                    '_id': metadata.infohash,
                    'd': Math.floor(Date.now() / 1000),
                    'n': iconv.decode(resource_name, encoding),
                    's': files.length,
                    'l': files.reduce(function (total, n) {
                        return total + n['l']
                    }, 0),
                    'e': 1,
                    't': getFileType(files)
                },
                '$set': {
                    'm': Math.floor(Date.now() / 1000),
                    'f': files
                },
                '$inc': {
                    'c': 1
                }
            },
            {upsert: true},
            function (err, result) {
                if (err) {
                    return;
                }
                callback(result)
            });
    };
    mongo.connect('mongodb://' +
                  process.env['MONGO_HOST'] +
                  ':' +
                  process.env['MONGO_PORT'] +
                  '/' +
                  process.env['MONGO_DB'], function(err, db) {
        if(err){
            return
        }
        insert_data(db, function(result) {
            db.close();
        });
    });
});

p2p.listen(6881, '0.0.0.0');
