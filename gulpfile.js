'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var seq = require('run-sequence');

gulp.task('default', function(done){
    return seq('lint', done);
});

var files = ['lib/**/*.js'];

gulp.task('lint', function(){
    return gulp.src(files)
        .pipe($.cached('lint'))
        .pipe($.jshint('.jshintrc'))
        .pipe($.jshint.reporter('default'));
});

// Watch
gulp.task('watch', ['default'], function(done){

    gulp.watch(files, ['lint']);

    done();
});

gulp.task('publish', function(done){
    seq('npm', done);
});

gulp.task('npm', function (done) {
    require("child_process")
    .spawn('npm', ['publish'], { stdio: 'inherit' })
    .on('close', done);
});

gulp.task('bump', function(){
    var _type = gulp.env.type || 'patch';
    return gulp.src(['./package.json'])
        .pipe($.bump({type:_type, indent: 4 }))
        .pipe(gulp.dest('./'));
});
