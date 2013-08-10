var oraFile,
    layerList = document.getElementById('layers'),
    canvas = document.getElementById('image'),
    selectedLayer = -1,
    loadedComposite = false;

function enableEditing() {
    document.getElementById('saveButton').disabled = false;
    document.getElementById('addLayer').disabled = false;
    document.getElementById('delLayer').disabled = false;
    document.getElementById('visibleToggle').disabled = false;
    document.getElementById('opacity').disabled = false;
    document.getElementById('layerMode').disabled = false;
    layerList.style.display = "block";
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
    layerList.style.display = "none";
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
    if(oraFile) {
        oraFile.drawComposite(canvas);
        loadedComposite = true;
    }
}

function onLoadComplete(loadedOra) {
    function enlargeThumb() {
        oraFile.drawComposite(this);
        document.getElementById('thumbHint').style.display = 'none';
        enableEditing();
        canvas.removeEventListener(enlargeThumb);
    }

    oraFile = loadedOra;

    renderLayers();
    oraFile.drawThumbnail(canvas);

    document.getElementById('thumbHint').style.display = 'block';
    canvas.addEventListener('click', enlargeThumb);
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
    enableEditing();
}

function saveFile() {
    if(oraFile) {
        oraFile.save(function(blob) {
             if(window.saveAs) {
                window.saveAs(blob, 'orafile.ora');
             } else {
                var uri = URL.createObjectURL(blob);
                window.open(uri, '_blank');
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
    var event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });

    document.getElementById('fileInput').dispatchEvent(event);
}

function pickLayer() {
    var event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });

    document.getElementById('layerFile').dispatchEvent(event);
}