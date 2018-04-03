#!/usr/bin/env node
var generator = require('./lib/generator');
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var optimist = require('optimist');

module.exports = generate;

var FORMATS = {
  'json': {template: 'json.template', extension: 'json', trim: false},
  'jsonarray': {template: 'jsonarray.template', extension: 'json', trim: false},
  'pixi.js': {template: 'json.template', extension: 'json', trim: true},
  'starling': {template: 'starling.template', extension: 'xml', trim: true},
  'sparrow': {template: 'starling.template', extension: 'xml', trim: true},
  'easel.js': {template: 'easeljs.template', extension: 'json', trim: false},
  'cocos2d': {template: 'cocos2d.template', extension: 'plist', trim: false},
  'cocos2dx': {template: 'cocos2dx.template', extension: 'plist', trim: false},
  'css': {template: 'css.template', extension: 'css', trim: false},
  'kiwi': {template: 'kiwi.template', extension: 'json', trim: false}
};

if (!module.parent) {
  var argv = optimist.usage('Usage: $0 [options] <files>')
    .options('f', {
      alias: 'format',
      describe: 'format of spritesheet (kiwi, starling, sparrow, json, pixi.js, easel.js, cocos2d)',
      default: ''
    })
    .options('cf', {
      alias: 'customFormat',
      describe: 'path to external format template',
      default: ''
    })
    .options('n', {
      alias: 'name',
      describe: 'name of generated spritesheet',
      default: 'spritesheet'
    })
    .options('p', {
      alias: 'path',
      describe: 'path to export directory',
      default: '.'
    })
    .options('w', {
      alias: 'width',
      describe: 'The maximum width of the generated image(s), required for binpacking, optional for other algorithms',
      default: 999999
    })
    .options('h', {
      alias: 'height',
      describe: 'The maximum height of the generated image(s), required for binpacking, optional for other algorithms',
      default: 999999
    })
    .options('fullpath', {
      describe: 'include path in file name',
      default: false,
      boolean: true
    })
    .options('prefix', {
      describe: 'prefix for image paths',
      default: ""
    })
    .options('trim', {
      describe: 'removes transparent whitespaces around images',
      default: false,
      boolean: true
    })
    .options('square', {
      describe: 'texture should be a square with dimensions max(width,height)',
      default: false,
      boolean: true
    })
    .options('powerOfTwo', {
      describe: 'texture width and height should be rounded up to the nearest power of two',
      default: false,
      boolean: true
    })
    .options('validate', {
      describe: 'check algorithm returned data',
      default: false,
      boolean: true
    })
    .options('scale', {
      describe: 'percentage scale',
      default: '100%'
    })
    .options('fuzz', {
      describe: 'percentage fuzz factor (usually value of 1% is a good choice)',
      default: ''
    })
    .options('algorithm', {
      describe: 'packing algorithm: growing-binpacking (default), binpacking (requires w and h options), vertical or horizontal',
      default: 'growing-binpacking'
    })
    .options('padding', {
      describe: 'padding between images in spritesheet',
      default: 0
    })
    .options('sort', {
      describe: 'Sort method: maxside (default), area, width or height',
      default: 'maxside'
    })
    .options('maxAtlases', {
      describe: 'maximum number of texture atlases that will be outputted',
      default: 0
    })
    .options('gutter', {
      describe: 'the number of pixels to bleed the image edge, gutter is added to padding value',
      default: 0
    })
    .options('group', {
      describe: 'allows you to specify a group of assets that must be included in the same atlas, make sure to use quotes around file paths',
      default: []
    })
    .options('resizeWidth', {
      describe: 'resizes all source images to a specific width',
      default: 0
    })
    .options('resizeHeight', {
      describe: 'resizes all source images to a specific height',
      default: 0
    })
    .demand(1)
    .argv;

  if (argv._.length == 0) {
    optimist.showHelp();
    return;
  }
  generate(argv._, argv, function (err) {
    if (err) throw err;
    console.log('Spritesheet successfully generated');
  });
}

/**
 * generates spritesheet
 * @param {string} files pattern of files images files
 * @param {string[]} files paths to image files
 * @param {object} options
 * @param {string} options.format format of spritesheet (starling, sparrow, json, pixi.js, easel.js, cocos2d, kiwi)
 * @param {string} options.customFormat external format template
 * @param {string} options.name name of the generated spritesheet
 * @param {string} options.path path to the generated spritesheet
 * @param {string} options.width maximum width of the generated image(s)
 * @param {string} options.height maximum height of the generated image(s)
 * @param {string} options.prefix prefix for image paths (css format only)
 * @param {boolean} options.fullpath include path in file name
 * @param {boolean} options.trim removes transparent whitespaces around images
 * @param {boolean} options.square texture should be square
 * @param {boolean} options.powerOfTwo texture's size (both width and height) should be a power of two
 * @param {string} options.algorithm packing algorithm: growing-binpacking (default), binpacking (requires passing width and height options), vertical or horizontal
 * @param {number} options.padding padding between images in spritesheet
 * @param {string} options.sort Sort method: maxside (default), area, width, height or none
 * @param {number} options.maxAtlases the maximum number of texture atlases that will be generated
 * @param {number} options.gutter the amount to bleed the edges of images in spritesheet
 * @param {function} callback
 */
