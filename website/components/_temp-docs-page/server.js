import path from 'path'
import fs from 'fs'
import validateFilePaths from '@hashicorp/react-docs-sidenav/utils/validate-file-paths'
import validateRouteStructure from '@hashicorp/react-docs-sidenav/utils/validate-route-structure'
import resolveRemoteContent from './utils/resolve-remote-content'
import fetchGithubFile from './utils/fetch-github-file'
import mergeRemotePlugins from './utils/fetch-remote-plugin-data'

async function generateStaticPaths(
  navDataPath,
  localContentPath,
  remotePluginsDataPath
) {
  // Fetch and parse navigation data
  const navData = await readNavData(
    navDataPath,
    localContentPath,
    remotePluginsDataPath
  )
  //  Transform navigation data into path arrays
  const pagePathArrays = getPathArraysFromNodes(navData)
  // Include an empty array for the "/" index page path
  const allPathArrays = [[]].concat(pagePathArrays)
  const paths = allPathArrays.map((p) => ({ params: { slug: p } }))
  return paths
}

async function generateStaticProps(
  navDataPath,
  localContentPath,
  pathParts,
  remotePluginsDataPath
) {
  //  Read in the nav data
  const navData = await readNavData(
    navDataPath,
    localContentPath,
    remotePluginsDataPath
  )
  //  Get the navNode that matches this path
  const navNode = getNodeFromPathArray(pathParts, navData, localContentPath)
  //  Get the page content
  const { filePath, remoteFile } = navNode
  const rawMdx = filePath
    ? //  Read local content from the filesystem
      fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')
    : // Fetch remote content using GitHub's API
      await fetchGithubFile(remoteFile)
  return { navData, navNode, rawMdx }
}

async function readNavData(filePath, localContentPath, remotePluginsFilePath) {
  const navDataFile = path.join(process.cwd(), filePath)
  const navData = JSON.parse(fs.readFileSync(navDataFile, 'utf8'))
  //  Note: remote plugins must be resolved before everything else
  const remotePluginsFile = remotePluginsFilePath
    ? path.join(process.cwd(), remotePluginsFilePath)
    : null
  const remotePluginsData = remotePluginsFilePath
    ? JSON.parse(fs.readFileSync(remotePluginsFile, 'utf-8'))
    : []
  const withRemotePlugins = remotePluginsFilePath
    ? await mergeRemotePlugins(remotePluginsData, navData)
    : navData
  // Note: remote content must be resolved before validating navData
  const withRemotes = await resolveRemoteContent(withRemotePlugins)
  const withFilePaths = await validateFilePaths(withRemotes, localContentPath)
  // Note: validateRouteStructure returns navData with additional __stack properties,
  // which detail the path we've inferred for each branch and node
  // (branches do not have paths defined explicitly, so we need to infer them)
  // We don't actually need the __stack properties for rendering, they're just
  // used in validation, so we don't use the output of this function.
  validateRouteStructure(withFilePaths)
  // Return the resolved, validated navData
  return withFilePaths
}

function getNodeFromPathArray(pathArray, navData, localContentPath) {
  // If there is no path array, we return a
  // constructed "home page" node. This is just to
  // provide authoring convenience to not have to define
  // this node. However, we could ask for this node to
  // be explicitly defined in `navData` (and if it isn't,
  // then we'd render a 404 for the root path)
  const isLandingPage = !pathArray || pathArray.length === 0
  if (isLandingPage) {
    return {
      filePath: path.join(localContentPath, 'index.mdx'),
    }
  }
  //  If it's not a landing page, then we search
  // through our navData to find the node with a path
  // that matches the pathArray we're looking for.
  function flattenRoutes(nodes) {
    return nodes.reduce((acc, n) => {
      if (!n.routes) return acc.concat(n)
      return acc.concat(flattenRoutes(n.routes))
    }, [])
  }
  const allNodes = flattenRoutes(navData)
  const pathToMatch = pathArray.join('/')
  const matches = allNodes.filter((n) => n.path === pathToMatch)
  // Throw an error for missing files - if this happens,
  // we might have an issue with `getStaticPaths` or something
  if (matches.length === 0) {
    throw new Error(`Missing resource to match "${pathToMatch}"`)
  }
  // Throw an error if there are multiple matches
  // If this happens, there's likely an issue in the
  // content source repo
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous path matches for "${pathToMatch}". Found:\n\n${JSON.stringify(
        matches
      )}`
    )
  }
  //  Otherwise, we have exactly one match,
  //  and we can return the filePath off of it
  return matches[0]
}

function getPathArraysFromNodes(navNodes) {
  const slugs = navNodes.reduce((acc, navNode) => {
    // Individual items have a path, these should be added
    if (navNode.path) return acc.concat([navNode.path.split('/')])
    // Category items have child routes, these should all be added
    if (navNode.routes)
      return acc.concat(getPathArraysFromNodes(navNode.routes))
    // All other node types (dividers, external links) can be ignored
    return acc
  }, [])
  return slugs
}

export { generateStaticPaths, generateStaticProps }
