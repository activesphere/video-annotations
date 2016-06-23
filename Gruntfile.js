module.exports = function (grunt) {
  grunt.initConfig({
    copy: {
      main: {
        files: [{
          expand: true,
          src: ['html/*', 'images/*', 'index.html', 'manifest.json'],
          dest: 'builds/extension',
        }, {
          expand: true,
          src: ['js/share_app/index.html'],
          dest: 'builds/share_app',
          flatten: true,
          filter: 'isFile',
        }, {
          expand: true,
          cwd: 'builds/extension/bundles/',
          src: ['commons.chunk.js', 'shareApp.bundle.js'],
          dest: 'builds/share_app/js/',
        }]
      }
    },

    clean: {
      contents: ['builds/extension/bundles/shareApp.bundle.js'],
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  
  grunt.registerTask('default', ['copy', 'clean']);
};
