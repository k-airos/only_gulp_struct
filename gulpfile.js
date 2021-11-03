let preprocessor = 'sass';
// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');
// Подключаем Browsersync
const browserSync = require('browser-sync').create();
// Подключаем gulp-concat
const concat = require('gulp-concat');
// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const del = require('del');
const addsrc = require('gulp-add-src');


// Обратите внимание, что название функции не должно совпадать с названием 
// переменной или константы, в которую мы подключаем пакет. Поэтому, в данном случае, название 
// функции browsersync() будет содержать только строчные буквы.

function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'src/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	});
}

function scripts() {
	return src([ // Берем файлы из источников
		// 'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки из node modules
		'src/js/*.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		'!src/js/src.min.js',
		])
	.pipe(concat('src.min.js')) // Конкатенируем в один файл
	.pipe(uglify()) // Сжимаем JavaScript
	.pipe(dest('src/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()); // Триггерим Browsersync для обновления страницы
}
function startwatch() {
 
	// Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
	watch(['src/**/*.js', '!src/**/*.min.js'], scripts);

	watch(['src/**/' + preprocessor + '/**/*','src/css/style.css'],styles);
	watch('src/**/*.html').on('change', browserSync.reload);
	watch('src/img/raw/**/*', images);
 
}
function styles() {
	return src('src/' + preprocessor + '/**/*.scss') 
	.pipe(sass()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(addsrc.append('src/css/style.css'))
	.pipe(concat('src.css')) 
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
	.pipe(dest('src/css/'))
	.pipe(concat('src.min.css'))
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	.pipe(dest('src/css/')) // Выгрузим результат в папку "src/css/"
	.pipe(browserSync.stream()); // Сделаем инъекцию в браузер
}

function images() {
	return src('src/img/raw/**/*') // Берем все изображения из папки источника
	.pipe(newer('src/img/optimized/**/*')) // Проверяем, было ли изменено (сжато) изображение ранее
	.pipe(imagemin()) // Сжимаем и оптимизируем изображеня
	.pipe(dest('src/img/optimized/**/*')); // Выгружаем оптимизированные изображения в папку назначения
}
function cleanimg() {
	return del('src/img/optimized/**/*', { force: true }); // Удаляем все содержимое папки "src/img/optimized/"
}
function buildcopy() {
	return src([ // Выбираем нужные файлы
		'src/css/**/*.min.css',
		'src/js/**/*.min.js',
		'src/img/optimized/**/*',
		'src/icons/**/*',
		'src/**/*.html',
		'src/fonts/*'
		], { base: 'src' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')); // Выгружаем в папку с финальной сборкой
}



// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.cleanimg = cleanimg;
exports.default = parallel(styles, scripts, browsersync, startwatch);
// Создаем новый таск "build", который последовательно выполняет нужные операции
exports.build = series(styles, scripts, images, buildcopy);
