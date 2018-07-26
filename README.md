# Gamefroot Texture Packer

[![Build Status](https://travis-ci.org/Gamefroot/Gamefroot-Texture-Packer.svg?branch=master)](https://travis-ci.org/Gamefroot/Gamefroot-Texture-Packer)

Generate high quality texture atlases in Node.js, developed for [Gamefroot.com](http://gamefroot.com) and [Kiwi.js](http://www.kiwijs.org/). 

## Features

* Use growing-binpacking to optimise your texture memory
* Trim, scale and pad assets to further make use of space
* Add gutter (bleed) to your images to avoid nasty join lines
* Add a maximum width/height to conform to platform limitations
* Generate as many atlases as you need with a single command
* Use texture groups to ensure optimal run-time performance

## Supported spritesheet formats

* Kiwi.js
* Starling / Sparrow
* JSON (i.e. PIXI.js)
* Easel.js
* cocos2d
* CSS (new!)

## Usage

### Command Line

```bash
$ gf-pack assets/*.png
```

Options:

```bash
$ gf-pack
Usage: gf-pack [options] <files>

Options:
  -f, --format          format of spritesheet (kiwi, starling, sparrow, json, pixi.js, easel.js, cocos2d)                                           [default: ""]
  --cf, --customFormat  path to external format template                                                                                            [default: ""]
  -n, --name            name of generated spritesheet                                                                                               [default: "spritesheet"]
  -p, --path            path to export directory                                                                                                    [default: "."]
  -w, --width           The maximum width of the generated image(s), required for binpacking, optional for other algorithms                         [default: 999999]
  -h, --height          The maximum height of the generated image(s), required for binpacking, optional for other algorithms                        [default: 999999]
  --fullpath            include path in file name                                                                                                   [default: false]
  --prefix              prefix for image paths                                                                                                      [default: ""]
  --trim                removes transparent whitespaces around images                                                                               [default: false]
  --square              texture should be a square with dimensions max(width,height)                                                                [default: false]
  --powerOfTwo          texture width and height should be rounded up to the nearest power of two                                                   [default: false]
  --validate            check algorithm returned data                                                                                               [default: false]
  --scale               percentage scale                                                                                                            [default: "100%"]
  --fuzz                percentage fuzz factor (usually value of 1% is a good choice)                                                               [default: ""]
  --algorithm           packing algorithm: growing-binpacking (default), binpacking (requires w and h options), vertical or horizontal              [default: "growing-binpacking"]
  --padding             padding between images in spritesheet                                                                                       [default: 0]
  --sort                Sort method: maxside (default), area, width or height                                                                       [string]  [default: "maxside"]
  --maxAtlases          maximum number of texture atlases that will be outputted                                                                    [default: 0]
  --gutter              the number of pixels to bleed the image edge, gutter is added to padding value                                              [default: 0]
  --group               allows you to specify a group of assets that must be included in the same atlas, make sure to use quotes around file paths  [default: []]
  --resizeWidth         resizes all source images to a specific width                                                                               [default: 0]
  --resizeHeight        resizes all source images to a specific height                                                                              [default: 0]
```

### Node.js

```javascript
var packer = require('gamefroot-texture-packer');

packer('assets/*.png', {format: 'kiwi'}, function (err) {
  if (err) throw err;

  console.log('spritesheet successfully generated');
});
```

## Installation

1. Install [ImageMagick](http://www.imagemagick.org/)
2. `npm install gamefroot-texture-packer -g`

## Test

    mocha test

--------------
This library is based on the foundation work of [Spritesheet.js](https://github.com/krzysztof-o/spritesheet.js)
