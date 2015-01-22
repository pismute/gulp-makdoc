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
        models: [] //sorted documentModels
    },
    _documentModels: {}, //raw data
    _layouts: {},
    _filters: {}, // namespace for filters gulp plugin
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

makdoc._filters.hasModel = function(){
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

makdoc.model = function(map) {
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

makdoc.modelUrl = function() {
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

module.exports = makdoc;
