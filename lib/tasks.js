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
            APP: returns('app/*/**'),
            DOCS: returns('app/docs/**/*.{md,hbs,asc}'),
            TEMPLATES: returns(['app/root/**/*.hbs']),
            PARTIALS: returns('app/partials/**/*.hbs'),
            LAYOUTS: returns('app/layouts/**/*.hbs'),
            IMAGES: returns(['app/root/**/*.{ico,jpg,jpeg,png,gif}',
                            'app/docs/**/*.{ico,jpg,jpeg,png,gif}']),
            STYLES: returns('app/root/styles/**/*.{css,scss,less}'),
            SCRIPTS: returns('app/root/scripts/**/*.{js,es6,es,jsx}'),
            DIST: returns('dist/'),
            MODELS: returns(['**/*.{model}.json',
                             '**/*.{asc,adoc,md}.json',
                             '**/*.{hbs}.json']),
            BASE_URL: returns('http://localhost/'),
            WATCH_PORT: returns(9000)
        };

        makdoc.vars = vars;

        function defer(){
            if(!vars.SOLIDS){
                var unsolids =
                        _([vars.MODELS(),
                           vars.DOCS(),
                           vars.PARTIALS(),
                           vars.LAYOUTS(),
                           vars.TEMPLATES(),
                           vars.IMAGES(),
                           vars.STYLES(),
                           vars.SCRIPTS()])
                        .flatten();

                var solids = arrayfy(vars.APP())
                             .concat(unsolids.map(function(s){
                                 return s[0] === '!'? s.slice(1): '!' + s;
                             }).value());

                vars.SOLIDS = returns(solids);
            }

            function enIgnores(glob){
                return function(){
                    return arrayfy(vars.IGNORES()).concat(arrayfy(glob));
                };
            }

            vars.DOCS = enIgnores(vars.DOCS());
            vars.IMAGES = enIgnores(vars.IMAGES());
            vars.SOLIDS = enIgnores(vars.SOLIDS());

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
        var tasks = [
            'makdoc:styles',
            'makdoc:scripts'
        ];

        if( makdoc.profile === 'dev') {
            $.util.log('skip makdoc:solid and makdoc:images when in dev');
        } else {
            tasks.concat([
                'makdoc:solid',
                'makdoc:images'
            ]);
        }

        return seq(tasks, done);
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
        gulp.watch(makdoc.vars.APP(), function(event){
            makdoc.pipelines.auto(event.path);
        });

        done();
    });

    gulp.task('makdoc:open', function(done){
        $.open(makdoc.vars.BASE_URL() + 'index.html');

        done();
    });

    // Server
    gulp.task('makdoc:server', function(done){
        makdoc.vars.BASE_URL = returns('http://localhost:' +
                                       makdoc.vars.WATCH_PORT() + '/');

        function startServer(livereload, root){
            $.connect.server({
                livereload: livereload,
                root: root,
                port: makdoc.vars.WATCH_PORT(),
                middleware: function(){
                    return [ makdoc.models.serving() ];
                }
            });
        }

        if( makdoc.profile === 'dev' ) {
            var glob = require('glob');
            var app = makdoc.vars.APP();
            glob(app.slice(0, app.indexOf('*')) + '*/',
                function(err, files){
                    var root = [makdoc.vars.DIST()].concat(files);

                    startServer(true, root);

                    done();
                });
        } else {
            startServer(false, makdoc.vars.DIST());
            done();
        }

    });

} //function init()

module.exports = init;
