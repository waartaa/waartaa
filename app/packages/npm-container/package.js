  var path = Npm.require('path');                                                        // 91
  var fs = Npm.require('fs');                                                            // 92
                                                                                         // 93
  Package.describe({                                                                     // 94
    summary: 'Contains all your npm dependencies',                                       // 95
    version: '1.0.0',                                                                    // 96
    name: 'npm-container'                                                                // 97
  });                                                                                    // 98
                                                                                         // 99
  var packagesJsonFile = path.resolve('./packages.json');                                // 100
  try {                                                                                  // 101
    var fileContent = fs.readFileSync(packagesJsonFile);                                 // 102
    var packages = JSON.parse(fileContent.toString());                                   // 103
    Npm.depends(packages);                                                               // 104
  } catch(ex) {                                                                          // 105
    console.error('ERROR: packages.json parsing error [ ' + ex.message + ' ]');          // 106
  }                                                                                      // 107
                                                                                         // 108
  Package.onUse(function(api) {                                                          // 109
    api.add_files(['index.js', '../../packages.json'], 'server');                        // 110
  });                                                                                    // 111