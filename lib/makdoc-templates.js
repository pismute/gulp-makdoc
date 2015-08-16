'use strict';

function init(gulp, handlebars, makdoc){
    var _ = require('lodash');

    // Load plugins
    var $ = require('gulp-load-plugins')();
    var through = require('through2');

    var _PLUGIN_NAME="gulp-makdoc-templates";

    gulp.task('makdoc:init:templates', function(done) {

        require('dashbars').help(handlebars);

        done();
    });

    function decorate(opts) {
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
    }

    function loadLayoutForHandlebars() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            // name come from 'name.html.hbs'
            var name = makdoc.basename(file.path);
            var contents = file.contents.toString();

            file.model.template = handlebars.compile(contents);

            makdoc._layouts[ name ] = file.model;

            done(null, file);
        });
    }

    function loadPartialForHandlebars() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            // name come from 'name.html.hbs'
            var name = makdoc.basename(file.path);
            var contents = file.contents.toString();

            handlebars.registerPartial(name, contents);

            done(null, file);

        });
    }

    function renderForHandlebars(templateData) {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            //render
            var data = _.assign({}, templateData, file.model);
            var template = handlebars.compile(file.contents.toString());
            file.contents = new Buffer(template(data));

            done(null, file);
        });
    }

    return {
        loadLayoutForHandlebars: loadLayoutForHandlebars,
        loadPartialForHandlebars: loadPartialForHandlebars,
        renderForHandlebars: renderForHandlebars,
        decorate: decorate
    };
} // function init()

module.exports = init;
