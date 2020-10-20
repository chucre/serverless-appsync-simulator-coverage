This serverless plugin is a extension for [serverless-appsync-simulator](https://github.com/bboure/serverless-appsync-simulator) made for testing AppSync APIs built with [serverless-appsync-plugin](https://github.com/sid88in/serverless-appsync-plugin) that create report.

# Requires
- [serverless-appsync-simulator](https://github.com/bboure/serverless-appsync-simulator)
- [serverless framework](https://github.com/serverless/serverless)
- [serverless-appsync-plugin](https://github.com/sid88in/serverless-appsync-plugin)
- [serverless-offline](https://github.com/dherault/serverless-offline)
- [serverless-dynamodb-local](https://github.com/99xt/serverless-dynamodb-local) (when using dynamodb resolvers only)

# Install

````bash
npm install serverless-appsync-simulator-coverage
# or
yarn add serverless-appsync-simulator-coverage
````

# Usage

This plugin relies on your serverless yml file and on the `serverless-offline` plugin.

````yml
plugins:
  - serverless-dynamodb-local # only if you need dynamodb resolvers and you don't have an external dynamodb
  - serverless-appsync-simulator
  - serverless-appsync-simulator-coverage
  - serverless-offline
````

**Note:** Order is important `serverless-appsync-simulator-coverage` must go **before** `serverless-offline` and **after** `serverless-appsync-simulator`
