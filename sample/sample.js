var oraFile,
    layerList = document.getElementById('layers'),
    canvas = document.getElementById('image'),
    thumbHint = document.getElementById('thumbHint');

function enlargeThumb() {
    if(oraFile) {
        oraFile.drawComposite(this);
        thumbHint.style.display = "none";
        canvas.removeEventListener(enlargeThumb);
    }
}

function renderOra(ora) {
    var layerItem, i;

    layerList.innerHTML = "";
    oraFile = ora;

    for(i = 0; i < oraFile.layerCount; i++) {
        layerItem = document.createElement('li');
        layerItem.innerHTML = oraFile.layers[i].name || "<i>untitled layer</i>";
        layerList.appendChild(layerItem);
    }

    oraFile.drawThumbnail(canvas);

    thumbHint.style.display = "block";
    canvas.style.display = "block";

    canvas.addEventListener('click', enlargeThumb);
}

function inputChanged() {
    oraFile = undefined;
    ora.load(fileInput.files[0], renderOra);
}
