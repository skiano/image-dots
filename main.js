
// PRINT

var STICKER_SIZE = 3 / 4;
var CIRCLE_MARGIN = 1 / 16;
var CIRCLE_BLEED = CIRCLE_MARGIN / 2;
var CIRCLE_SQUARE = (STICKER_SIZE) + (CIRCLE_BLEED * 2);
var LEFT_MARGIN = 0.6206 - CIRCLE_BLEED;
var TOP_MARGIN = 0.6514 - CIRCLE_BLEED;

// DESIGN

var X_DIST = 13/16;
var Y_DIST = 0.69;
var IMG_H = 72;
var IMG_W = 48;

var points = getPoints(IMG_W, IMG_H);
var pages = getPages(9, 12, points);
var instructions = getInstructions(pages);

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

function getPrintLocation(x, y) {
  return [
    x * CIRCLE_SQUARE + LEFT_MARGIN,
    y * CIRCLE_SQUARE + TOP_MARGIN
  ];
}

function getPoints(w, h) {
  var rows = [];
  var y = STICKER_SIZE / 2;
  while(y <= h) {
    var columns = [];
    var x = y % 2 ? 0 : (X_DIST / 2) + 1/16;
    while(x <= w) {
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

function getInstructions(pages) {
  pages.forEach(function (page, pageNumber) {
    pages[0].forEach(function(row, pageY) {
      row.forEach(function (sticker, pageX) {
        var topLeft = getSrcSquare(sticker)[0];
        var loc = getPrintLocation(pageX, pageY);
        console.log('Print (%s, %s) at (%s, %s)', topLeft[0].toFixed(2), topLeft[1].toFixed(2), loc[0].toFixed(2), loc[1].toFixed(2));    
      });
    });
  });
}

