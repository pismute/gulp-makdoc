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

    makdoc.templates =
            require('./makdoc-templates.js')(gulp, handlebars, makdoc);

    makdoc.models =
            require('./makdoc-models.js')(gulp, handlebars, makdoc);

    makdoc.markdown =
            require('./makdoc-markdown.js')(gulp, makdoc);

    makdoc.asciidoc =
            require('./makdoc-asciidoc.js')(gulp, makdoc);

    makdoc.pipelines =
            require('./makdoc-pipelines.js')(gulp, handlebars, makdoc);

    makdoc.util = {};

    makdoc.util.highlight_highlightjs = function (){
        var hljs = require('highlight.js');
        var langDict = hljs.listLanguages()
            .reduce(function(dict, lang){
                dict[lang] = true;
                return dict;
            }, {});

        return function(code, lang, done){
            var rendered = null;

            if( lang && langDict[lang] ) {
                rendered = hljs.highlight(lang, code).value;
            }else{
                rendered = hljs.highlightAuto(code).value;
            }

            done(null, rendered);
        };
    };

    makdoc.util.highlight_pygment = function (){
        var pygmentize = require('pygmentize-bundled-cached');

        return function(code, lang, done){
            pygmentize( { lang: lang, format: 'html' },
                        code,
                        function (err, result) {
                            done(err, result && result.toString());
                        }
            );
        };
    };

    makdoc.util.highlight_nothing = function (){
        return function(code, lang, done){
            done(null, code);
        };
    };

    makdoc.util.highlight = makdoc.util.highlight_highlightjs;

    return makdoc;
} // function init()

module.exports = init;
