'use strict';

var $util = require('gulp-util');
var through = require('through2');

var newEmpty = function(){
    return function() {
        return through.obj(function(file, enc, done){
                //nothing
                done(null, file);
            });
    };
};

var requireFn = function(module){
    try{
        return require(module);
    }catch(e){
        $util.log('skipped ' + module);

        var plugin = newEmpty();

        if(module === 'gulp-jshint'){
            plugin.reporter = newEmpty();
        }else if( module === 'gulp-sourcemaps'){
            plugin.init = newEmpty();
            plugin.write = newEmpty();
        }

        return plugin;
    }
};

module.exports = function(options){
    options = options || {};

    options.requireFn = options.requireFn || requireFn;

    return require('gulp-load-plugins')(options);
};
