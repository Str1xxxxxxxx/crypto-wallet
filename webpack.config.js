const path = require('path');

module.exports = {
  mode: 'production', // or 'development' for easier debugging
  entry: './background.js', // your background script entry point
  output: {
    filename: 'bundle.js', // bundled file output name
    path: path.resolve(__dirname, 'dist'),
  },
  // Ensure that webpack processes ES modules correctly.
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader', // optional: if you need to transpile code
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  } 
};
