'use strict';

var _ = require('lodash');

// Load plugins
var $ = require('gulp-load-plugins')();
var through = require('through2');
var path = require('path');
var fs = require('fs');

var PLUGIN_NAME="gulp-makdoc";

var makdoc = {
    _templateData: {
        docs: [] //sorted _docs
    },
    _docs: {}, //raw data
    _layouts: {},
    model: {}, // namespace for model plugins.
};

var path = require('path');

makdoc.templateData = function(data){
   _.assign(makdoc._templateData, data);
};

var BASENAME_PATTERN = /([\s\S]+?)\./i;

makdoc.basename =  function(p) {
    return BASENAME_PATTERN.exec(path.basename(p))[1];
};

makdoc.decorate = function(opts) {
    opts = opts || {};

    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
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

                    $.util.log('cycle layout detected!!:' + file.path + '::' + layouts);
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

makdoc.model.init = function(base) {
    base = base || {};

    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        file.model = _.extend({}, base);

        done(null, file);
    });
};

makdoc.model.loadFileModel = function(skip) {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return done();
        }

        var modelPath = file.path + ".json";
        var m = file.model;

        fs.exists(modelPath, function (exists) {
            if(exists) {
                _.extend(m, require(modelPath));

                m.date = _.isString(m.date)? new Date(m.date): m.date;
            }

            if(exists || !skip) {
                done(null, file);
            }else{
                done();
            }

        });
    });
};

makdoc.model.url = function() {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return done();
        }

        var m = file.model;

        var uri = file.relative;
        m.uri = path.join('/', uri);
        m.url = makdoc.vars.BASE_URL() + uri;

        done(null, file);
    });
};

makdoc.model.addToDocs = function() {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        //collect models for templates
        makdoc._docs[file.path] = file.model;

        done(null, file);
    });
};

var STRIP_MARKUP_PATTERN = /(<([^>]+)>)/g;

var _stripMarkup = function(html) {
   return html.trim().replace(STRIP_MARKUP_PATTERN, '');
};

var _strip3Lines = function(html) {
    var THREE_LINE_PATTERN = /([\s\S]*?).*\n/g;

    var first = THREE_LINE_PATTERN.exec(html);
    var second = THREE_LINE_PATTERN.exec(html);
    var third = THREE_LINE_PATTERN.exec(html);

    return [
            first && _stripMarkup(first[0]),
            second && _stripMarkup(second[0]),
            third && _stripMarkup(third[0])
    ];
};

var _getLine = function(lines, n){
    return Array.isArray(lines) && lines.length > n? lines[n]: undefined;
};

var _isEmptyTitle = function(t){
    return _.isEmpty(t) || t === 'untitled';
};

makdoc.model.seo = function() {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        var m = file.model;
        var contents = file.contents.toString();

        //all documements must have title, description
        if( _isEmptyTitle(m.title) || _.isEmpty(m.description) ) {
            var lines = _strip3Lines(contents);

            if(_isEmptyTitle(m.title)){
                m.title = _getLine(lines, 0) || '';
            }

            if(_.isEmpty(m.description)){
                m.description = _getLine(lines, 2) || '';
            }
        }

        done(null, file);
    });
};

makdoc.model.contents = function() {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return done();
        }

        //save contents before which are layouted
        file.model.contentsWithoutLayouts = file.contents.toString();

        done(null, file);
    });
};

makdoc.util = {};

makdoc.util.highlight = function(){
    var highlight = false;
    var logError = function(e){
        if( e.code !== 'MODULE_NOT_FOUND') {
            $.util.log(e);
        }
    };


    if(!highlight){
        try{
            var hljs = require('highlight.js');
            var langDict = hljs.listLanguages()
                .reduce(function(dict, lang){
                    dict[lang] = true;
                    return dict;
                }, {});

            highlight = function(code, lang, done){
                var rendered = null;

                if( lang && langDict[lang] ) {
                    rendered = hljs.highlight(lang, code).value;
                }else{
                    rendered = hljs.highlightAuto(code).value;
                }

                done(null, rendered);
            };
        }catch(e){ logError(e); }
    }

    if(!highlight){
        try{
            var pygmentize = require('pygmentize-bundled');

            highlight = function(code, lang, done){
                pygmentize( { lang: lang, format: 'html' },
                            code,
                            function (err, result) {
                                done(err, result && result.toString());
                            }
                );
            };
        }catch(e){ logError(e); }
    }

    return highlight;
};

module.exports = makdoc;
