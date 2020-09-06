// glup project config
const gulp = require('gulp');
const glupTypescript = require('gulp-typescript');

const typescriptProject = glupTypescript.createProject("tsconfig.json");

gulp.task('default', function () {
  return typescriptProject.src()
    .pipe(typescriptProject())
    .js.pipe(gulp.dest("dist"));
});

gulp.watch('./index.ts', {
  events: 'all'
}, gulp.series('default'));

gulp.watch('./utils/**/*', {
  events: 'all'
}, gulp.series('default'));

gulp.watch('./lib/**/*', {
  events: 'all'
}, gulp.series('default'));