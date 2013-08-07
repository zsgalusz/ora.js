(function (obj) {
    'use strict';

    // Extract an image from the ora into an Image object
    function extractImage(path, zipfs, ondone, onerror) {
        var imgEntry = zipfs.find(path);
        if (imgEntry) {
            imgEntry.getData64URI('image/png', function (uri) {
                var imageObj = new Image();
                imageObj.onload = ondone;
                imageObj.src = uri;
            });
        } else if (onerror) {
            onerror();
        }
    }

    // Layer object constructor.
    function Layer(layerElement, zipfs, onload) {
        var that = this;

        this.name = layerElement.getAttribute('name');
        this.x = layerElement.getAttribute('x');
        this.y = layerElement.getAttribute('y');
        this.composite = layerElement.getAttribute('composite-op');
        this.opacity = layerElement.getAttribute('opacity');
        this.visibility = layerElement.getAttribute('visibility');

        extractImage(layerElement.getAttribute('src'), zipfs, function() {
            that.image = this;
            that.width = this.width;
            that.height = this.height;

            onload();
        });
    }

    // Get the raw pixel data array for the layer
    Layer.prototype.getImageData = function (width, height) {
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = width;
        tmpCanvas.height = height;
        var tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.drawImage(this.image, this.x, this.y);
        return tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;
    };

    // OraFile constructor
    function OraFile() {
        this.width = 0;
        this.height = 0;
        this.layers = [];
        this.layerCount = 0;
    }

    // Load the file contents from a blob
    // Based on the draft specification from May 2013
    // http://www.freedesktop.org/wiki/Specifications/OpenRaster/Draft/
    OraFile.prototype.load = function (blob, onload) {
        var fs = new zip.fs.FS();
        var that = this;

        function loadLayers(image, ondone) {
            var layersLoaded = 0,
               layerElems = image.getElementsByTagName('stack')[0].getElementsByTagName('layer');

            that.layerCount = layerElems.length; //$layers.length;
            that.layers = [];

            var addLayer = function() {
                layersLoaded++;
                if (layersLoaded === that.layerCount) {
                    ondone();
                }
            };

            for (var i = 0; i < that.layerCount; i++) {
                var layer = new Layer(layerElems[i], fs, addLayer);

                that.layers.push(layer);
            }
        }

        function loadStack(ondone) {
            var stackFile = fs.find('stack.xml');
            stackFile.getText(function (text) {
                var xml;
                // http://stackoverflow.com/questions/649614/xml-parsing-of-a-variable-string-in-javascript
                var parseXml;

                if (window.DOMParser) {
                    xml = ( new window.DOMParser() ).parseFromString(text, "text/xml");
                } else {
                    xml = new window.ActiveXObject("Microsoft.XMLDOM");
                    xml.async = false;
                    xml.loadXML(text);
                }
                
                var img = xml.getElementsByTagName('image')[0];
                that.width = img.getAttribute('w');
                that.height = img.getAttribute('h');

                loadLayers(img, ondone);
            });
        }

        function loadOra() {
            // keeping track of finished loading tasks
            var stepsDone = 0, steps = 3;
            var onDone = function () {
                stepsDone++;
                if (stepsDone === steps) {
                    onload();
                }
            };

            extractImage('Thumbnails/thumbnail.png', fs, function() {
                that.thumbnail = this;
                onDone();
            }, onDone);

            extractImage('mergedimage.png', fs, function() {
                that.prerendered = this;
                onDone();
            }, onDone);

            loadStack(onDone);
        }

        fs.importBlob(blob, loadOra);
    };

    // Draw the thumbnail into a canvas element
    OraFile.prototype.drawThumbnail = function (canvas) {
        if (this.thumbnail) {
            canvas.width = this.thumbnail.width;
            canvas.height = this.thumbnail.height;
            var context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(this.thumbnail, 0, 0);
        }
    };

    // Draw the full size composite image from the layer data.
    // Uses the prerendered image if present and enabled
    OraFile.prototype.drawComposite = function (canvas) {
        canvas.width = this.width;
        canvas.height = this.height;
        var layerIdx = this.layerCount,
            context = canvas.getContext('2d'),
            layer, imgData;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if(obj.ora.enablePrerendered && this.prerendered) {
            context.drawImage(this.prerendered, 0, 0);
            return;
        }

        if (obj.ora.blending) {
            imgData = context.getImageData(0, 0, this.width, this.height);

            while (layerIdx) {
                layer = this.layers[layerIdx - 1];

                if (layer && layer.image && (layer.visibility === 'visible' || layer.visibility === undefined)) {
                    var filter = obj.ora.blending[layer.composite] || obj.ora.blending.normal;
                    var src = layer.getImageData(this.width, this.height);
                    obj.ora.blending.blend(src, imgData.data, layer.opacity, filter);
                }

                layerIdx--;
            }

            context.putImageData(imgData, 0, 0);
        } else {
            while (layerIdx) {
                layer = this.layers[layerIdx - 1];
                if (layer && layer.image && (layer.visibility === 'visible' || layer.visibility === undefined)) {
                    if (layer.opacity === undefined) {
                        context.globalAlpha = 1;
                    } else {
                        context.globalAlpha = layer.opacity;
                    }

                    context.drawImage(layer.image, layer.x, layer.y);
                }

                layerIdx--;
            }
        }
    };

    // Create and populate an OraFile object from a blob
    // onload - callback with the loaded object as parameter
    function loadFile(blob, onload) {
        var oraFile = new OraFile();
        oraFile.load(blob, function() {
            onload(oraFile);
        });
    }

    obj.ora = {
        load: loadFile,

        // enable use of prerendered image instead of layers (if present)
        enablePrerendered : true
    };
})(this);