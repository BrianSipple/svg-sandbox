var baseProjectURL;
if ( !!~getAbsoluteUrl().indexOf('www.sipple.io') ) {
  baseProjectURL = '/' + getProjectPrefix() + '/';
} else {
  baseProjectURL = '/';
}

System.config({
  "baseURL": baseProjectURL,
  "transpiler": "babel",
  "babelOptions": {
    "optional": [
      "runtime"
    ]
  },

  "paths": {
    "*": "*.js",
    "github:*": "vendor/github/*.js",
    "npm:*": "vendor/npm/*.js",
    "vendor": "vendor/",
    "views": "views/",
    "utils/*": "lib/utils/*.js"
  },


  "map": {
    "DrawSVGPlugin": "vendor/gsap/src/minified/plugins/DrawSVGPlugin.min",
    "EndArrayPlugin": "vendor/gsap/src/minified/plugins/EndArrayPlugin.min",
    "MorphSVGPlugin": "vendor/gsap/src/minified/plugins/MorphSVGPlugin.min",
    "Draggable": "vendor/gsap/src/minified/utils/Draggable.min",
    "TweenMax": "vendor/gsap/src/minified/TweenMax.min",
    "TweenLite": "vendor/gsap/src/minified/TweenLite.min",
    "babel": "npm:babel-core@5.8.22",
    "babel-runtime": "npm:babel-runtime@5.8.20",
    "core-js": "npm:core-js@0.9.18",
    "css": "github:systemjs/plugin-css@0.1.13",
    "modernizr": "github:Modernizr/Modernizr@2.8.3",
    "normalize.css": "github:necolas/normalize.css@3.0.3",
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "github:necolas/normalize.css@3.0.3": {
      "css": "github:systemjs/plugin-css@0.1.13"
    },
    "npm:babel-runtime@5.8.20": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    },
    "npm:core-js@0.9.18": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    }
  }

});
