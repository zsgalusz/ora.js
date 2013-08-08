ora.js
====

A JavaScript library to open and view OpenRaster images.

Features
---
 * Thumbnail
 * Pre-rendered image is used if present
 * Layers
 * Layer blending modes

Install
---
Just copy ora.js and the included dependencies to your scripts folder. If you want layer blending modes, copy ora-blending.js too.

In your HTML file, include the libraries:

```
    <script type="text/javascript" src="zip.js"></script>
    <script type="text/javascript" src="zip-fs.js"></script>
    <script type="text/javascript" src="ora.js"></script>
    <script type="text/javascript" src="ora-blending.js"></script>

```

Note that you might need extra configuration for zip.js to find its own scripts:

```
    <script type="text/javascript">
        zip.workerScriptsPath = "resources/";
    </script>
```

Usage
---
Pass the .ora file to ora.load(), and use drawThumbnail() or drawComposite() to draw the image into a canvas element.
```
ora.load(fileInput.files[0], function(oraFile) {
    oraFile.drawThumbnail(thumbCanvas);               
    oraFile.drawComposite(imageCanvas);
});
```

Dependencies
---
The project is using a slightly modified version the [zip.js](http://gildas-lormeau.github.io/zip.js/) library.
