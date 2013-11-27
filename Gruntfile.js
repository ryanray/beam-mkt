module.exports = function(grunt) {

  //TODO: uglify JS

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Project configuration.
  grunt.initConfig({
    src: {
      all: [
        'Gruntfile.js', 'app.js', 'controllers/**/*.js', 'lib/**/*.js', 'models/**/*.js', 'test/**/*.js'
      ],
      client: [
        // ORDER MATTERS!
        // 'FED/src/templates/templates.js', 
        'FED/vendor/jquery.js', 
        'FED/vendor/bootstrap.js', 
        'FED/vendor/jquery.isotope.js', 
        'FED/vendor/jquery.prettyPhoto.js', 
        'FED/vendor/jquery.cslider.js', 
        'FED/vendor/filter.js', 
        'FED/vendor/cycle.js', 
        'FED/vendor/jquery.flexslider.min.js', 
        'FED/vendor/easing.js', 
        'FED/vendor/jade.runtime.js', 

        'FED/vendor/custom.js', 
        'FED/src/init.js'
      ]
    },
    jade: {
      client: {
        options: {
          client: true,
          compileDebug: false,
          amd: false
        },
        files: {
          "public/js/templates/templates.js": "views/**/*.jade"
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        strict: false,
        laxcomma: true,
        globals: {
          describe: false,
          it: false,
          suite: false,
          test: false,
          before: false,
          after: false
        }
      },
      all: {
        src: '<%= src.all %>'
      }
    },
    less: {
      production: {
        options: {
          // paths: ["assets/css"],
          cleancss: true
        },
        files: {
          "public/css/site.min.css": "FED/less/main.less"
        }
      }
    },
    uglify: {
      options: {
        mangle: false,
        // beautify: true
      },
      dist: {
        files: {
          'public/js/lib/site.1.0.0.min.js': '<%= src.client %>',
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: []
        },
        src: ['test/**/*.js']
      }
    },
    watch: {
      less: {
        files: 'FED/less/**/*.less',
        tasks: ['compileCSS']
      },
      server: {
        files: '<%= src.all %>',
        tasks: ['default']
      },
      client: {
        files: '<%= src.client %>',
        tasks: ['uglify']
      }
    }
  });

  grunt.registerTask('compileCSS', ['less']);

  grunt.registerTask('compileTemplates', ['jade', 'uglify']);

  grunt.registerTask('compileJS', ['uglify']);
  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest', 'jade', 'uglify', 'less']);
};