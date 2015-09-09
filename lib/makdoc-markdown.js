'use strict';

function init(gulp, makdoc){

    var _PLUGIN_NAME="gulp-makdoc-markdown"; // jshint ignore: line
    var $ = require('gulp-load-plugins')();
    var through = require('through2');
    var marked = require('marked');

    gulp.task('makdoc:init:markdown', function(done) {

        marked.setOptions({
            highlight: makdoc.utils.highlight(),
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: true
        });

        done();
    });

    function render() {
        return through.obj(function(file, enc, done){
            if (file.isNull()) {
                return done(null, file);
            }

            if (file.isStream()) {
                this.emit('error', new $.util.PluginError(_PLUGIN_NAME,
                    'Streaming not supported'));
                return done();
            }

            marked(file.contents.toString(), function(err, data){
                if( !err ){
                    file.contents = new Buffer(data);
                }

                done(err, file);
            });
        });
    }

    return {
        render: render
    };

} // function init()

module.exports = init;
