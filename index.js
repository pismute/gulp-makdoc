'use strict';

var _init_tasks = require('./lib/tasks');

var _makdoc = require('./lib/makdoc');

_makdoc.init = function(gulp, handlebars){
    _init_tasks(gulp, handlebars);
}

module.exports = _makdoc
