'use strict';

function init(gulp, handlebars){
    var _ = require('lodash');

    // Load plugins
    var $ = require('gulp-load-plugins')();
    var through = require('through2');
    var path = require('path');

    var _PLUGIN_NAME="gulp-makdoc";
    var _BASENAME_PATTERN = /([\s\S]+?)\./i;

    var makdoc = {
        _templateData: {
            docs: [] //sorted _docs
        },
        _docs: {}, //raw data
        _layouts: {}
    };

    makdoc.templateData = function(data){
    _.assign(makdoc._templateData, data);
    };

    makdoc.basename =  function(p) {
        return _BASENAME_PATTERN.exec(path.basename(p))[1];
    };

    makdoc.decorate = function(opts) {
        opts = opts || {};

        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            if(file.model.layout){
                var model = _.assign({
                    contents:file.contents.toString()
                }, makdoc._templateData, file.model);

                var layouts = makdoc._layouts;

                var history = {};
                var n = 0;
                var walk = function (layout){
                    if(history[layout]) {
                        var layouts = Object.keys(history);
                        layouts.push(layout);

                        $.util.log('cycle layout detected!!:' +
                            file.path + '::' + layouts);
                        return false;
                    }else{
                        history[layout] = n++;
                        return true;
                    }
                };

                // apply layout
                var decorate = function(name, model){
                    if(!layouts[name]) {
                        return model;
                    } else {
                        var layout = layouts[ name ];

                        model.contents = layout.template(model);

                        return ( layout.layout && walk(layout.layout))?
                                decorate(layout.layout, model) : model;
                    }
                };

                decorate(model.layout, model );

                file.contents = new Buffer(model.contents);
            }

            done(null, file);
        });
    };

    makdoc.templates = require('./makdoc-templates.js')(gulp, handlebars, makdoc);

    makdoc.models = require('./makdoc-models.js')(gulp, handlebars, makdoc);

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
