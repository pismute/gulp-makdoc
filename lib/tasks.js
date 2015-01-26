'use strict';

var _ = require('lodash');
var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')();
var through = require('through2');
var seq = require('run-sequence');
var Handlebars = require('handlebars');
var makdoc = require('./makdoc');

gulp.task('default', ['makdoc']);

gulp.task('clean', function(done){
    seq('makdoc:init',
        ['makdoc:clean', 'makdoc:clear'],
        done);
});

gulp.task('server', function(done){
    seq('makdoc:init',
        'makdoc:server',
        'makdoc:start',
        'makdoc:open',
        done);
});

gulp.task('watch', function(done){
    seq('makdoc:init',
        'makdoc:server',
        ['makdoc:start', 'makdoc:watch'],
        'makdoc:open',
        done);
});

gulp.task('makdoc', function(done){
    seq('makdoc:init',
        'makdoc:start',
        done);
});

gulp.task('makdoc:start', function (done) {
    return seq(
            'makdoc:clean',
            ['makdoc:resources', 'makdoc:build'],
            'makdoc:done:after',
            done);
});

/******************************************************************************
 * makdoc:*
 */

gulp.task('makdoc:clear', function(done) {
    return $.cache.clearAll(done);
});

gulp.task('makdoc:clean', function(done) {
    require('del')(makdoc.vars.DIST(), done);
});

gulp.task('makdoc:init:after', function(done){
    done();
});

gulp.task('makdoc:done:after', function(done){
    done();
});

/******************************************************************************
 * makdoc:build
 */

gulp.task('makdoc:build', function(done){
    return seq(['makdoc:partials', 'makdoc:layouts'],
               'makdoc:docs',
               'makdoc:templates',
               done);
});

var returns = function(v) {
    return function(){
        return v;
    };
};

gulp.task('makdoc:init', function(done) {

    require('dashbars').help(Handlebars);

    require('marked').setOptions({
        highlight: function(code, lang, done){
            require('pygmentize-bundled')(
                    { lang: lang, format: 'html' },
                    code,
                    function (err, result) {
                done(err, result.toString());
            });
        },
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: true,
    });

    makdoc.vars = {
        DOCS: returns('app/docs/**/*.{md,hbs}'),
        TEMPLATES: returns(['app/root/**/*.hbs']),
        PARTIALS: returns('app/partials/**/*.hbs'),
        LAYOUTS: returns('app/layouts/**/*.hbs'),
        IMAGES: returns(['app/root/**/*.{ico,jpg,jpeg,png,gif}',
                         'app/docs/**/*.{ico,jpg,jpeg,png,gif}']),
        SOLIDS: returns(['app/root/**/*.{html}',
                        'app/docs/**/*.{html,css,scss,less,js}']),
        STYLES: returns('app/root/**/*.{css,scss,less}'),
        SCRIPTS: returns('app/root/**/*.js'),
        DIST: returns('dist/'),
        BASE_URL: returns('http://localhost/'),
        WATCH_PORT: returns(9000)
    };

    seq('makdoc:init:after', done);
});

gulp.task('makdoc:partials', function(){
    return gulp.src(makdoc.vars.PARTIALS())
        .pipe($.cached('makdoc:partials'))
        .pipe(makdoc.model.init())
        .pipe(makdoc.model.load())
        .pipe($.using())
        .pipe(through.obj(function(file, enc, done){

            // name come from 'name.html.hbs'
            var name = makdoc.basename(file.path);
            var contents = file.contents.toString();

            Handlebars.registerPartial(name, contents);

            done(null, file);
        }))
        .pipe($.connect.reload());
});

gulp.task('makdoc:layouts', function(){
    return gulp.src(makdoc.vars.LAYOUTS())
        .pipe($.cached('makdoc:layouts'))
        .pipe(makdoc.model.init())
        .pipe(makdoc.model.load())
        .pipe($.using())
        .pipe(through.obj(function(file, enc, done){
            // name come from 'name.html.hbs'
            var name = makdoc.basename(file.path);
            var contents = file.contents.toString();

            file.model.template = Handlebars.compile(contents);

            makdoc._layouts[ name ] = file.model;

            done(null, file);
        }))
        .pipe($.connect.reload());
});

gulp.task('makdoc:templates', function(){
    makdoc._templateData.docs =
            _.sortBy(makdoc._docs, function(model) {
                return -model.date;
            });

    return gulp.src(makdoc.vars.TEMPLATES())
        .pipe($.cached('makdoc:templates'))
        .pipe(makdoc.model.init())
        .pipe(makdoc.model.load())
        .pipe($.using())
        .pipe($.rename({extname:''})) //drop Extension
        .pipe(makdoc.model.url())
        .pipe(through.obj(function(file, enc, done){
            //render
            var template = Handlebars.compile(file.contents.toString());
            file.contents =
                new Buffer(
                    template(
                        _.assign({}, makdoc._templateData, file.model)));

            done(null, file);
        }))
        .pipe(makdoc.model.seo())
        .pipe(makdoc.model.contents())
        .pipe(makdoc.decorate())
        .pipe(gulp.dest(makdoc.vars.DIST()))
        .pipe($.size())
        .pipe($.connect.reload());
});

