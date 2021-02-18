import s from './style.module.css'
import DocsSidenav from '@hashicorp/react-docs-sidenav'
import { useRouter } from 'next/router'
// Only used in getStaticProps
import path from 'path'
import fs from 'fs'
import resolveRemoteContent from '@hashicorp/react-docs-sidenav/lib/resolve-remote-content'
import validateFilePaths from '@hashicorp/react-docs-sidenav/lib/validate-file-paths'
import validateRouteStructure from '@hashicorp/react-docs-sidenav/lib/validate-route-structure'
import fetchGithubFile from '@hashicorp/react-docs-sidenav/lib/fetch-github-file'

const NAV_DATA_PATH = 'data/_docs-nav-data.json'
const LOCAL_CONTENT_PATH = 'content/docs'

function SampleDocsPage({ params, navNode, rawMdx, navData }) {
  //  Get the root path, eg "docs", from next/router
  const router = useRouter()
  const routeParts = router.route.split('/')
  const rootPath = routeParts.slice(1, routeParts.length - 1).join('/')

  // Build the currentPath from slug parameters
  const currentPath = !params.slug ? '' : params.slug.join('/')

  const isRemoteContent = !!navNode.remoteFile
  const background = isRemoteContent ? 'aliceblue' : 'var(--gray-7)'
  const border = `1px solid ${isRemoteContent ? 'dodgerblue' : 'var(--gray-6)'}`

  return (
    <div className={s.container}>
      <div style={{ display: 'flex' }}>
        <DocsSidenav
          product="packer" // any Product slug, used for theming
          rootPath={rootPath} // root URL path for content, eg "docs"
          currentPath={currentPath} // active path, relative to rootPath
          navData={navData} // the navData
        />

        <div style={{ width: '0', flexGrow: 1 }}>
          <p style={{ background, border, padding: '1rem' }}>
            {isRemoteContent ? '📡 Remote Content' : '💼 Local Content'}
          </p>

          <pre>
            <code>
              // route data
              <br />
              <br />
              {JSON.stringify(
                {
                  LOCAL_CONTENT_PATH,
                  rootPath,
                  currentPage: `/${rootPath}/${currentPath}`,
                  params,
                },
                null,
                2
              )}
              <br />
              <br />
              <br />
              // nav node
              <br />
              <br />
              {JSON.stringify(navNode, null, 2)}
            </code>
          </pre>

          <pre>
            <code>{JSON.stringify(navData, null, 2)}</code>
          </pre>

          <pre>
            <code>{rawMdx}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  // Fetch and parse navigation data
  const navData = await readNavData(NAV_DATA_PATH)
  //  Transform navigation data into path arrays
  const pagePathArrays = getPathArraysFromNodes(navData)
  // Include an empty array for the "/" index page path
  const allPathArrays = [[]].concat(pagePathArrays)
  const paths = allPathArrays.map((p) => ({ params: { slug: p } }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  //  Read in the nav data
  const navData = await readNavData(NAV_DATA_PATH)
  //  Get the navNode that matches this path
  const navNode = getNodeFromPathArray(params.slug, navData)
  //  Get the page content
  const { filePath, remoteFile } = navNode
  const rawMdx = filePath
    ? //  Read local content from the filesystem
      fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')
    : // Fetch remote content using GitHub's API
      await fetchGithubFile(remoteFile)
  return {
    props: {
      params,
      navData,
      navNode,
      rawMdx,
    },
  }
}

async function readNavData(filePath) {
  const navDataFile = path.join(process.cwd(), filePath)
  const navData = JSON.parse(fs.readFileSync(navDataFile, 'utf8'))
  // Note: remote content must be resolved before validating navData
  const withRemotes = await resolveRemoteContent(navData)
  const withFilePaths = await validateFilePaths(withRemotes, LOCAL_CONTENT_PATH)
  const withValidStructure = validateRouteStructure(withFilePaths)
  // Return the resolved, validated navData
  return withValidStructure
}

function getNodeFromPathArray(pathArray, navData) {
  // If there is no path array, we return a
  // constructed "home page" node. This is just to
  // provide authoring convenience to not have to define
  // this node. However, we could ask for this node to
  // be explicitly defined in `navData` (and if it isn't,
  // then we'd render a 404 for the root path)
  const isLandingPage = !pathArray || pathArray.length === 0
  if (isLandingPage) {
    return {
      filePath: path.join(LOCAL_CONTENT_PATH, 'index.mdx'),
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

export default SampleDocsPage
