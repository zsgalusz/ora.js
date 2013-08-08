var oraFile,
    layerList = document.getElementById('layers'),
    canvas = document.getElementById('image'),
    thumbHint = document.getElementById('thumbHint'),
    saveButton = document.getElementById('saveButton');

function enlargeThumb() {
    if(oraFile) {
        oraFile.drawComposite(this);
        thumbHint.style.display = 'none';
        canvas.removeEventListener(enlargeThumb);
    }
}

function renderOra(ora) {
    var layerItem,
        i = ora.layers.length;

    layerList.innerHTML = '';
    oraFile = ora;

    while(i) {
        layerItem = document.createElement('li');
        layerItem.innerHTML = oraFile.layers[i - 1].name || '<i>untitled layer</i>';
        layerList.appendChild(layerItem);
        i--;
    }

    oraFile.drawThumbnail(canvas);

    thumbHint.style.display = 'block';
    canvas.style.display = 'block';
    saveButton.disabled = false;

    canvas.addEventListener('click', enlargeThumb);
}

function inputChanged() {
    oraFile = undefined;
    saveButton.disabled = true;
    ora.load(fileInput.files[0], renderOra);
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