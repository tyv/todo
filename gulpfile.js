var gulp = require('gulp'),
    tasks = ['riot', 'file-include'],
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer-core'),
    mqpacker = require('css-mqpacker'),
    csswring = require('csswring'),
    riot = require('gulp-riot'),
    gulpInclude = require('gulp-include'),

    SRC_DIR = './src/',

    OUTPUT_DIR = './public/',
    OUTPUT_JS = OUTPUT_DIR + 'javascripts/',
    OUTPUT_RIOT = SRC_DIR + 'riot-tags/',
    OUTPUT_CSS = OUTPUT_DIR + 'css/',

    PATH_CSS = SRC_DIR + 'css/' + '*.css',
    PATH_RIOT = SRC_DIR + 'riot-tags/' + '*.tag';

gulp.task('riot', function () {
    gulp.src(PATH_RIOT)
        .pipe(riot())
        .pipe(gulp.dest(OUTPUT_RIOT))
});

gulp.task('file-include', function() {
    gulp.src(OUTPUT_RIOT + '/riot-tags-ym.js')
        .pipe(gulpInclude())
        .pipe(gulp.dest(SRC_DIR + '/js/'))
})


gulp.task('default', tasks);