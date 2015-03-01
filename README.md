#  [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-url]][daviddm-image]

> A task library for generating documents

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

`gulp-makdoc` has only peer dependencies so that you should check your dependencies.

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
│   ├── docs/
│   │   └── **/*.html.md   // docs, markdown to html
│   │   └── **/*.html.hbs // docs, handlebars to html
│   └── root/
│       ├── **/*.xml.hbs   // template, handlebars to xml
│       └── **/*.html.hbs  // template, handlebars to html
└── dist/ //target directory
```

You can change directory layouts. Override `makdoc:init:after` task.

```
gulp.task('makdoc:init:after', function(done){
    var returns = function(v) {
        return function(){
            return v;
        };
    };

    var vars = require('gulp-makdoc').vars;

    var.DOCS = returns('app/docs/**/*.{md,hbs}');
    var.TEMPLATES = returns(['app/root/**/*.hbs']);
    var.PARTIALS = returns('app/partials/**/*.hbs');
    var.LAYOUTS = returns('app/layouts/**/*.hbs');
    var.IMAGES = returns([
        'app/root/**/*.{ico,jpg,jpeg,png,gif}',
        'app/docs/**/*.{ico,jpg,jpeg,png,gif}']);
    var.SOLIDS = returns([
        'app/root/**/*.html',
        'app/docs/**/*.{html,css,scss,less,js}']);
    var.STYLES = returns('app/root/**/*.{css,scss,less}');
    var.SCRIPTS = returns('app/root/**/*.js');
    var.DIST = returns('dist/');
    var.BASE_URL = returns('http://localhost/');

    done();
});
```

## License

MIT © [Changwoo Park](https://pismute.github.io/)

[npm-url]: https://npmjs.org/package/gulp-makdoc
[npm-image]: https://badge.fury.io/js/gulp-makdoc.svg
[daviddm-url]: https://david-dm.org/pismute/gulp-makdoc.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/pismute/gulp-makdoc
