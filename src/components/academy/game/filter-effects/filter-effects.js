import * as PIXI from 'pixi.js'
import * as Filters from 'pixi-filters'

var Constants = require('../constants/constants.js');
var Utils = require('../utils/utils.js');

var darkFilter = new PIXI.filters.ColorMatrixFilter();
darkFilter.brightness(0.6);

function createTexture(displayObject, filters, width, height) {
  var texture = PIXI.RenderTexture.create(width, height);
  displayObject.filters = filters;
  Utils.getRenderer().render(displayObject, texture);
  return texture;
}

function createFilteredTexture(texture, filters) {
  var sprite = new PIXI.Sprite(texture);
  return createTexture(sprite, filters, texture.width, texture.height);
}

export function createGlowTexture(displayObject) {
  var width = displayObject.width + 2 * Constants.glowDistance;
  var height = displayObject.height + 2 * Constants.glowDistance;
  displayObject.position.x = width / 2;
  displayObject.position.y = height / 2;
  var container = new PIXI.Container();
  container.addChild(displayObject);
  var glowFilter = new Filters.GlowFilter(
    Constants.glowDistance,
    2.5,
    0,
    0xfffbd6,
    0.5
  );
  glowFilter.padding = Constants.glowDistance;
  return createTexture(container, [glowFilter], width, height);
}

export function createDarkenedTexture(texture) {
  return createFilteredTexture(texture, [darkFilter]);
}
