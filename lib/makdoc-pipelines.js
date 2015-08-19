'use strict';

function init(gulp, handlebars, makdoc) {

    var path = require('path');
    var through = require('through2'); // jshint ignore: line
    var $ = require('./gulp-load-plugins')();

    var roots = null;

    function _rebase(){
        if(!roots){
            roots = makdoc.vars.ALL().map(function(root){
                root = root.slice(0, root.indexOf('*'));

                return path.join(root, root.slice(-1) === '/'?  '.': '..');
            });

        }

        return through.obj(function(file, enc, done){
            var index = -1;

            for(var i=0; i < roots.length; i++){
                index = file.base.lastIndexOf(roots[i]);

                if( index > 0 ){
                    index = index + roots[i].length;
                    break;
                }
            }

            if( index > 0 ) {
                file.base = file.base.slice(0, index);
            }else{
                $.util.log(file.path + ' is outside of ' +
                           makdoc.vars.ALL());
            }

            done(null, file);
        });
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
            .pipe(makdoc.models.initialize({
                title: '',
                date: new Date(),
                description: '',
                layout: 'documents',
                keywords: []
            }))
            .pipe($.using())
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
