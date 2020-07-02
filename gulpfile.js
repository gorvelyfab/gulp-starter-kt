/**
 * A simple Gulp 4 Starter Kit for modern web development.
 *
 * @package @jr-cologne/create-gulp-starter-kit
 * @author JR Cologne <kontakt@jr-cologne.de>
 * @copyright 2020 JR Cologne
 * @license https://github.com/jr-cologne/gulp-starter-kit/blob/master/LICENSE MIT
 * @version v0.10.14-beta
 * @link https://github.com/jr-cologne/gulp-starter-kit GitHub Repository
 * @link https://www.npmjs.com/package/@jr-cologne/create-gulp-starter-kit npm package site
 *
 * ________________________________________________________________________________
 *
 * gulpfile.js
 *
 * The gulp configuration file.
 *
 */

const gulp                      = require('gulp'),
      del                       = require('del'),
      rev                       = require('gulp-rev'),
      sourcemaps                = require('gulp-sourcemaps'),
      plumber                   = require('gulp-plumber'),
      rename                    = require('gulp-rename'),
      sass                      = require('gulp-sass'),
      autoprefixer              = require('gulp-autoprefixer'),
      minifyCss                 = require('gulp-clean-css'),
      babel                     = require('gulp-babel'),
      webpack                   = require('webpack-stream'),
      uglify                    = require('gulp-uglify'),
      concat                    = require('gulp-concat'),
      imagemin                  = require('gulp-imagemin'),
      browserSync               = require('browser-sync').create(),
      dependents                = require('gulp-dependents'),
      revRewrite                = require('gulp-rev-rewrite'),
      nunjucks                  = require('gulp-nunjucks'),

      src_folder                = './src/',
      src_assets_folder         = src_folder + 'assets/',
      dist_folder               = './dist/',
      dist_assets_folder        = dist_folder + 'assets/',
      node_modules_folder       = './node_modules/',
      dist_node_modules_folder  = dist_folder + 'node_modules/',

      node_dependencies         = Object.keys(require('./package.json').dependencies || {})

gulp.task('clear', () => del([ dist_folder ]))

gulp.task('html', () => {
  return gulp.src(['./templates/**/*.html'], {
    base: './templates',
    since: gulp.lastRun('html')
  })
    .pipe(gulp.dest(dist_folder))
    .pipe(browserSync.stream())
})

gulp.task('nunjucks', () => {
  return gulp.src(['./templates/*.twig' ], {
    base: './templates/',
    since: gulp.lastRun('nunjucks')
  })
    .pipe(plumber())
    .pipe(nunjucks.compile())
    .pipe(gulp.dest(dist_folder))
    .pipe(browserSync.stream())
})

gulp.task('rename', () => {
  return gulp.src('./dist/*.html.twig')
    .pipe(rename((path) => {
      path.extname = ''
      return path
    }))
    .pipe(gulp.dest(dist_folder))
})

gulp.task('del-rename', () => {
  return del(['./dist/*.html.twig'])
})

gulp.task('sass', () => {
  return gulp.src([
    './style/*.sass',
    './style/*.scss',
    './style/pages/*.sass',
    './style/pages/*.scss',
  ], { since: gulp.lastRun('sass') })
    .pipe(sourcemaps.init())
      .pipe(plumber())
      .pipe(dependents())
      .pipe(sass())
      .pipe(autoprefixer())
      .pipe(minifyCss())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist_folder + 'assets/css'))
    .pipe(browserSync.stream())
})

gulp.task('js', () => {
  return gulp.src(['./src/**/*.js' ], { since: gulp.lastRun('js') })
    .pipe(plumber())
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: [ '@babel/env' ]
    }))
      // .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist_folder + 'assets/js'))
    .pipe(browserSync.stream())
})

gulp.task('images', () => {
  return gulp.src(['./assets/img/**/*.+(png|jpg|jpeg|gif|svg|ico)' ], { since: gulp.lastRun('images') })
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest(dist_assets_folder + 'img'))
    .pipe(browserSync.stream())
})

gulp.task('rev', () => {
  return gulp.src(['./dist/assets/**/*.*'], { base: 'dist' })
    .pipe(rev())
    .pipe(gulp.dest(dist_folder))
    .pipe(rev.manifest('manifest.json'))
    .pipe(gulp.dest(dist_folder))
})

gulp.task('rev-rewrite', () => {
  const manifest = gulp.src('./dist/manifest.json')

  return gulp.src('./dist/**/*.html')
    .pipe(revRewrite({ manifest }))
    .pipe(gulp.dest(dist_folder))
})

// gulp.task('vendor', () => {
//   if (node_dependencies.length === 0) {
//     return new Promise((resolve) => {
//       console.log("No dependencies specified")
//       resolve()
//     })
//   }

//   return gulp.src(node_dependencies.map(dependency => node_modules_folder + dependency + '/**/*.*'), {
//     base: node_modules_folder,
//     since: gulp.lastRun('vendor')
//   })
//     .pipe(gulp.dest(dist_node_modules_folder))
//     .pipe(browserSync.stream())
// })

gulp.task('build', gulp.series('clear', 'html', 'nunjucks', 'sass', 'js', 'images', 'rev', 'rename', 'del-rename', 'rev-rewrite'))

gulp.task('dev', gulp.series('html', 'nunjucks', 'sass', 'js', 'rev', 'rename', 'del-rename', 'rev-rewrite'))

gulp.task('serve', () => {
  return browserSync.init({
    server: {
      baseDir: [ 'dist' ]
    },
    port: 3000,
    open: false
  })
})

gulp.task('watch', () => {
  const watchImages = [
    './assets/img/**/*.+(png|jpg|jpeg|gif|svg|ico)'
  ]

  const watchVendor = []

  node_dependencies.forEach(dependency => {
    watchVendor.push(node_modules_folder + dependency + '/**/*.*')
  })

  const watch = [
    './templates/**/*.html',
    './templates/**/*.twig',
    './style/sass/**/*.sass',
    './style/scss/**/*.scss',
    './src/js/**/*.js'
  ]

  gulp.watch(watch, gulp.series('dev')).on('change', browserSync.reload)
  gulp.watch(watchImages, gulp.series('images')).on('change', browserSync.reload)
})

gulp.task('default', gulp.series('build', gulp.parallel('serve', 'watch')))