/******************************************************************************
 * makdoc:docs
 */

gulp.task('makdoc:docs', function () {
    var mdFilter = $.filter('**/*.md');
    var hbsFilter = $.filter('**/*.hbs');
    var marked = require('marked');

    return gulp.src(makdoc.vars.DOCS())
        .pipe($.cached('makdoc:docs'))
        .pipe(makdoc.model.init())
        .pipe(makdoc.model.load(true))
        .pipe($.using())
        .pipe(mdFilter)
        .pipe($.cache(through.obj(function(file, enc, done){
            marked(file.contents.toString(), function(err, data){
                file.contents = new Buffer(data);
                done(err, file);
            });
        })))
        .pipe(mdFilter.restore())
        .pipe(hbsFilter)
        .pipe(through.obj(function(file, enc, done){
            //render
            var template = Handlebars.compile(file.contents.toString());
            file.contents =
                new Buffer(
                    template(
                        _.assign({}, makdoc._templateData, file.model)));

            done(null, file);
        }))
        .pipe(hbsFilter.restore())
        .pipe($.rename({extname:''})) //drop Extension
        .pipe(makdoc.model.url())
        .pipe(makdoc.model.seo())
        .pipe(makdoc.model.contents())
        .pipe(makdoc.model.addToDocs())
        .pipe(makdoc.decorate())
        .pipe(gulp.dest(makdoc.vars.DIST()))
        .pipe($.size())
        .pipe($.connect.reload());
});

/******************************************************************************
 * makdoc:resources
 */

gulp.task('makdoc:resources', function(done){
    return seq([
            'makdoc:solid',
            'makdoc:images',
            'makdoc:styles',
            'makdoc:scripts',
            ],
            done);
});

gulp.task('makdoc:solid', function () {
    return gulp.src(makdoc.vars.SOLIDS())
        .pipe($.cached('makdoc:solid'))
        .pipe($.using())
        .pipe(gulp.dest(makdoc.vars.DIST()))
        .pipe($.size())
        .pipe($.connect.reload());
});

gulp.task('makdoc:images', function () {
    return gulp.src(makdoc.vars.IMAGES())
        // .pipe($.cached('makdoc:images'))
        //.pipe($.using())
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(makdoc.vars.DIST()))
        .pipe($.size())
        .pipe($.connect.reload());
});

gulp.task('makdoc:styles', function() {
    var lessFilter = $.filter('**/*.less');
    var scssFilter = $.filter('**/*.scss');

    return gulp.src(makdoc.vars.STYLES())
        .pipe($.cached('makdoc:styles'))
        .pipe($.using())
        .pipe(lessFilter)
        .pipe($.less({
            strictMath: true,
            strictUnits: true,
        }))
        .pipe(lessFilter.restore())
        .pipe(scssFilter)
        .pipe($.sass({ style: 'expanded', }))
        .pipe(scssFilter.restore())
        .pipe($.autoprefixer('last 2 version'))
        //.pipe($.rename({ suffix: '.min' }))
        //.pipe($.minifycss())
        .pipe(gulp.dest(makdoc.vars.DIST()));
});

gulp.task('makdoc:scripts', function() {
    return gulp.src(makdoc.vars.SCRIPTS())
        .pipe($.cached('makdoc:scripts'))
        .pipe($.using())
        .pipe($.jshint('.jshintrc'))
        .pipe($.jshint.reporter('default'))
        // .pipe(concat('main.js'))
        // .pipe(rename({ suffix: '.min' }))
        // .pipe(uglify())
        .pipe(gulp.dest(makdoc.vars.DIST()))
        .pipe($.connect.reload());
});

/******************************************************************************
 * makdoc:watch
 */

// Watch
gulp.task('makdoc:watch', function(done){
    gulp.watch(makdoc.vars.DOCS(), ['makdoc:docs']);
    gulp.watch(makdoc.vars.TEMPLATES(), ['makdoc:templates']);
    gulp.watch(makdoc.vars.LAYOUTS(), ['makdoc:layouts', 'makdoc:templates']);
    gulp.watch(makdoc.vars.PARTIALS(), ['makdoc:partials', 'makdoc:templates']);
    gulp.watch(makdoc.vars.IMAGES(), ['makdoc:images']);
    gulp.watch(makdoc.vars.SOLIDS(), ['makdoc:solid']);
    gulp.watch(makdoc.vars.STYLES(), ['makdoc:styles']);
    gulp.watch(makdoc.vars.SCRIPTS(), ['makdoc:scripts']);

    done();
});

gulp.task('makdoc:open', function(done){
    $.open(makdoc.vars.BASE_URL() + 'index.html');

    done();
});

// Server
gulp.task('makdoc:server', function(done){
    makdoc.vars.BASE_URL = returns('http://localhost:' + makdoc.vars.WATCH_PORT() + '/');

    $.connect.server({
        livereload: true,
        root: [makdoc.vars.DIST()],
        port: makdoc.vars.WATCH_PORT()
    });

    done();
});

module.exports = makdoc;
