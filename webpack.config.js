module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: {
          loader: 'less-loader',
          options: {
            lessOptions: {
              strictMath: true,
            }
          }
        }
      }
    ]
  }
}
