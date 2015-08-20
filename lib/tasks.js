'use strict';

function init(gulp, handlebars, makdoc) {

    var _ = require('lodash');

    // Load plugins
    var $ = require('./gulp-load-plugins')();
    var seq = require('run-sequence');
    var arrayfy = require('./util').arrayfy;

    gulp.task('default', ['makdoc']);

    gulp.task('clean', function(done){
        seq('makdoc:init',
            ['makdoc:clean', 'makdoc:clear'],
            done);
    });

    gulp.task('server', function(done){
        seq('makdoc:init',
            ['makdoc:start', 'makdoc:server'],
            'makdoc:open',
            done);
    });

    gulp.task('watch', function(done){
        seq('makdoc:init',
            ['makdoc:start', 'makdoc:server'],
            'makdoc:open',
            function(){
                done();

                // 'makdoc:watch' run async completely
                // because watching is very slow
                gulp.start('makdoc:watch');
            });
    });

    gulp.task('makdoc', function(done){
        seq('makdoc:init',
            'makdoc:start',
            done);
    });

    gulp.task('help', $.taskListing);

    gulp.task('makdoc:start', function (done) {
        return seq(
            'makdoc:prerequisite',
            'makdoc:clean',
            ['makdoc:resources', 'makdoc:build'],
            'makdoc:done:after',
            done);
    });
/****************************************************************************
* makdoc:/
*/

    gulp.task('makdoc:clear', function(done) {
        $.cache.clearAll(done);
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

/****************************************************************************
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

    gulp.task('makdoc:prerequisite', function(done){
        done();
    });

    gulp.task('makdoc:init', function(done) {

        var vars = {
            IGNORES: returns(''),
            ALL: returns(['app/root/**', 'app/docs/**']),
            DOCS: returns('app/docs/**/*.{md,hbs,asc}'),
            TEMPLATES: returns(['app/root/**/*.hbs']),
            PARTIALS: returns('app/partials/**/*.hbs'),
            LAYOUTS: returns('app/layouts/**/*.hbs'),
            IMAGES: returns(['app/root/**/*.{ico,jpg,jpeg,png,gif}',
                            'app/docs/**/*.{ico,jpg,jpeg,png,gif}']),
            STYLES: returns('app/root/styles/**/*.{css,scss,less}'),
            SCRIPTS: returns('app/root/scripts/**/*.{js,es6,es,jsx}'),
            DIST: returns('dist/'),
            BASE_URL: returns('http://localhost/'),
            WATCH_PORT: returns(9000)
        };

        makdoc.vars = vars;

        function defer(){
            if(!vars.SOLIDS){
                var solids = _([vars.DOCS(),
                                vars.TEMPLATES(),
                                vars.IMAGES(),
                                vars.STYLES(),
                                vars.SCRIPTS()])
                            .flatten()
                            .map(function(s){ return '!' + s; } )
                            .unshift('!**/*.{model,md,hbs}.json') // model files
                            .unshift(vars.ALL())
                            .flatten()
                            .value();

                vars.SOLIDS = returns(solids);
            }

            var DOCS = vars.DOCS;
            var IMAGES = vars.IMAGES;
            var SOLIDS = vars.SOLIDS;

            vars.DOCS = function(){
                return arrayfy(DOCS()).concat(arrayfy(vars.IGNORES()));
            };
            vars.IMAGES = function(){
                return arrayfy(IMAGES()).concat(arrayfy(vars.IGNORES()));
            };
            vars.SOLIDS = function(){
                return arrayfy(SOLIDS()).concat(arrayfy(vars.IGNORES()));
            };

            done();
        }

        seq(['makdoc:init:templates',
             'makdoc:init:asciidoc',
             'makdoc:init:markdown'],
            'makdoc:init:after',
            defer);
    });

    gulp.task('makdoc:partials', function(){
        return makdoc.pipelines.partials(makdoc.vars.PARTIALS());
    });

    gulp.task('makdoc:layouts', function(){
        return makdoc.pipelines.layouts(makdoc.vars.LAYOUTS());
    });

    gulp.task('makdoc:templates', function(){
        makdoc._templateData.docs =
                _.sortBy(makdoc._docs, function(model) {
                    return -model.date;
                });

        return makdoc.pipelines.templates(makdoc.vars.TEMPLATES());
    });

/****************************************************************************
 * makdoc:docs
 */

    gulp.task('makdoc:docs', function () {
        return makdoc.pipelines.docs(makdoc.vars.DOCS());
    });

/****************************************************************************
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
        return makdoc.pipelines.solid(makdoc.vars.SOLIDS());
    });

    gulp.task('makdoc:images', function () {
        return makdoc.pipelines.images(makdoc.vars.IMAGES());
    });

    gulp.task('makdoc:styles', function() {
        return makdoc.pipelines.styles(makdoc.vars.STYLES());
    });

    gulp.task('makdoc:scripts', function() {
        return makdoc.pipelines.scripts(makdoc.vars.SCRIPTS());
    });

/****************************************************************************
 * makdoc:watch
 */

    // Watch
    gulp.task('makdoc:watch', function(done){
        gulp.watch(makdoc.vars.DOCS(), function(event){
            makdoc.pipelines.docs(event.path);
        });
        gulp.watch(makdoc.vars.TEMPLATES(), function(event){
            makdoc.pipelines.templates(event.path);
        });
        gulp.watch(makdoc.vars.LAYOUTS(), function(event){
            makdoc.pipelines.layouts(event.path);
        });
        gulp.watch(makdoc.vars.PARTIALS(), function(event){
            makdoc.pipelines.partials(event.path);
        });
        gulp.watch(makdoc.vars.IMAGES(), function(event){
            makdoc.pipelines.images(event.path);
        });
        gulp.watch(makdoc.vars.SOLIDS(), function(event){
            makdoc.pipelines.solid(event.path);
        });
        gulp.watch(makdoc.vars.STYLES(), function(event){
            makdoc.pipelines.styles(event.path);
        });
        gulp.watch(makdoc.vars.SCRIPTS(), function(event){
            makdoc.pipelines.scripts(event.path);
        });

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

} //function init()

module.exports = init;
