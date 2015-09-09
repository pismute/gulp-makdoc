'use strict';

function init(gulp, handlebars){
    var makdoc = require('./lib/makdoc')(gulp, handlebars);

    require('./lib/tasks')(gulp, handlebars, makdoc);

    return makdoc;
}

module.exports = init
