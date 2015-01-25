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

            // apply layout
            var decorate = function(name, model){
                if(!layouts[name]) {
                    return model;
                } else {
                    var layout = layouts[ name ];

                    model.contents = layout.template(model);

                    return ( layout.layout ) ? decorate(layout.layout, model) : model;
                }
            };

            decorate(model.layout, model );

            file.contents = new Buffer(model.contents);
        }

        done(null, file);
    });
};

makdoc.model.has = function(){
    return through.obj(function(file, enc, done){
        var modelPath = file.path + ".json";

        fs.exists(modelPath, function (exists) {
            if(exists) {
                done(null, file);
            }else{
                done();
            }
        });
    });
};

makdoc.model.load = function(map) {
    map = map || function(m, file){
        file = file;
        return m;
    };

    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return done();
        }

        var modelPath = file.path + ".json";

        fs.exists(modelPath, function (exists) {
            if(exists) {
                file.model = map(require(modelPath), file);
            }else{
                file.model = map({}, file);
            }

            done(null, file);
        });
    });
};

makdoc.model.injectUrl = function() {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return done();
        }

        var uri = file.relative;
        var m = file.model;

        m.uri = path.join('/', uri);
        m.url = makdoc.vars.BASE_URL() + uri;

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

makdoc.model.injectDocsCommon = function() {
    return through.obj(function(file, enc, done){
        if (file.isNull()) {
            return done(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new $.util.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return done();
        }

        var m = file.model;

        //save contents before which are layouted
        m.contents = m.contentsWithoutLayouts = file.contents.toString();

        //all documements must have title, description
        if( !m.title || !m.description ) {
            var lines = _strip3Lines(m.contentsWithoutLayouts);

            m.title = m.title || lines[0];

            //for meta[name=description]
            m.description = m.description ||
                    (lines[1].length === 0)? lines[2]:lines[1];
        }

        //collect models for templates
        makdoc._docs[file.path] = file.model;

        done(null, file);
    });
};

module.exports = makdoc;
