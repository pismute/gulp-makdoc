'use strict';

function init(gulp, handlebars){
    var _ = require('lodash');

    // Load plugins
    var path = require('path');

    var _PLUGIN_NAME="gulp-makdoc"; // jshint ignore: line
    var _BASENAME_PATTERN = /([\s\S]+?)\./i;

    var makdoc = {
        _templateData: {
            docs: [] //sorted _docs
        },
        _docs: {}, //raw data
        _layouts: {}
    };

    makdoc.templateData = function(data){
        if(data) {
            _.assign(makdoc._templateData, data);
        } else {
            return makdoc._templateData;
        }
    };

    makdoc.basename =  function(p) {
        return _BASENAME_PATTERN.exec(path.basename(p))[1];
    };

    makdoc.utils =
            require('./makdoc-utils.js')(gulp, makdoc);

    makdoc.templates =
            require('./makdoc-templates.js')(gulp, handlebars, makdoc);

    makdoc.models =
            require('./makdoc-models.js')(gulp, makdoc);

    makdoc.markdown =
            require('./makdoc-markdown.js')(gulp, makdoc);

    makdoc.asciidoc =
            require('./makdoc-asciidoc.js')(gulp, makdoc);

    makdoc.pipelines =
            require('./makdoc-pipelines.js')(gulp, makdoc);

    return makdoc;
} // function init()

module.exports = init;
