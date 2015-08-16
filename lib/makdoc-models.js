'use strict';

function init(gulp, handlebars, makdoc){ // jshint ignore: line
    var _ = require('lodash');

    // Load plugins
    var $ = require('gulp-load-plugins')();
    var through = require('through2');
    var path = require('path');
    var fs = require('fs');

    var _PLUGIN_NAME="gulp-makdoc";
    var _STRIP_MARKUP_PATTERN = /(<([^>]+)>)/g;

    function initialize(base) {
        base = base || {};

        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            file.model = _.extend({}, base);

            done(null, file);
        });
    }

    function loadFileModel(skip) {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            var modelPath = file.path + ".json";
            var m = file.model;

            fs.exists(modelPath, function (exists) {
                if(exists) {
                    _.extend(m, require(modelPath));
                }

                if(exists || !skip) {
                    done(null, file);
                }else{
                    done();
                }

            });
        });
    }

    function url() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            var m = file.model;

            var uri = file.relative;
            m.uri = path.join('/', uri);
            m.url = makdoc.vars.BASE_URL() + uri;

            done(null, file);
        });
    }

    function addToDocs() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            //collect models for templates
            makdoc._docs[file.path] = file.model;

            done(null, file);
        });
    }

    var _stripMarkup = function(html) {
        return html.trim().replace(_STRIP_MARKUP_PATTERN, '');
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

    function extractModelFromDocument() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
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
    }

    var _directoryModels = [];

    function loadDirectoryModel() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            var model = file.model;
            var absolute = file.path;
            var dirname = path.dirname(absolute);
            var dirModels = _directoryModels[dirname];

            // not found in cache, try to load directory model
            if( !dirModels ){
                try{
                    dirModels = require(dirname+'/.model.json');
                    _directoryModels[dirname] = dirModels;
                }catch(e){}
            }

            if( dirModels ){
                // It is safe to undefined, ...
                _.extend(model, dirModels['*'],
                        dirModels[path.basename(absolute)]);
            }

            done(null, file);
        });
    }

    function finalize() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            var m = file.model;

            m.date = _.isString(m.date)? new Date(m.date):
                    m.date || new Date();
            m.title = _.isEmpty(m.title.trim())? path.basename(file.path):
                    m.title;

            done(null, file);
        });
    }



    function contents() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            //save contents before which are layouted
            file.model.contentsWithoutLayouts = file.contents.toString();

            done(null, file);
        });
    }

    return {
        initialize: initialize,
        url: url,
        addToDocs: addToDocs,
        loadFileModel: loadFileModel,
        extractModelFromDocument: extractModelFromDocument,
        loadDirectoryModel: loadDirectoryModel,
        finalize: finalize,
        contents: contents
    };

} // function init()

module.exports = init;
