#  [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-url]][daviddm-image]

> A task-based document generator.

## Install & Usage

### Install

```sh
$ npm install --save-dev gulp-makdoc
```

### Usage

Require once anywhere:

```
var makdoc = require('gulp-makdoc');
```

`gulp-makdoc` has only peer dependancies so that you should check your depencancies.

Build:

```
$ gulp
```

Server:

```
$ gulp server
```

Watch:

```
$ gulp watch
````

#### Directory Layouts

```
.
├── app/
│   ├── layouts/
│   │   └── **/*.hbs
│   ├── partials/
│   │   └── **/*.hbs
│   └── root/
│       ├── **/*.html.md   // docs, markdown to html
│       ├── docs/**/*.html.hbs // docs, handlebars to html
│       ├── **/*.xml.hbs   // template, handlebars to xml
│       └── **/*.html.hbs  // template, handlebars to html
└── dist/ //target directory
```

You can change directory layouts. Overide `makdoc:init:after` task.

```
gulp.task('makdoc:init:after', function(done){
    var returns = function(v) {
        return function(){
            return v;
        };
    };

    var vars = require('gulp-makdoc').vars;

    vars.DOCS_MARKDOWNS= returns('app/docs/**/*.md');
    vars.DOCS_HANDLEBARS= returns('app/docs/**/*.hbs');
    vars.TEMPLATES= returns('app/root/**/*.hbs');
    vars.PARTIALS= returns('app/partials/**/*.hbs');
    vars.LAYOUTS= returns('app/layouts/**/*.hbs');
    vars.IMAGES= returns('app/root/**/*.{ico,jpg,jpeg,png,gif}');
    vars.SOLIDS= returns('app/root/**/*.{html}');
    vars.STYLES= returns('app/root/**/*.{css,scss,less}');
    vars.SCRIPTS= returns('app/root/**/*.js');
    vars.DIST= returns('dist/');
    vars.BASE_URL= returns('http://myhost/');
    vars.WATCH_PORT= returns(9000);

    done();
});
```

## License

MIT © [Changwoo Park](https://pismute.github.io/)

[npm-url]: https://npmjs.org/package/gulp-makdoc
[npm-image]: https://badge.fury.io/js/gulp-makdoc.svg
[daviddm-url]: https://david-dm.org/pismute/gulp-makdoc.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/pismute/gulp-makdoc
