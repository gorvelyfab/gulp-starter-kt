const path = require('path');

module.exports = {
  entry: {
    'app': path.resolve(__dirname, 'src/app.js')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production'
};
