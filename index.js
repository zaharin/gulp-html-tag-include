var
    gutil    = require('gulp-util')
    , stream = require('stream')
    , path   = require('path')
    , fs     = require('fs')
    , util   = require('util')
    , os     = require('os')
    , defaults = require('lodash.defaults')
    ;

var
    pluginName = 'gulp-html-tag-include';

function Include(options, transOptions) {
    if (!(this instanceof Include)) {
        return new Include(transOptions);
    }

    if (!transOptions) transOptions = {};
    transOptions.objectMode = true;
    stream.Transform.call(this, transOptions);

    this.options = defaults(options || {}, { tagName: 'include' });
    this.options.tagOpen = '<' + this.options.tagName + '>';
    this.options.tagClose = '</' + this.options.tagName + '>';

    this.stackPath = [];
}
util.inherits(Include, stream.Transform);

Include.prototype._transform = function (file, enc, cb) {
    var content;

    if (file.isNull()) {
        this.push(file);
        return cb();
    }

    if (file.isStream()) {
        this.emit('error', new gutil.PluginError(pluginName, 'Stream content is not supported'));
        return cb();
    }

    if (file.isBuffer) {
        content = this.processingContent(path.normalize(file.path), file.contents.toString('utf8'));

        if (typeof content === 'string' && content) {
            file.contents = new Buffer(content);
        }
    }

    this.push(file);
    cb();
};

Include.prototype.extractIncludeData = function (parentFilename, content) {
    var
        found = false
        , filename
        , fullFilename
        , contentTop
        , contentBottom
        , contentInclude
        , posOpen
        , posClose
        , looping
        ;

    if (!content) return;

    posOpen = content.indexOf(this.options.tagOpen);
    if (posOpen > -1) {
        posClose = content.indexOf(this.options.tagClose, posOpen + this.options.tagOpen.length);

        if (posClose > -1) {
            found = true;
        }
    }

    if (!found) return;

    filename = content.substring(posOpen + this.options.tagOpen.length, posClose).trim();
    fullFilename = path.normalize(path.dirname(parentFilename) + path.sep + filename);

    looping = this.stackPath.length > 1 && this.stackPath.indexOf(fullFilename) > -1;
    if (looping) {
        this.emit('error',
            new gutil.PluginError(pluginName, ['Looping include', os.EOL, 'Stack path:', os.EOL, this.stackPath.join(os.EOL)].join('') ));
    }

    contentTop = content.substring(0, posOpen);
    contentBottom = content.substring(posClose + this.options.tagClose.length);
    contentInclude = fs.readFileSync(fullFilename, { encoding: 'utf8' });

    return {
        filename: filename,
        fullFilename: fullFilename,
        contentTop: contentTop,
        contentBottom: contentBottom,
        contentInclude: contentInclude
    };
};

Include.prototype.processingContent = function (parentFilename, content) {
    var data;
    this.stackPath.push(parentFilename);

    data = this.extractIncludeData(parentFilename, content);
    while (data) {
        data.contentInclude = this.processingContent(data.fullFilename, data.contentInclude);

        content = data.contentTop + data.contentInclude + data.contentBottom;
        data = this.extractIncludeData(parentFilename, content);
    }

    this.stackPath.pop();
    return content;
};

module.exports = function (options) {
    return new Include(options);
};