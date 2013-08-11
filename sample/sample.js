var oraFile,
    layerList = document.getElementById('layers'),
    canvas = document.getElementById('image'),
    backCanvas = document.createElement('canvas'),
    progress = document.getElementById('progressBar'),
    selectedLayer = -1,
    redrawInProgress = false,
    redrawRequested = false;

function enableEditing() {
    document.getElementById('saveButton').disabled = false;
    document.getElementById('addLayer').disabled = false;
    document.getElementById('delLayer').disabled = false;
    document.getElementById('visibleToggle').disabled = false;
    document.getElementById('opacity').disabled = false;
    document.getElementById('layerMode').disabled = false;
    document.getElementById('upLayer').disabled = false;
    document.getElementById('downLayer').disabled = false;
}

function disableEditing() {
    document.getElementById('saveButton').disabled = true;
    document.getElementById('addLayer').disabled = true;
    document.getElementById('delLayer').disabled = true;
    document.getElementById('visibleToggle').disabled = true;
    document.getElementById('opacity').disabled = true;
    document.getElementById('layerMode').disabled = true;
    document.getElementById('upLayer').disabled = true;
    document.getElementById('downLayer').disabled = true;
    selectedLayer = undefined;
}

function renderLayers(keepSelection) {
    layerList.innerHTML = '';

    if(oraFile) {
        var i = oraFile.layers.length,
            layerItem;

        layerList.size = i;

        while(i) {
            layerItem = document.createElement('li');
            layerItem.innerHTML = oraFile.layers[i - 1].name || '<i>untitled layer</i>';
            layerItem.onclick = selectLayer.bind(undefined, i - 1);
            if(oraFile.layers[i - 1].visibility == 'hidden') {
                layerItem.className = 'hidden';
            }

            layerList.appendChild(layerItem);
            i--;
        }

        if(!keepSelection) {
            selectedLayer = -1;
        }
        else {
            selectLayer(selectedLayer);
        }
    }
}

function selectLayer(index) {
    var layer = layerList.childNodes[layerList.size - selectedLayer - 1];
    if(selectedLayer >= 0) {
        layer.className = layer.className.replace('selected', '').trim();
    }

    selectedLayer = index;
    layer = layerList.childNodes[layerList.size - selectedLayer - 1];
    document.getElementById('opacity').value = oraFile.layers[selectedLayer].opacity * 100;
    document.getElementById('layerMode').value = oraFile.layers[selectedLayer].composite;
    layer.className += ' selected';
}

function drawComposite() {
    if(!oraFile) {
        return;
    }

    if(redrawInProgress || redrawRequested) {
        redrawRequested = true;
        return;
    }

    redrawInProgress = true;
    progress.style.display = 'block';
    canvas.style.opacity = 0.3;

    oraFile.drawComposite(backCanvas, function() {
        redrawInProgress = false;

        if(!redrawRequested) {
            canvas.width = backCanvas.width;
            canvas.height = backCanvas.height;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(backCanvas, 0, 0);
            progress.style.display = 'none';
            canvas.style.opacity = 1;
            enableEditing();
        }
        else {
            redrawRequested = false;
            drawComposite();
        }
    });
}

function onLoadComplete(loadedOra) {
    oraFile = loadedOra;

    renderLayers();
    oraFile.drawThumbnail(document.getElementById('thumbnail'));
    drawComposite();
}

function loadFile() {
    oraFile = undefined;
    disableEditing();
    ora.load(document.getElementById('fileInput').files[0], onLoadComplete);
}

function createFile() {
    canvas.width = document.getElementById('newWidth').value;
    canvas.height = document.getElementById('newHeight').value;

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    oraFile = new ora.Ora(canvas.width, canvas.height);
    renderLayers();
    oraFile.drawThumbnail(thumbnail);
    drawComposite();
    enableEditing();
}

function saveFile() {
    if(oraFile) {
        var filename = 'orafile.ora';
        oraFile.save(function(blob) {
             if(window.saveAs) {
                window.saveAs(blob, filename);
             } else {
                var uri = URL.createObjectURL(blob);
                //window.open(uri, '_blank');

                var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                xhr.onload = function() {
                    var a = document.createElement('a');
                    a.href = window.URL.createObjectURL(xhr.response); // xhr.response is a blob    
                    a.download = filename; // Set the file name.    
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    delete a;
                };
                xhr.open('GET', uri);
                xhr.send();
            }
        });
    }
}

function addLayer() {
    if(oraFile) {
        var layer = oraFile.addLayer('layer ' + oraFile.layers.length);

        var tmpImage = new Image();
        var uri = URL.createObjectURL(document.getElementById('layerFile').files[0]);
        tmpImage.src = uri;
        tmpImage.onload = function() {
            layer.image = this;
            layer.width = this.width;
            layer.height = this.height;

            selectedLayer = oraFile.layers.length - 1;

            renderLayers(true);
            drawComposite();
        };
    }
}

function deleteLayer() {
    if(oraFile && selectedLayer >= 0) {
        oraFile.layers.splice(selectedLayer, 1);

        renderLayers();
        drawComposite();
    }
}

function upLayer() {
    if(selectedLayer >= 0 && selectedLayer < oraFile.layers.length - 1) {
        var tmp = oraFile.layers[selectedLayer + 1];
        oraFile.layers[selectedLayer + 1] = oraFile.layers[selectedLayer];
        oraFile.layers[selectedLayer] = tmp;

        selectedLayer += 1;

        renderLayers(true);
        drawComposite();
    }
}

function downLayer() {
    if(selectedLayer > 0) {
        var tmp = oraFile.layers[selectedLayer - 1];
        oraFile.layers[selectedLayer - 1] = oraFile.layers[selectedLayer];
        oraFile.layers[selectedLayer] = tmp;

        selectedLayer -= 1;

        renderLayers(true);
        drawComposite();
    }
}

function setOpacity() {
    oraFile.layers[selectedLayer].opacity = document.getElementById('opacity').value / 100;
    drawComposite();
}

function setLayerMode() {
    oraFile.layers[selectedLayer].composite = document.getElementById('layerMode').value;
    drawComposite();
}

function toggleLayer() {
    if (oraFile.layers[selectedLayer].visibility == 'visible') {
        oraFile.layers[selectedLayer].visibility = 'hidden';
    }
    else {
        oraFile.layers[selectedLayer].visibility = 'visible';
    }

    renderLayers(true);
    drawComposite();
}

function pickOra() {
    document.getElementById('fileInput').click();
}

function pickLayer() {
    document.getElementById('layerFile').click();
}