const path = require('path')
const fetchGithubFile = require('../fetch-github-file')
//
//
//

const COMPONENT_TYPES = [
  'builders',
  'datasources',
  'post-processors',
  'provisioners',
]

async function gatherRemotePlugins(pluginsData, navData) {
  //
  const allPluginData = await Promise.all(
    pluginsData.map(async (pluginEntry) => {
      return await Promise.all(
        COMPONENT_TYPES.map(async (type) => {
          const routes = await gatherPluginBranch(pluginEntry, type)
          const isSingleLeaf =
            routes.length === 1 && typeof routes[0].path !== 'undefined'
          const navData = isSingleLeaf
            ? { ...routes[0], path: path.join(type, pluginEntry.path) }
            : { title: pluginEntry.title, routes }
          return { type, navData }
        })
      )
    })
  )
  // TODO - match fetched plugin data to existing nav data
  // TODO - should slot into parts of tree based on component type
  // TODO - should error if slotting into tree would replace plugin
  // TODO - what should the title of the nested tree be?
  const allPluginsByType = allPluginData.reduce((acc, pluginData) => {
    pluginData.forEach((p) => {
      const { type, navData } = p
      if (!acc[type]) acc[type] = []
      acc[type].push(navData)
    })
    return acc
  }, {})

  const navDataWithPlugins = navData.slice().map((n) => {
    // we only care about top-level NavBranch nodes
    if (!n.routes) return n
    // for each component type, check if this NavBranch
    // is the parent route for that type
    for (var i = 0; i < COMPONENT_TYPES.length; i++) {
      const type = COMPONENT_TYPES[i]
      const isTypeRoute = n.routes.filter((nn) => nn.path === type).length > 0
      if (isTypeRoute) {
        // if this NavBranch is the parent route for the type,
        // then append all remote plugins of this type to the
        // NavBranch's child routes
        const routesWithPlugins = n.routes
          .slice()
          .concat(allPluginsByType[type])
        // console.log(JSON.stringify(routesWithPlugins, null, 2))
        // Also, sort the child routes so the order is alphabetical
        routesWithPlugins.sort((a, b) => {
          // (exception: "Overview" comes first)
          if (a.title == 'Overview') return -1
          if (b.title === 'Overview') return 1
          // (exception: "Community-Supported" comes last)
          if (a.title == 'Community-Supported') return 1
          if (b.title === 'Community-Supported') return -1
          // (exception: "Custom" comes secondlast)
          if (a.title == 'Custom') return 1
          if (b.title === 'Custom') return -1
          return a.title < b.title ? -1 : a.title > b.title ? 1 : 0
        })
        // return n
        return { ...n, routes: routesWithPlugins }
      }
    }
    return n
  })

  return navDataWithPlugins
}

async function gatherPluginBranch(pluginEntry, component) {
  const navDataFilePath = `${pluginEntry.artifactDir}/${component}/nav-data.json`
  const fileResult = await fetchGithubFile({
    repo: pluginEntry.repo,
    branch: pluginEntry.branch,
    filePath: navDataFilePath,
  })
  const navData = JSON.parse(fileResult)
  return prefixNavDataPath(
    navData,
    {
      repo: pluginEntry.repo,
      branch: pluginEntry.branch,
      componentArtifactsDir: path.join('.docs-artifacts', component),
    },
    path.join(component, pluginEntry.path)
  )
}

async function prefixNavDataPath(
  navData,
  { repo, branch, componentArtifactsDir },
  parentPath
) {
  return await Promise.all(
    navData.slice().map(async (navNode) => {
      if (typeof navNode.path !== 'undefined') {
        const prefixedPath = path.join(parentPath, navNode.path)
        const remoteFile = {
          repo,
          branch,
          filePath: path.join(componentArtifactsDir, navNode.filePath),
        }
        const withPrefixedRoute = {
          ...navNode,
          path: prefixedPath,
          remoteFile: remoteFile,
        }
        delete withPrefixedRoute.filePath
        return withPrefixedRoute
      }
      if (navNode.routes) {
        const prefixedRoutes = await prefixNavDataPath(
          navNode.routes,
          { repo, branch, componentArtifactsDir },
          parentPath
        )
        const withPrefixedRoutes = { ...navNode, routes: prefixedRoutes }
        return withPrefixedRoutes
      }
      return navNode
    })
  )
}

module.exports = gatherRemotePlugins
