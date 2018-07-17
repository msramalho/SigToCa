/**
 * Saves the profile picture
 * 
 * @param {<img>} img The img DOM element to download
 */
function savePic(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // save
    canvas.toBlob(function(blob) {
        saveAs(blob, "pic.jpeg");
    }, "image/jpeg", 1);
}

/**
 * Replaces the edit button hover the profile picture and adds a button to download the image
 * Both buttons are placed below the image frame
 */
function updateDOM() {
    // div that contains the profile picture and edit button
    var $divEl = $('#conteudoinner .estudante-foto');
    // the url to sigarra's editing page
    var editURL = $divEl.find('a').prop('href');

    // remove the edit button
    $divEl.children('div').remove('div .estudante-foto-editar');
    
    // create new DOM elements
    var $divContainer = $('<div class="btn-group" role="group" aria-label="Basic example"/>');
    var $editBtn = $('<button type="button" class="btn btn-outline-dark">Edit</button>');
    var $downloadBtn = $('<button type="button" class="btn btn-outline-dark">Save</button>');

    // add events for both both buttons
    $editBtn.click(function () {
        window.location.href = editURL;
    });

    $downloadBtn.click(function () {
        var $imgEl = $('#conteudoinner .estudante-foto').children('img');
        savePic($imgEl[0]); // [0] converts from jquery object to DOM element
    });

    // start appending
    $divEl.append(
        $divContainer.append($editBtn).append($downloadBtn));
}

$(document).ready(function () {
    updateDOM();
});