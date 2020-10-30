module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'reports/coverage',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'jest-report.xml'
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'reports/jest',
        pageTitle: 'Jest Report',
        filename: 'index.html',
        expand: true
      }
    ]
  ]
}
