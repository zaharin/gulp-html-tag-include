var
    PluginError = require('gulp-util').PluginError
    , path   = require('path')
    , fs     = require('fs')
    , os     = require('os')
    , through = require('through2')
    ;

const
    PLUGIN_NAME = 'gulp-html-tag-include';

function getFileContent(file) {
    if (!fs.existsSync(file) )
        throw new PluginError(PLUGIN_NAME, 'File not found: ' + file);

    return fs.readFileSync(file, { encoding: 'utf8' });
}

function gulpInclude(options) {
    var
        stream
        , stackPath = []
        ;

    options = options || {};
    options.tagname = options.tagname || 'include';

    var DIRECTIVE_REGEXP = RegExp('<' + options.tagname + '>(\\S*)<\\/' + options.tagname + '>', 'gi');

    function processingContent(file, content) {
        var looping;

        looping = stackPath.indexOf(file) > -1;
        if (looping)
            throw new PluginError(PLUGIN_NAME, ['Looping include', os.EOL, 'Stack path:', os.EOL, stackPath.join(os.EOL)].join(''));

        stackPath.push(file);

        if (typeof content === 'undefined') {
            content = getFileContent(file);
        }

        content = content.replace(DIRECTIVE_REGEXP, function (match, fileInclude) {
            var fullFileInclude = path.normalize(path.dirname(file) + path.sep + fileInclude);
            return processingContent(fullFileInclude);
        });

        stackPath.pop();
        return content;
    }

    stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Stream content is not supported'));
            return cb();
        }

        if (file.isBuffer()) {
            try {
                var content = processingContent(path.normalize(file.path), file.contents.toString('utf8'));
                file.contents = new Buffer(content);
            } catch (err) {
                this.emit('error', new PluginError(PLUGIN_NAME, err));
            }
        }

        this.push(file);
        return cb();
    });

    return stream;
}

module.exports = gulpInclude;