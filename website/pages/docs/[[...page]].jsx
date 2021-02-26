import { productName, productSlug } from 'data/metadata'
import DocsPage from '@hashicorp/react-docs-page'
// TODO replace debug component with "Community Plugin" label
import DocsPageDebug from 'components/remote-plugin-docs/debug-component'
// Imports below are only used server-side
import fs from 'fs'
import path from 'path'
import {
  getNodeFromPath,
  getPathsFromNavData,
  validateNavData,
} from '@hashicorp/react-docs-page/server'
import renderPageMdx from '@hashicorp/react-docs-page/render-page-mdx'
import fetchGithubFile from 'components/remote-plugin-docs/utils/fetch-github-file'
import mergeRemotePlugins from 'components/remote-plugin-docs/utils/fetch-remote-plugin-data'
import resolveRemoteContent from 'components/remote-plugin-docs/utils/resolve-remote-content'

//  Configure the docs path
const MAIN_BRANCH = 'master' // overrides default "main" value
const BASE_ROUTE = 'docs'
const NAV_DATA = 'data/docs-nav-data.json'
const REMOTE_PLUGINS = 'data/docs-remote-plugins.json'
const CONTENT_DIR = 'content/docs'

function DocsLayout(props) {
  return (
    <div>
      <DocsPageDebug {...props} />
      <DocsPage
        baseRoute={BASE_ROUTE}
        mainBranch={MAIN_BRANCH}
        product={{ name: productName, slug: productSlug }}
        staticProps={props}
      />
    </div>
  )
}

export async function getStaticPaths() {
  const navData = await resolveNavData(NAV_DATA, REMOTE_PLUGINS, CONTENT_DIR)
  const paths = await getPathsFromNavData(navData)
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const navData = await resolveNavData(NAV_DATA, REMOTE_PLUGINS, CONTENT_DIR)
  const pathToMatch = params.page ? params.page.join('/') : ''
  const navNode = getNodeFromPath(pathToMatch, navData, CONTENT_DIR)
  const { filePath, remoteFile } = navNode
  const [err, mdxString] = filePath
    ? //  Read local content from the filesystem
      [null, fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')]
    : // Fetch remote content using GitHub's API
      await fetchGithubFile(remoteFile)
  if (err) throw new Error(err)
  const { mdxSource, frontMatter } = await renderPageMdx(mdxString, productName)
  // Build the currentPath from page parameters
  const currentPath = !params.page ? '' : params.page.join('/')
  return {
    props: { currentPath, frontMatter, mdxSource, navData, navNode },
  }
}

async function resolveNavData(navDataFile, remotePluginsFile, localContentDir) {
  // Read in files
  const navDataPath = path.join(process.cwd(), navDataFile)
  const navData = JSON.parse(fs.readFileSync(navDataPath, 'utf8'))
  const remotePluginsPath = path.join(process.cwd(), remotePluginsFile)
  const remotePlugins = JSON.parse(fs.readFileSync(remotePluginsPath, 'utf-8'))
  // Resolve plugins, this yields branches with NavLeafRemote nodes
  const withPlugins = await mergeRemotePlugins(remotePlugins, navData)
  // Resolve any NavBranchRemote nodes
  // TODO - technically not necessary, should remove
  // resolveRemoteContent may come in handy for future use cases
  const withRemotes = await resolveRemoteContent(withPlugins)
  // Resolve local filePaths for NavLeaf nodes
  const withFilePaths = await validateNavData(withRemotes, localContentDir)
  // Return the nav data with:
  // 1. Plugins merged, transformed into navData structures with NavLeafRemote nodes
  // 2. filePaths added to all local NavLeaf nodes
  return withFilePaths
}

export default DocsLayout
