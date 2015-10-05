
var PAGE_W = 8.5;
var PAGE_H = 11;
var STICKER_SIZE = 3 / 4;
var CIRCLE_MARGIN = 1 / 16;
var CIRCLE_BLEED = CIRCLE_MARGIN / 2;
var CIRCLE_SQUARE = (STICKER_SIZE) + (CIRCLE_BLEED * 2);
var LEFT_MARGIN = 0.6206 - CIRCLE_BLEED;
var TOP_MARGIN = 0.6514 - CIRCLE_BLEED;
var X_DIST = 13/16;
var Y_DIST = 0.69;

// POLYFILL

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    var T, k;
    if (this == null) throw new TypeError(' this is null or not defined');
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") throw new TypeError(callback + ' is not a function');
    if (arguments.length > 1) T = thisArg;
    k = 0;
    while (k < len) {
      var kValue;
      if (k in O) { kValue = O[k]; callback.call(T, kValue, k, O);}
      k++;
    }
  };
}

// EXECUTE ------------------------------------------------------

// Save the current preferences
var startRulerUnits = app.preferences.rulerUnits;

// Set Adobe Photoshop CS5 to use pixels and display no dialogs
app.preferences.rulerUnits = Units.INCHES;

//Close all the open documents
while (app.documents.length) {
  app.activeDocument.close()
}

// Prompt User to select a file
alert('Select a file to be split into stickers');
var files = app.openDialog();

// Check that they picked one file
if (files.length !== 1) {
  alert('Sorry, you need exactly one file');  
} else if (files[0] instanceof File) {
  // SETUP
  var SOURCE = open(files[0]);
  var STICKERS = createStickersDoc(SOURCE.name);
  flatten(SOURCE);
  processImage(SOURCE, STICKERS);  
  SOURCE.close(SaveOptions.DONOTSAVECHANGES);
}

// Reset the application preferences
app.preferences.rulerUnits = startRulerUnits;

// FUNCTIONALITY --------------------------------------------------

function createStickersDoc(baseName) {
  return app.documents.add(PAGE_W, PAGE_H, SOURCE.resolution, baseName + "_stickers", NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1);
}

function flatten(Doc) {
  app.activeDocument = Doc;
  Doc.flatten();
}

function getSelect(Doc, box) {
  var res = Doc.resolution;
  var top = box[0][0] * res;
  var bottom = box[1][0] * res;
  var left = box[0][1] * res;
  var right = box[1][1] * res;

  // Select a square
  return Array(Array(top, left),
               Array(top, right),
               Array(bottom, right),
               Array(bottom, left),
               Array(top, left));
}

function copyFrom(Doc, box) {
  app.activeDocument = Doc;
  Doc.selection.select(getSelect(Doc, box));
  Doc.selection.copy();
}

function pasteInto(Doc, box) {
  app.activeDocument = Doc;
  Doc.selection.select(getSelect(Doc, box));
  var layer = Doc.paste(true);
  layer.merge();
}

function addLayer(Doc, layerName) {
  app.activeDocument = Doc;
  var layer = Doc.artLayers.add();
  if (layerName) layer.name = layerName;
  return layer;
}

function processImage(SOURCE, STICKERS) {
  var points = getPoints(
    parseFloat(SOURCE.width),
    parseFloat(SOURCE.height)
  );
  
  var pages = getPages(9, 12, points);

  alert('Making ' + pages.length + ' page layers');
  alert('The grid is ' + points[0].length + ' stickers wide');
  alert('The grid is ' + points.length + ' stickers tall');

  // copyFrom(SOURCE, getSrcSquare(pages[0][0][0]));
  // pasteInto(STICKERS, getPrintSquare(0, 0));

  // copyFrom(SOURCE, getSrcSquare(pages[0][0][1]));
  // pasteInto(STICKERS, getPrintSquare(1, 0));

  app.activeDocument = STICKERS;
  var rootLayer = STICKERS.activeLayer.name;

  pages.forEach(function (page, pageNumber) {
    addLayer(STICKERS, 'page-' + pageNumber);
    page.forEach(function(row, pageY) {
      row.forEach(function (sticker, pageX) {
        var srcBox = getSrcSquare(sticker);
        var targetBox = getPrintSquare(pageX, pageY);
        copyFrom(SOURCE, srcBox);
        pasteInto(STICKERS, targetBox);
      });
    });
  });

  app.activeDocument = STICKERS;
  STICKERS.artLayers.getByName(rootLayer).remove();

  

  // pages[1].forEach(function(row, pageY) {
  //   row.forEach(function (sticker, pageX) {
  //     var srcBox = getSrcSquare(sticker);
  //     var targetBox = getPrintSquare(pageX, pageY);
  //     copyFrom(SOURCE, srcBox);
  //     pasteInto(STICKERS, targetBox);
  //   });
  // });
}

// LOGIC -----------------------------------------------------

function getSrcSquare(point) {
  var r = CIRCLE_SQUARE / 2;
  var s = r * 2;
  var cX = point[0];
  var cY = point[1];
  // topLeft, bottomRight
  return [
    [cX - r, cY - r],
    [cX + r, cY + r]
  ];
}

function getPrintSquare(x, y) {
  var topLeft = [
    x * CIRCLE_SQUARE + LEFT_MARGIN,
    y * CIRCLE_SQUARE + TOP_MARGIN
  ];
  return [topLeft, [
    topLeft[0] + CIRCLE_SQUARE,
    topLeft[1] + CIRCLE_SQUARE
  ]];
}

function getPoints(w, h) {
  var rows = [];
  var BUFFER = STICKER_SIZE / 2;
  var y = BUFFER;
  while(y <= h - BUFFER) {
    var columns = [];
    var x = y % 2 ? 0 : (X_DIST / 2) + 1/16;
    x = x + BUFFER;
    while(x <= w - BUFFER) {
      columns.push([x,y]);
      x += X_DIST;
    }
    rows.push(columns);
    y += Y_DIST;
  }
  return rows;
}

function makePage(w, h) {
  var quant = w * h;
  var idx = 0;
  var page = [];
  return function addPoint(point) {
    if (idx >= quant) return page;
    var y = Math.floor(idx / w);
    var x = idx % w;
    if (!page[y]) page[y] = [];
    page[y][x] = point;
    idx += 1;
  }
}

function getPages(columns, rows, grid) {
  var pages = [];
  var addPoint = makePage(columns, rows);

  grid.forEach(function (column) {
    column.forEach(function (point) {
      var page = addPoint(point);
      if (page) {
        pages.push(page);
        addPoint = makePage(columns, rows);
      }
    });
  });

  return pages;
}




