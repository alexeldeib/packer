const fetch = require('isomorphic-unfetch')

async function githubQuery(body, token) {
  const result = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      ContentType: 'application/json',
    },
    body: JSON.stringify(body),
  })
  return await result.json()
}

module.exports = githubQuery
