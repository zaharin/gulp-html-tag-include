# gulp-html-tag-include
Gulp plugin for building HTML files into each other.

## Usage

### Install
```bash
npm install --save-dev gulp-html-tag-include
```

### options

* options - type: `object`
  - tagname: `string`, default `include`

### Sample `gulpfile.js`
Then, add it to your `gulpfile.js`:

```javascript
var gulp = require('gulp'),
	include = require('gulp-html-tag-include');

gulp.task('html-include', function() {
	gulp.src('./source/*.html')
		.pipe(include())
		.pipe(gulp.dest('./build/'));
});

gulp.task('watch', function() {
	gulp.watch(['./source/**/*.html'], function(event) {
		gulp.start('default');
	});
});

gulp.task('default', ['html-include']);
```

### Include
This is the simplest use case. Simply put the following html tag

`<include>filename.html</include>`

#### Example

`index.html`
```html
<include>header.html</include>
    content
<include>footer.html</include>
```

`header.html`
```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
```

`footer.html`
```html
</body>
</html>
```

Results
```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
</head>
<body>
    content
</body>
</html>
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)