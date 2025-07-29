const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  webpack: (config, { isServer }) => {
    // Add rules for CSS and BPMN files
    config.module.rules.push(
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.bpmn$/,
        use: 'raw-loader',
      }
    );

    // Copy diagrams to public folder
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            { from: 'public/diagrams', to: 'diagrams' },
          ],
        })
      );
    }

    return config;
  },
};