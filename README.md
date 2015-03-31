# gulp-html-tag-include
Gulp plugin for building HTML files into each other.

## Usage

### Install
```bash
npm install --save-dev gulp-html-tag-include
```

### options

* options - type: `object`
  - tagName: `string`, default `include`
  - autoIndent: `boolean`, default `true`
  - prefixVar: `string`, default `@@`

### Sample `gulpfile.js`
Then, add it to your `gulpfile.js`:

```javascript
var gulp = require('gulp'),
	include = require('gulp-html-tag-include');

gulp.task('html-include', function() {
	return gulp.src('./source/index.html')
		.pipe(include())
		.pipe(gulp.dest('./build/'));
});

gulp.task('watch', ['html-include'], function() {
	gulp.watch('./source/**/*.html', ['html-include']);
});

gulp.task('default', ['watch']);
```

### Include
This is the simplest use case. Simply put the following html tag

`<include src="filename.html" [varname="string"]>[content]</include>`

#### Example 1

`<include src="filename.html" label="Lorem ipsum dolor sit amet"><input type="text" /></include>`

`filename.html`
```html
<label>@@label: @@content</label>
```

Results
```html
<label>Lorem ipsum dolor sit amet: <input type="text" /></label>
```

#### Example 2

`index.html`
```html
<include src="header.html" title="Example include"></include>
<include src="tabs.html"></include>
<include src="footer.html"></include>
```

`header.html`
```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>@@title</title>
</head>
<body>
```

`tabs.html`
```html
<div class="tabs">
	<include src="tabs-nav.html"></include>
	<include src="tabs-panels.html"></include>
</div>
```

`tabs-nav.html`
```html
<ul class="tabs-nav">
	<include src="tabs-nav-item.html" caption="tab 1" active="active"></include>
	<include src="tabs-nav-item.html" caption="tab 2"></include>
	<include src="tabs-nav-item.html" caption="tab 3"></include>
</ul>
```

`tabs-nav-item.html`
```html
<li class="@@active"><a href="#">@@caption</a></li>
```

`tabs-panels.html`
```html
<div class="tabs-panels">
	<include src="tabs-panel.html"><p>content tab 1</p></include>
	<include src="tabs-panel.html"><p>content tab 2</p></include>
	<include src="tabs-panel.html"><p>content tab 3</p></include>
</div>
```

`tabs-panel.html`
```html
<div class="tabs-panel">@@content</div>
```

`footer.html`
```html
</body>
</html>
```

Results
```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>Example include</title>
</head>
<body>
<div class="tabs">
	<ul class="tabs-nav">
		<li class="active"><a href="#">tab 1</a></li>
		<li class=""><a href="#">tab 2</a></li>
		<li class=""><a href="#">tab 3</a></li>
	</ul>
	<div class="tabs-panels">
		<div class="tabs-panel"><p>content tab 1</p></div>
		<div class="tabs-panel"><p>content tab 2</p></div>
		<div class="tabs-panel"><p>content tab 3</p></div>
	</div>
</div>
</body>
</html>
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)