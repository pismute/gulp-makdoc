#  [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-url]][daviddm-image]

> A task library for generating documents

## Install & Usage

### Install

```sh
$ npm install --save-dev gulp-makdoc
```

### Usage

Require once anywhere:

```js
var makdoc = require('gulp-makdoc');
```

`gulp-makdoc` has only peer dependencies so that you should check your dependencies.

Build:

```sh
$ gulp
```

Server:

```sh
$ gulp server
```

Watch:

```sh
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

```js
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
    var.STYLES = returns('app/root/**/*.{css,scss,less}');
    var.SCRIPTS = returns('app/root/**/*.js');
    var.DIST = returns('dist/');
    var.BASE_URL = returns('http://localhost/');

    done();
});
```

## Deploy

You can define `deploy` task to easily deploy your documents:

```js
gulp.task('deploy', ['makdoc'], function () {
    ...
});
```

Before documents are deploying, 'makdoc' task that build your documents should run. Make your documents fresh when you deploy

### GitHub

Using [gulp-gh-pages][], You can easily deploy your site on GitHub page. Just install:

```sh
$ npm install --save-dev gulp-gh-pages
```

As a usage for `gulp-gh-pages`:

```js
gulp.task('deploy', ['makdoc'], function () {
    var deploy = require('gulp-gh-pages');
    var path = require('path');

    return gulp.src(path.join($.makdoc.vars.DIST(),'**/*'))
        .pipe(deploy({
            remoteUrl: 'git@github.com:pismute/pismute.github.io.git',
            cacheDir: '.gh-pages',
            branch:'master'
        }));
});
```

## Model

Makdoc do not use such [YAML front matter][front-matter]. so we can write with any editor and format. you can write your documents in an editor like `vim` or `emacs`, And then build them using Makdoc to push on your website , or then print them to your printer or pdf file using your own tool like [Haroopad][] without touch.

[front-matter]: http://jekyllrb.com/docs/frontmatter/
[Haroopad]: http://pad.haroopress.com/

Instead, Makdoc use `model.json` file. If the file name of your document is `path/to/my-doc.html.md` then make anther file of which the name is `path/to/my-doc.html.md.json`. Makdoc will load and merge it to the document model.

Makdoc inject model in three way:

1. Default model: Hard-coded model in Makdoc
2. Document's `title` and `description`: Makdoc parse them from document's content
3. User model: `path/to/xxxx.json` file.

### Default Model

Makdoc has four type components of documents:

- Partials: `.hbs` templates that are partial documents in other `.hbs` documents.
- Layouts: `.hbs` templates that contain other document.
- Documents: `.md`, `.hbs`, and else documents that you write. Makdoc will decorate documents with Layouts, after Makdoc build them.
- Templates: `.hbs` templates which is like `index.html`, `atom.xml`, `sitemap.xml`, and so on. Makdoc will decorate with Layouts

Makdoc initializes different model for each type as default.

#### Layouts, Partials

Layouts and Partials has no a default model:

```
{}
```

#### Templates

The default model of templates is simple:

```
{
    title: '',
    date: new Date(),
    description: '',
    layout: 'default'
    keywords: []
}
```

#### Documents

Every document has 'untitled' title and 'documents' layout and now as date. Makdoc will sort documents in `docs` variable by date descending:

```
{
    title: 'untitled',
    date: new Date(),
    description: '',
    layout: 'documents'
    keywords: []
}
```

### Model for SEO

`title`, `description` and `keywords` are useful for SEO. You can use it in your templates or layouts:

```html
<title>{{{title}}}</title>
<meta name="description"
    content="{{{description}}}"></meta>
<meta name="keywords"
    content="{{{-join keywords ','}}}"></meta>
```

#### Documents

Makdoc inject the title and description of documents from rendered content(html) to model. The title is a striped-string  from first line(newline ended, not `<br>`), and the description is a striped-string from the second or third nonempty(after striped and trimmed) line(it use the third line when the second line is empty):

```
<h1> This is title</h1>

