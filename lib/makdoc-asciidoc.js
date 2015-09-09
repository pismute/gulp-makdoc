'use strict';

function init(gulp, makdoc){

    var PLUGIN_NAME="gulp-makdoc-asciidoc"; // jshint ignore: line
    var $ = require('gulp-load-plugins')();
    var through = require('through2');
    var asciidoctor = require('asciidoctor.js')();
    var opal = asciidoctor.Opal;
    var processor = asciidoctor.Asciidoctor(true);

    gulp.task('makdoc:init:asciidoc', function(done) {

        makdoc.asciidoc.options = opal.hash2(
                ['doctype', 'attributes'],
                {
                    doctype: 'article',
                    attributes: ['showtitle']
                });

        done();
    });

    function render() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            var html = processor.$convert(file.contents.toString(),
                                          makdoc.asciidoc.options);

            file.contents = new Buffer(html);

            done(null, file);
        });
    }

    return {
        render: render
    };

} // function init()

module.exports = init;
