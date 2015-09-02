'use strict';

function init(gulp, makdoc) {

    var _PLUGIN_NAME='gulp-makdoc-pipelines'; // jshint ignore: line

    var path = require('path');
    var through = require('through2'); // jshint ignore: line
    var $ = require('./gulp-load-plugins')();
    var minimatch = require('minimatch');
    var arrayfy = require('./util').arrayfy;

    var apps = null;

    function _getFileBase(filepath, filebase){
        var newFileBase = filebase;

        if(!apps){
            apps = arrayfy(makdoc.vars.APP()).map(function(app){
                app = app.slice(0, app.indexOf('*'));

                // /absolute/path/to/:app/*
                return path.join(process.cwd(), app,
                                 app.slice(-1) === '/'?  '.': '..');
            });
        }

        for(var i=0; i < apps.length; i++){
            var index = filepath.indexOf(apps[i]); // absolute path

            if( index === 0 ){ // absolute path
                var next = filepath.indexOf('/',
                                                apps[i].length + 1);

                if( next > 0 ) {
                    newFileBase = filepath.slice(0, next);
                }

                break;
            }
        }

        return newFileBase;
    }

    function _rebase(){
        return through.obj(function(file, enc, done){
            if(!file.isNull()){ // not directory
                file.base = _getFileBase(file.path, file.base);
            }

            done(null, file);
        });
    }

    function _matches(glob, patterns){
        patterns = Array.isArray(patterns)? patterns: [patterns];

        return patterns.some(function(p){
            //glob is absolute path so that '**/' is required.
            return minimatch(glob, '**/' + p);
        });
    }

    function auto(glob){
        if( _matches(glob, makdoc.vars.PARTIALS()) ){
            return partials(glob);
        } else if( _matches(glob, makdoc.vars.LAYOUTS()) ){
            return layouts(glob);
        } else if( _matches(glob, makdoc.vars.TEMPLATES()) ){
            return templates(glob);
        } else if( _matches(glob, makdoc.vars.DOCS()) ){
            return docs(glob);
        } else if( _matches(glob, makdoc.vars.IMAGES()) ){
            return images(glob);
        } else if( _matches(glob, makdoc.vars.STYLES()) ){
            return styles(glob);
        } else if( _matches(glob, makdoc.vars.SCRIPTS()) ){
            return scripts(glob);
        } else {
            return solid(glob);
        }
    }

    function partials(glob){
        return gulp.src(glob)
            .pipe($.using())
            .pipe(makdoc.models.initialize())
            .pipe(makdoc.models.loadDirectoryModel())
            .pipe(makdoc.models.loadFileModel())
            .pipe(makdoc.templates.loadPartialForHandlebars())
            .pipe($.connect.reload());
    }

    function layouts(glob){
        return gulp.src(glob)
            .pipe($.using())
            .pipe(makdoc.models.initialize())
            .pipe(makdoc.models.loadDirectoryModel())
            .pipe(makdoc.models.loadFileModel())
            .pipe(makdoc.templates.loadLayoutForHandlebars())
            .pipe($.connect.reload());
    }

    function templates(glob){
        return gulp.src(glob)
            .pipe($.using())
            .pipe(makdoc.models.initialize({
                title: '',
                date: new Date(),
                description: '',
                layout: 'default',
                keywords: []
            }))
            .pipe(makdoc.models.loadDirectoryModel())
            .pipe(makdoc.models.loadFileModel())
            .pipe($.rename({extname:''})) //drop Extension before model.url
            .pipe(makdoc.models.url())
            .pipe(makdoc.templates
                     .renderForHandlebars(makdoc.templateData()))
            .pipe(makdoc.models.contents())
            .pipe(makdoc.templates.decorate())
            .pipe(_rebase())
            .pipe(gulp.dest(makdoc.vars.DIST()))
            .pipe($.size())
            .pipe($.connect.reload());
    }

    function docs(glob){
        var mdFilter = $.filter('**/*.md');
        var ascFilter = $.filter('**/*.{adoc,asc}');
        var hbsFilter = $.filter('**/*.hbs');

        return gulp.src(glob)
            .pipe($.using())
            .pipe(makdoc.models.initialize({
                title: '',
                date: new Date(),
                description: '',
                layout: 'documents',
                keywords: []
            }))
            .pipe(mdFilter)
                .pipe(makdoc.markdown.render())
                .pipe(mdFilter.restore())
            .pipe(ascFilter)
                .pipe(makdoc.asciidoc.render())
                .pipe(ascFilter.restore())
            .pipe(hbsFilter)
                .pipe(makdoc.templates
                        .renderForHandlebars(makdoc.templateData()))
                .pipe(hbsFilter.restore())
            .pipe(makdoc.models.extractModelFromDocument())
            .pipe(makdoc.models.loadDirectoryModel())
            .pipe(makdoc.models.loadFileModel())
            .pipe(makdoc.models.finalize())
            .pipe(makdoc.models.contents())
            .pipe($.rename({extname:''})) //drop Extension before model.url
            .pipe(makdoc.models.url())
            .pipe(makdoc.models.addToDocs())
            .pipe(makdoc.templates.decorate())
            .pipe(_rebase())
            .pipe(gulp.dest(makdoc.vars.DIST()))
            .pipe($.size())
            .pipe($.connect.reload());
    }

    function solid(glob){
        return gulp.src(glob)
            .pipe($.using())
            .pipe(_rebase())
            .pipe(gulp.dest(makdoc.vars.DIST()))
            .pipe($.size())
            .pipe($.connect.reload());
    }

    function images(glob){
        return gulp.src(glob)
            .pipe($.using())
            .pipe($.cache($.imagemin({
                optimizationLevel: 3,
                progressive: true,
                interlaced: true
            })))
            .pipe(_rebase())
            .pipe(gulp.dest(makdoc.vars.DIST()))
            .pipe($.size())
            .pipe($.connect.reload());
    }

    function styles(glob){
        var lessFilter = $.filter('**/*.less');
        var scssFilter = $.filter('**/*.scss');

        return gulp.src(glob)
            .pipe($.using())
            .pipe(lessFilter)
                .pipe($.less({
                    strictMath: true,
                    strictUnits: true
                }))
                .pipe(lessFilter.restore())
            .pipe(scssFilter)
                .pipe($.sass({ style: 'expanded' }))
                .pipe(scssFilter.restore())
            .pipe($.autoprefixer('last 2 version'))
            //.pipe($.rename({ suffix: '.min' }))
            //.pipe($.minifycss())
            .pipe(_rebase())
            .pipe(gulp.dest(makdoc.vars.DIST()))
            .pipe($.connect.reload());
    }

    function scripts(glob){
        var babelFilter = $.filter('**/*.{es6.js,es6,es,jsx}');
        return gulp.src(glob)
            .pipe($.sourcemaps.init())
            .pipe($.using())
            .pipe($.jshint('.jshintrc'))
            .pipe($.jshint.reporter('default'))
            .pipe(babelFilter)
                .pipe($.babel())
                .pipe(babelFilter.restore())
            // .pipe(concat('main.js'))
            .pipe($.rename({ suffix: '.min' }))
            .pipe($.uglify())
            .pipe($.sourcemaps.write('.'))
            .pipe(_rebase())
            .pipe(gulp.dest(makdoc.vars.DIST()))
            .pipe($.connect.reload());
    }

    return {
        auto: auto,
        partials: partials,
        layouts: layouts,
        templates: templates,
        docs: docs,
        solid: solid,
        images: images,
        styles: styles,
        scripts: scripts
    };

} //function init()

module.exports = init;
