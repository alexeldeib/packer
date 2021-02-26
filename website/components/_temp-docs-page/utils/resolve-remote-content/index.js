const fetchGithubFile = require('../fetch-github-file')

async function resolveRemoteContent(navNodes) {
  return await Promise.all(navNodes.slice(0).map(resolveNode))
}

async function resolveRemoteTree(navNodes, { repo, branch, parentPath }) {
  return await Promise.all(
    navNodes.map(async (navNode) => {
      //  Handle remote leaf nodes
      if (typeof navNode.path !== 'undefined' && !navNode.remoteFile) {
        if (!navNode.filePath) {
          throw new Error(
            'Missing filePath in remote content node. A filePath must be explicitly added to all remote content nodes. For now, this must be done manually by authors with access to the remote content repo. In the future we hope to do this automatically, perhaps through a GitHub action in the remote content repository.'
          )
        }
        // Handle special "index" file case, where the path is an empty string
        const isIndex = navNode.path === ''
        const nestedPath = isIndex
          ? parentPath
          : `${parentPath}/${navNode.path}`
        // Return the leaf node, now formatted as a "remote file"
        return {
          title: navNode.title,
          path: nestedPath,
          remoteFile: { repo, branch, filePath: navNode.filePath },
        }
      }
      // Handle remote branch nodes
      if (navNode.routes) {
        const resolvedRoutes = await resolveRemoteTree(navNode.routes, {
          repo,
          branch,
          parentPath,
        })
        return { ...navNode, routes: resolvedRoutes }
      }
      // All other nodes can be returned unmodified
      return navNode
    })
  )
}

async function resolveNode(navNode) {
  // Handle remote branch nodes, filling in
  // all of their descendent routes with the necessary
  // data to transform them into REMOTE NavLeaf nodes
  if (navNode.remoteRoutes) {
    const { repo, branch, filePath } = navNode.remoteRoutes
    const [err, remoteNavData] = JSON.parse(
      await fetchGithubFile({ repo, branch, filePath })
    )
    if (err) throw new Error(err)
    const remoteRoutes = await resolveRemoteTree(remoteNavData, {
      repo,
      branch,
      parentPath: navNode.path,
    })
    return { title: navNode.title, routes: remoteRoutes }
  }
  // Handle branch nodes, which may contain nested remote branches
  if (navNode.routes) {
    const resolvedRoutes = await resolveRemoteContent(navNode.routes)
    return { ...navNode, routes: resolvedRoutes }
  }
  // All other nodes can be returned unmodified
  return navNode
}

module.exports = resolveRemoteContent