function generate(files, options, callback) {
  files = Array.isArray(files) ? files : glob.sync(files);
  if (files.length == 0) return callback(new Error('no files specified'));

  options = options || {};
  if (Array.isArray(options.format)) {
    options.format = options.format.map(function(x){return FORMATS[x]});
  }
  else if (options.format || !options.customFormat) {
    options.format = [FORMATS[options.format] || FORMATS['json']];
  }
  options.name = options.name || 'spritesheet';
  options.spritesheetName = options.name;
  options.path = path.resolve(options.path || '.');
  options.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
  options.square = options.hasOwnProperty('square') ? options.square : false;
  options.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
  options.extension = options.hasOwnProperty('extension') ? options.extension : options.format[0].extension;
  options.trim = options.hasOwnProperty('trim') ? options.trim : options.format[0].trim;
  options.algorithm = options.hasOwnProperty('algorithm') ? options.algorithm : 'growing-binpacking';
  options.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
  options.padding = options.hasOwnProperty('padding') ? parseInt(options.padding, 10) : 0;
  options.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
  options.maxAtlases = options.hasOwnProperty('maxAtlases') ? options.maxAtlases : 0;
  options.gutter = options.hasOwnProperty('gutter') ? parseInt(options.gutter, 10) : 0;
  options.resizeWidth = options.hasOwnProperty('resizeWidth') ? parseInt(options.resizeWidth, 10) : 0;
  options.resizeHeight = options.hasOwnProperty('resizeHeight') ? parseInt(options.resizeHeight, 10) : 0;

  var fileHash = {};
  files = files.map(function (item, index) {
    var resolvedItem = path.resolve(item);
    var name = "";
    if (options.fullpath) {
      name = item.substring(0, item.lastIndexOf("."));
    }
    else {
      name = options.prefix + resolvedItem.substring(resolvedItem.lastIndexOf(path.sep) + 1, resolvedItem.lastIndexOf('.'));
    }
    fileHash[resolvedItem] = {
      index: index,
      path: resolvedItem,
      name: name,
      extension: path.extname(resolvedItem)
    };
    return fileHash[resolvedItem];
  });

  if (options.group){
    options.group = Array.isArray(options.group) ? options.group : [options.group];
    options.groups = [];
    options.group.forEach(function(groupFiles){
      groupFiles = Array.isArray(groupFiles) ? groupFiles : glob.sync(groupFiles);
      var groupItems = [];
      groupFiles.forEach(function(item){
        var groupId = options.groups.length;
        var resolvedItem = path.resolve(item);
        if (fileHash.hasOwnProperty(resolvedItem)) {
          var fileInfo = fileHash[resolvedItem];
          fileInfo.group = groupId;
          groupItems.push(fileInfo);
        }
      });
      options.groups.push(groupItems);
    });
  }

  if (!fs.existsSync(options.path) && options.path !== '') fs.mkdirSync(options.path);

  async.waterfall([
    function (callback) {
      generator.trimImages(files, options, callback);
    },
    function (callback) {
      generator.resizeImages(files, options, callback);
    },
    function (files, callback) {
      generator.getImagesSizes(files, options, callback);
    },
    function (files, callback) {
      generator.determineCanvasSize(files, options, callback);
    },
    function (options, callback) {
      var n = 0;
      var ow = options.width;
      var oh = options.height;
      var baseName = options.name;
      async.each(options.atlases, function(atlas, done){
        options.name = atlas.name = baseName + '-' + (++n);
        options.width = atlas.width;
        options.height = atlas.height;
        generator.generateImage(atlas.files, options, done);
      }, callback);
      options.name = baseName;
      options.width = ow;
      options.height = oh;
    },
    function (callback) {
      var n = 0;
      var ow = options.width;
      var oh = options.height;
      var baseName = options.name;
      async.each(options.atlases, function(atlas, done){
        options.name = baseName + '-' + (++n); 
        options.width = atlas.width;
        options.height = atlas.height;
        generator.generateData(atlas.files, options, done);
      }, callback);
      options.name = baseName;
      options.width = ow;
      options.height = oh;
    }
  ],
    callback);
}
