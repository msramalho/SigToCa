const gulp = require('gulp')
const {
    src,
    series,
    parallel,
    watch
} = require('gulp');

const $ = require('gulp-load-plugins')()

// deployment type and target
// let production = process.env.NODE_ENV === "production";
let target = process.env.TARGET || "chrome";
let environment = process.env.NODE_ENV || "development";

// read target specific configurations
// let generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
// let specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
// let contextObject = Object.assign({}, generic, specific);


let manifestInfo = {
    dev: {
        "background": {
            "scripts": [
                "js/livereload.js",
            ]
        }
    },
    firefox: {
        "applications": {
            "gecko": {
                "id": "sigtools@msramalho.github.io"
            }
        }
    }
}

// Tasks
function cleanBuild() {
    // remove the build contents
    return src(`./build/${target}`, {
        read: false,
        allowEmpty: true
    }).pipe($.clean())
}

function cleanDist() {
    // remove the dist contents
    return src(`./dist/${target}`, {
        read: false,
        allowEmpty: true
    }).pipe($.clean())
}

function manifest() {
    // append specific info to manifest and place it in the target folder
    return src('./manifest.json')
        .pipe($.mergeJson({
            fileName: "manifest.json",
            jsonSpace: " ".repeat(4),
            endObj: target === "firefox" ? manifestInfo.firefox : manifestInfo.dev
        }))
        .pipe(gulp.dest(`./build/${target}`))
}

// Should there be a need for scss
// function styles() {
//     // convert scss to css in build folder
//     // return src('src/styles/**/*.scss')
//         .pipe(plumber())
//         .pipe($.sass.sync({
//             outputStyle: 'expanded',
//             precision: 10,
//             includePaths: ['.']
//         }).on('error', $.sass.logError))
//         .pipe(dest(`build/${target}/styles`))
// }

function mergeAll(done) {
    pipe('./src/css/**/*', `./build/${target}/css`)
    pipe('./src/extra/**/*', `./build/${target}/extra`)
    pipe('./src/icons/**/*', `./build/${target}/icons`)
    pipe('./src/js/**/*', `./build/${target}/js`)
    pipe(['./src/**/*.html'], `./build/${target}`)
    done()
}

function zip() {
    // zip all files in the target folder for dist
    return pipe(`./build/${target}/**/*`, $.zip(`${target}.zip`), './dist')
}

// watch for any changes in the source folder
function startWatching() {
    $.livereload.listen()
    watch(['./src/**/*']).on("change", () => {
        exports.build()
        $.livereload.reload()
    });
}

// Helpers
function pipe(src, ...transforms) {
    return transforms.reduce((stream, transform) => {
        const isDest = typeof transform === 'string'
        return stream.pipe(isDest ? gulp.dest(transform) : transform)
    }, gulp.src(src))
}

// Export tasks
exports.build = series(parallel(cleanBuild, cleanDist), parallel(manifest, mergeAll))
exports.dist = series(exports.build, zip)
exports.watch = startWatching
exports.default = exports.build;