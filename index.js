var
    gutil    = require('gulp-util')
    , path   = require('path')
    , fs     = require('fs')
    , os     = require('os')
    , through = require('through2')
    , defaults = require('lodash.defaults')
    ;

var
    PluginError = gutil.PluginError
    , EOL = os.EOL
    ;

const
    PLUGIN_NAME = 'gulp-html-tag-include';

function gulpInclude(options) {
    var
        stream
        , content
        , tagOpen
        , tagClose
        , stackPath = []
        ;

    options = defaults(options || {}, { tagname: 'include' });
    tagOpen = '<' + options.tagname + '>';
    tagClose = '</' + options.tagname + '>';

    this.stackPath = [];

    function extractIncludeData(parentFilename, content) {
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

        posOpen = content.indexOf(tagOpen);
        if (posOpen > -1) {
            posClose = content.indexOf(tagClose, posOpen + tagOpen.length);

            if (posClose > -1) {
                found = true;
            }
        }

        if (!found) return;

        filename = content.substring(posOpen + tagOpen.length, posClose).trim();
        fullFilename = path.normalize(path.dirname(parentFilename) + path.sep + filename);

        if (!fs.existsSync(fullFilename))
            throw new PluginError(PLUGIN_NAME, 'File not found: ' + fullFilename);

        looping = stackPath.length > 1 && stackPath.indexOf(fullFilename) > -1;
        if (looping)
            throw new PluginError(PLUGIN_NAME, ['Looping include', EOL, 'Stack path:', EOL, stackPath.join(EOL)].join(''));

        contentTop = content.substring(0, posOpen);
        contentBottom = content.substring(posClose + tagClose.length);
        contentInclude = fs.readFileSync(fullFilename, { encoding: 'utf8' });

        return {
            filename: filename,
            fullFilename: fullFilename,
            contentTop: contentTop,
            contentBottom: contentBottom,
            contentInclude: contentInclude
        };
    }

    function processingContent(parentFilename, content) {
        var data;
        stackPath.push(parentFilename);

        data = extractIncludeData(parentFilename, content);
        while (data) {
            data.contentInclude = processingContent(data.fullFilename, data.contentInclude);

            content = data.contentTop + data.contentInclude + data.contentBottom;
            data = extractIncludeData(parentFilename, content);
        }

        stackPath.pop();
        return content;
    }

    stream = through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            // do nothing if no contents
        }

        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Stream content is not supported'));
            return cb();
        }

        if (file.isBuffer()) {
            try {
                content = processingContent(path.normalize(file.path), file.contents.toString('utf8'));

                if (typeof content === 'string' && content) {
                    file.contents = new Buffer(content);
                }
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