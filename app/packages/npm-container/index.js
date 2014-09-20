  Meteor.npmRequire = function(moduleName) {                                             // 79
    var module = Npm.require(moduleName);                                                // 80
    return module;                                                                       // 81
  };                                                                                     // 82
                                                                                         // 83
  Meteor.require = function(moduleName) {                                                // 84
    console.warn('Meteor.require is deprecated. Please use Meteor.npmRequire instead!'); // 85
    return Meteor.npmRequire(moduleName);                                                // 86
  };                                                                                     // 87