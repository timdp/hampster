import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import del from 'del'
import seq from 'run-sequence'

const DEST = 'lib'

const $ = loadPlugins()

const plumb = () => $.plumber({
  errorHandler: $.notify.onError('<%= error.message %>')
})

gulp.task('clean', () => del.sync(DEST))

gulp.task('transpile', () => {
  return gulp.src('src/**/*.js')
    .pipe(plumb())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(DEST))
})

gulp.task('lint', () => {
  return gulp.src('src/**/*.js')
    .pipe(plumb())
    .pipe($.standard())
    .pipe($.standard.reporter('default', {
      breakOnError: false
    }))
})

gulp.task('build', (cb) => seq('lint', 'transpile', cb))

gulp.task('cleanbuild', (cb) => seq('clean', 'build', cb))

gulp.task('watch', () => gulp.watch('src/**/*', ['cleanbuild']))

gulp.task('default', ['cleanbuild'], () => gulp.start('watch'))
