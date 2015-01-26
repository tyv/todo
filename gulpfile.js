var gulp = require('gulp'),
    tasks = ['riot',
                'riot-include',
                'build-js',
                'build-css',
                'watch',
                'start'
            ],
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer-core'),
    mqpacker = require('css-mqpacker'),
    csswring = require('csswring'),
    riot = require('gulp-riot'),
    gulpInclude = require('gulp-include'),
    ymBuilder = require('ym-builder').plugins,
    concatCSS = require('gulp-concat-css'),
    shell = require('gulp-shell'),

    SRC_DIR = './src/',

    OUTPUT_DIR = './public/',
    OUTPUT_JS = OUTPUT_DIR + 'javascripts/',
    OUTPUT_RIOT = SRC_DIR + 'riot-tags/',
    OUTPUT_CSS = OUTPUT_DIR + 'css/',

    PATH_CSS = SRC_DIR + 'css/' + '*.css',
    PATH_JS = SRC_DIR + 'js/' + '*.js',
    PATH_RIOT = SRC_DIR + 'riot-tags/' + '*.tag';

gulp.task('riot', function () {
    gulp.src(PATH_RIOT)
        .pipe(riot())
        .pipe(gulp.dest(OUTPUT_RIOT))
});

gulp.task('riot-include', function() {
    gulp.src(OUTPUT_RIOT + '/riot-tags-ym.js')
        .pipe(gulpInclude())
        .pipe(gulp.dest(SRC_DIR + '/js/'))
});

gulp.task('build-js', function() {
    var cfg = {
        concatTo: 'app.js',
        standalone: 'ym',
        minify: false
    };

    gulp.task('ym-clean', function () {
        ymBuilder.del(OUTPUT_JS, { force: true });
    });

    gulp.src(PATH_JS)
        .pipe(ymBuilder.modules.concat(cfg))
        .pipe(ymBuilder.modules.modularSystem(cfg))
        .pipe(ymBuilder.modules.closure())
        .pipe(gulp.dest(OUTPUT_JS))
});

gulp.task('build-css', function() {

    var processors = [
        autoprefixer({browsers: ['last 2 version']}),
        mqpacker,
        csswring({ preserveHacks: true })
    ];

    gulp.src(PATH_CSS)
        .pipe(concatCSS('bundle.css'))
        .pipe(postcss(processors))
        .pipe(gulp.dest(OUTPUT_CSS));
});

gulp.task('start', shell.task([
  'npm start'
]));

gulp.task('watch', function() {
    gulp.watch(SRC_DIR + 'css/**/*.css', ['build-css']);
    gulp.watch(PATH_JS, ['build-js']);
    gulp.watch(PATH_RIOT, ['riot', 'riot-include', 'build-js']);
});

gulp.task('default', tasks);