ora.scriptsPath = '../';
var blob, oraFile;
//ora.enableWorkers = false;

function loadFile(url, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.responseType = 'blob';
    oReq.onload = callback;
    oReq.send();
}

module('Creating new files');

test( 'Create ora object', function() {
    var oraFile = new ora.Ora(10, 11);
    ok( oraFile, 'Ora object created' );
    deepEqual(oraFile.width, 10, 'Image width matches');
    deepEqual(oraFile.height, 11, 'Image height matches');
    deepEqual(oraFile.layers.length, 0, 'Layers are empty');
});

test('Create layer object and test defaults', function() {
    var layer = new ora.OraLayer(1, 2, 'layer');

    ok(layer, 'Layer object created');
    deepEqual(layer.name, 'layer', 'Layer name');
    deepEqual(layer.width, 1, 'Layer width');
    deepEqual(layer.height, 2, 'Layer height');
    deepEqual(layer.x, 0, 'Layer X position');
    deepEqual(layer.y, 0, 'Layer Y position');
    deepEqual(layer.composite, 'svg:src-over', 'Layer composite mode');
    deepEqual(layer.opacity, 1, 'Layer opacity');
    deepEqual(layer.visibility, 'visible', 'Layer visibility');
});

test('Add a new layer to an ora object', function() {
    var oraFile = new ora.Ora(10, 11);
    var layer = oraFile.addLayer('layer');

    ok(oraFile.layers, 'Ora has layers');
    deepEqual(oraFile.layers.length, 1, 'Number of layers is 1');
    deepEqual(layer.name, 'layer', 'Layer name matches');
    deepEqual(layer.width, 10, 'Layer width matches');
    deepEqual(layer.height, 11, 'Layer height matches');
});

test('Add a new layer to an ora object with more layers', function() {
    var oraFile = new ora.Ora(10, 11);
    oraFile.addLayer();
    oraFile.addLayer();
    var layer = oraFile.addLayer('layer');

    deepEqual(oraFile.layers.length, 3, 'Number of layers is correct');
    deepEqual(oraFile.layers[2], layer, 'Layer is in the expected position');
});

test('Add a new layer to an ora object in a specific position', function() {
    var oraFile = new ora.Ora(10, 11);
    oraFile.addLayer();
    oraFile.addLayer();
    var layer = oraFile.addLayer('layer', 1);

    deepEqual(oraFile.layers.length, 3, 'Number of layers is correct');
    deepEqual(oraFile.layers[1], layer, 'Layer is in the expected position');
});

module('Testing file loading', {
    setup: function() {
        stop();
        loadFile('testdata/oratest.ora', function(oEvent) {
          blob = this.response;
          start();
        });
    },
    teardown: function() {
        blob = undefined;
    }
});

asyncTest('Load test ora file', 7, function() {
    ora.load(blob, function(oraFile) {
        ok(oraFile, 'Ora object created');
        start();
        deepEqual(oraFile.layers.length, 4, 'Expected number of layers found');
        equal(oraFile.width, 200, 'Width matches');
        equal(oraFile.layers[1].width, 159, 'Layer 1 has correct width');
        equal(oraFile.layers[2].opacity, 0.5, 'Layer 2 has correct opacity');
        equal(oraFile.layers[3].composite, 'svg:overlay', 'Layer 3 has correct composite');
        equal(oraFile.layers[3].y, 30, 'Layer 3 has correct position');
    });
});



module('Testing drawing', {
    setup: function() {
        stop();
        loadFile('testdata/oratest.ora', function(oEvent) {
          ora.load(this.response, function(orafile) {
            oraFile = orafile;
            start();
          });
        });
    },
    teardown: function() {
        oraFile = undefined;
    }
});

test('Drawing thumbnail', function() {
    var canvas = document.getElementById('test-canvas');
    oraFile.drawThumbnail(canvas);

    equal(canvas.width, 100, 'Thumbnail size as expected');
});

asyncTest('Drawing composite', 1, function() {
    var canvas = document.getElementById('test-canvas');
    oraFile.drawComposite(canvas, function() {
        start();
        equal(canvas.width, 200, 'Image size as expected');
    });

});

// TODO: test drawing layer modes...

module('Testing file saving');

asyncTest('Save empty ora to file', 1, function() {
    var oraFile = new ora.Ora(10,10);

    oraFile.save(function(blob) {
        ok(blob, 'Blob created');
        start();
    });
});

asyncTest('Save loaded test file', 1, function() {
    loadFile('testdata/oratest.ora', function(oEvent) {
        ora.load(this.response, function(oraFile) {
            oraFile.save(function(blob) {
                ok(blob, 'Blob created');
                start();
            });
        });
    });
});