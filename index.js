///<reference path="references.all.ts"/>
var PluginError = require('gulp-util').PluginError, path = require('path'), fs = require('fs'), os = require('os'), through = require('through2');
var GulpHtmlTagIncludePlugin = (function () {
    function GulpHtmlTagIncludePlugin(options) {
        this.stackPath = [];
        this.options = { tagName: 'include', autoIndent: true, prefixVar: '@@' };
        if (options) {
            this.options.tagName = options.tagName || this.options.tagName;
            this.options.autoIndent = options.autoIndent || this.options.autoIndent;
            this.options.prefixVar = options.prefixVar || this.options.prefixVar;
        }
        this.directiveRegexp = RegExp('<' + this.options.tagName + '\\s+([\\s\\S]*?)>([\\s\\S]*?)<\\/' + this.options.tagName + '>', 'gi');
    }
    GulpHtmlTagIncludePlugin.prototype.getFileContent = function (file) {
        if (!fs.existsSync(file))
            throw new PluginError(GulpHtmlTagIncludePlugin.PLUGIN_NAME, 'File not found: ' + file);
        return fs.readFileSync(file, { encoding: 'utf8' });
    };
    GulpHtmlTagIncludePlugin.prototype.execute = function (file, content) {
        this.stackPath = [];
        return this.processingContent({ src: path.basename(file), content: '' }, path.normalize(file), content);
    };
    GulpHtmlTagIncludePlugin.prototype.extractAttributes = function (attrs) {
        var attributeRegexp = /\s*(\S+)="([\s\S]*?)"/gi;
        var result = { src: '', content: '' };
        var match;
        while (match = attributeRegexp.exec(attrs)) {
            var attr = match[1] || '';
            var value = match[2] || '';
            if (attr)
                result[attr] = value;
        }
        return result;
    };
    GulpHtmlTagIncludePlugin.prototype.processingContent = function (attributes, parentFile, fileContent, indent) {
        if (!attributes.src) {
            throw new PluginError(GulpHtmlTagIncludePlugin.PLUGIN_NAME, 'Not specified attribute "src" in file "' + parentFile + '"');
        }
        var file = path.normalize(path.dirname(parentFile) + path.sep + attributes.src);
        //check looping
        if (this.stackPath.indexOf(file) > -1) {
            throw new PluginError(GulpHtmlTagIncludePlugin.PLUGIN_NAME, ['Looping include', os.EOL, 'Stack path:', os.EOL, this.stackPath.join(os.EOL)].join(''));
        }
        this.stackPath.push(file);
        if (typeof fileContent === 'undefined') {
            fileContent = this.getFileContent(file);
        }
        if (indent) {
            fileContent = fileContent.replace(/(\n|\r\n)(.+)/g, '$1' + indent + '$2');
        }
        fileContent = this.replaceAttributes(attributes, fileContent);
        fileContent = this.replaceInclude(file, fileContent);
        this.stackPath.pop();
        return fileContent;
    };
    GulpHtmlTagIncludePlugin.prototype.replaceAttributes = function (attributes, fileContent) {
        var varRegexp = RegExp(this.options.prefixVar + '(\\w+)', 'gi');
        return fileContent.replace(varRegexp, function (match, attr) {
            return attributes[attr] || '';
        });
    };
    GulpHtmlTagIncludePlugin.prototype.replaceInclude = function (parentFile, fileContent) {
        var _this = this;
        return fileContent.replace(this.directiveRegexp, function (match, attrs, content, offset) {
            var indent;
            var attributes = _this.extractAttributes(attrs);
            attributes.content = content;
            if (_this.options.autoIndent) {
                indent = _this.getIndent(fileContent, offset - 1);
            }
            return _this.processingContent(attributes, parentFile, undefined, indent);
        });
    };
    GulpHtmlTagIncludePlugin.prototype.getIndent = function (content, offset) {
        var result = '';
        while (offset >= 0) {
            var char = content[offset];
            if (char !== ' ' && char !== '\t')
                break;
            result += char;
            offset--;
        }
        return result;
    };
    GulpHtmlTagIncludePlugin.PLUGIN_NAME = 'gulp-html-tag-include';
    return GulpHtmlTagIncludePlugin;
})();
function gulpHtmlTagInclude(options) {
    var gulpPlugin = new GulpHtmlTagIncludePlugin(options);
    return through.obj(function (file, enc, cb) {
        var content;
        if (file.isStream()) {
            this.emit('error', new PluginError(GulpHtmlTagIncludePlugin.PLUGIN_NAME, 'Stream content is not supported'));
            return cb(null, file);
        }
        if (file.isBuffer()) {
            try {
                content = gulpPlugin.execute(file.path, file.contents.toString('utf8'));
                file.contents = new Buffer(content);
            }
            catch (err) {
                this.emit('error', new PluginError(GulpHtmlTagIncludePlugin.PLUGIN_NAME, err));
            }
        }
        this.push(file);
        return cb();
    });
}
module.exports = gulpHtmlTagInclude;