<p>This is description and
this is not description</p>
```

## Tasks

Makdoc tasks are like LEGO bricks for generating documents. You can just use because Makdoc has lots of combination tasks.

you can override some tasks if you want to change it differently:

```js
//after require('gulp-makdoc')
gulp.task('makdoc:task', function(){
    //...
});
```

Some tasks like `server`, `watch`, `default`, `clean` is just a task that run other tasks in order or parallel. Therefore, you can override the behavior of Makdoc as complete as you want.

### For user

Tasks lead you to get easy:

- `default`: Just alias of 'makdoc'
- `makdoc`: Build your documents.
    1. 'makdoc:init'
    2. 'makdoc:start'
- `clean`: Clean all generated files and optimized-image caches.
    1. 'makdoc:init'
    2. ['makdoc:clean', 'makdoc:clear']
- `server`: Build and run server
    1. 'makdoc:init'
    2. 'makdoc:server'
    3. 'makdoc:start'
    4. 'makdoc:open'
- `watch`: Build and run and watch for live-reload
    1. 'makdoc:init'
    2. 'makdoc:server'
    3. ['makdoc:start', 'makdoc:watch']
    4. 'makdoc:open'
- `makdoc:init:after`: An empty task to override that Makdoc will run it after initialized
- `makdoc:done:after`: An empty task to override that Makdoc will run it after all done

### For internal

- `makdoc:start`: Start makdoc process
    1. 'makdoc:prerequisite
    2. 'makdoc:clean'
    3. ['makdoc:resources', 'makdoc:build']
    4. 'makdoc:done:after'
- `makdoc:clean`: Clean files built from Makdoc.
- `makdoc:clear`: Clear caches of [gulp-cache][], which of optimized images
- `makdoc:build`: Build documents like Handlebars or Markdown
    1. ['makdoc:partials', 'makdoc:layouts']
    2. 'makdoc:docs'
    3. 'makdoc:templates'
- `makdoc:prerequisite`: Check condition.
- `makdoc:init`: Initialize Makdoc
    - 'makdoc:init:after'
- `makdoc:partials`: Load partial Helpers for Handlebars.
- `makdoc:layouts`: Load layouts that are Handlebars templates for decorating documents.
- `makdoc:templates`: Build handlebars templates(var.TEMPLATES()).
- `makdoc:docs`: Build var.DOCS().
- `makdoc:resources`: Build and copy resources without templates
    - 'makdoc:solid'
    - 'makdoc:images'
    - 'makdoc:styles'
    - 'makdoc:scripts'
- `makdoc:solid`: Copy files to dist directory.
- `makdoc:images`: Optimize and Copy images(var.IMAGES()) to dist directory.
- `makdoc:styles`: Build and Copy style files(var.STYLES()) to dist directory.
- `makdoc:scripts`: Build script files to dist directory.
- `makdoc:watch`: Watch files to run tasks
- `makdoc:open`: Open browser to walk your documents
- `makdoc:server`: Run server with live-reload.

[gulp-gh-pages]: https://github.com/shinnn/gulp-gh-pages
[gulp-cache]: https://github.com/jgable/gulp-cache

## Links

- A Blog from [@pismute](https://github.com/pismute/pismute.makdoc), Korean
- A Blog from [@lethee](https://github.com/lethee/blog-by-makdoc), Korean
- [Makdoc 소개](http://lethee.github.io/makdoc-first.html), Korean
- [generator-makdoc-blog](https://github.com/lethee/generator-makdoc-blog): A Yeoman generator for blog

## License

MIT © [Changwoo Park](https://pismute.github.io/)

[npm-url]: https://npmjs.org/package/gulp-makdoc
[npm-image]: https://badge.fury.io/js/gulp-makdoc.svg
[daviddm-url]: https://david-dm.org/pismute/gulp-makdoc.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/pismute/gulp-makdoc
