function overrideEditBtn() {
    // div that contains the profile picture and edit button
    var $divEl = $('#conteudoinner .estudante-foto');
    var $imgURL = $divEl.children('img').prop('src');
    var $editURL = $divEl.find('a').prop('href');

    // remove the edit button
    $divEl.children('div').remove('div .estudante-foto-editar');

    // add two buttons (edit and download)
    $divEl.add('div').addClass('btn-group').prop('role', 'group');
    
    // create new DOM elements
    var $divContainer = $('<div class="btn-group" role="group" aria-label="Basic example"/>');
    var $editBtn = $('<button type="button" class="btn btn-outline-dark">Edit</button>');
    var $downloadBtn = $('<button type="button" class="btn btn-outline-dark">Save</button>');

    // add events for both both buttons

    // start appending
    $divEl.append(
        $divContainer.append($editBtn).append($downloadBtn));
}

$(document).ready(function () {
    overrideEditBtn();
});