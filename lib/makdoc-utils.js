'use strict';

function init(gulp, makdoc){
    var _ = require('lodash');

    // Load plugins
    var path = require('path');

    var _PLUGIN_NAME="gulp-makdoc-utils"; // jshint ignore: line

    function highlight_highlightjs(){
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
    }

    function highlight_pygment(){
        var pygmentize = require('pygmentize-bundled-cached');

        return function(code, lang, done){
            pygmentize( { lang: lang, format: 'html' },
                        code,
                        function (err, result) {
                            done(err, result && result.toString());
                        }
            );
        };
    }

    function dest(dir){
        return makdoc.profile === 'dev'?
                makdoc.models.indexing():
                gulp.dest(dir);
    }

    return {
        highlight: highlight_pygment,
        highlight_pygment: highlight_pygment,
        highlight_highlightjs: highlight_highlightjs,
        dest: dest
    };

} // function init()

module.exports = init;
