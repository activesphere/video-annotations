module.exports = function (grunt) {
  grunt.initConfig({
    copy: {
      main: {
        files: [{
          expand: true,
          src: ['html/*', 'images/*', 'index.html', 'manifest.json'],
          dest: 'builds/'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default', ['copy']);
};