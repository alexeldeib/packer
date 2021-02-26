const githubQuery = require('./github-query')

const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN

//  Fetch a file from GitHub using the GraphQL API
async function getGithubFile({ repo, branch, filePath }) {
  const [repo_owner, repo_name] = repo.split('/')
  //  Set up the GraphQL query
  // (would be kinda nice to have this in a separate file, if possible)
  const query = `
query($repo_name: String!, $repo_owner: String!, $object_expression: String!) {
  repository(name: $repo_name, owner: $repo_owner) {
    object(expression: $object_expression) {
      ... on Blob {
        text
      }
    }
  }
}
`
  //  Set variables
  const variables = {
    repo_name,
    repo_owner,
    object_expression: `${branch}:${filePath}`,
  }
  // Query the GitHub API, and parse the navigation data
  const result = await githubQuery({ query, variables }, GITHUB_API_TOKEN)
  try {
    const fileText = result.data.repository.object.text
    return [null, fileText]
  } catch (e) {
    const errorMsg = `Could not fetch remote file text from "${
      variables.object_expression
    }" in "${repo_owner}/${repo_name}". Received instead:\n\n${JSON.stringify(
      result,
      null,
      2
    )}`
    // console.warn(errorMsg)
    return [errorMsg, null]
  }
}

function memoize(method) {
  let cache = {}
  let queries = 0
  let cacheUses = 0
  let totalCalls = 0

  return async function () {
    let args = JSON.stringify(arguments[0])
    if (!cache[args]) {
      queries++
      totalCalls++
      console.log(
        `GH: New API query. ${JSON.stringify({
          queries,
          cacheUses,
          totalCalls,
        })}`
      )
      cache[args] = method.apply(this, arguments)
    } else {
      cacheUses++
      totalCalls++
      console.log(
        `GH: Used cache. ${JSON.stringify({
          queries,
          cacheUses,
          totalCalls,
        })}`
      )
    }
    return cache[args]
  }
}

module.exports = memoize(getGithubFile)
