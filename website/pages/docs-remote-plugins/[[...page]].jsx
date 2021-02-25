import { productName, productSlug } from 'data/metadata'
// TODO: release stable DocsPage component and use that
import DocsPageDebug from 'components/_temp-docs-page/debug-component'
import DocsPage from 'components/_temp-docs-page/docs-page-with-router'
// Imports below are only used server-side
import fs from 'fs'
import path from 'path'
import {
  getNodeFromPath,
  getPathsFromNavData,
  validateNavData,
} from 'components/_temp-docs-page/server'
import fetchGithubFile from 'components/_temp-docs-page/utils/fetch-github-file'
import mergeRemotePlugins from 'components/_temp-docs-page/utils/fetch-remote-plugin-data'
import resolveRemoteContent from 'components/_temp-docs-page/utils/resolve-remote-content'
import renderPageMdx from 'components/_temp-docs-page/render-page-mdx'

//  Configure the docs path
const NAV_DATA = 'data/docs-nav-data.json'
const REMOTE_PLUGINS = 'data/docs-remote-plugins.json'
const CONTENT_DIR = 'content/docs'

function DocsWithRemotePlugins({
  currentPath,
  frontMatter,
  mdxSource,
  navData,
  navNode,
}) {
  const product = { name: productName, slug: productSlug }
  return (
    <div>
      <DocsPageDebug frontMatter={frontMatter} navNode={navNode} />
      <DocsPage
        product={product}
        staticProps={{ currentPath, frontMatter, mdxSource, navData }}
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
  const mdxString = filePath
    ? //  Read local content from the filesystem
      fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')
    : // Fetch remote content using GitHub's API
      await fetchGithubFile(remoteFile)
  const { mdxSource, frontMatter } = await renderPageMdx(mdxString, productName)
  // Build the currentPath from page parameters
  const currentPath = !params.page ? '' : params.page.join('/')
  return {
    props: { currentPath, frontMatter, mdxSource, navData, navNode },
  }
}

async function resolveNavData(
  navDataFile,
  remotePluginsFile,
  localContentPath
) {
  const localNavData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), navDataFile), 'utf8')
  )
  const remotePlugins = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), remotePluginsFile), 'utf-8')
  )
  const withPlugins = await mergeRemotePlugins(remotePlugins, localNavData)
  const withRemotes = await resolveRemoteContent(withPlugins)
  const withFilePaths = await validateNavData(withRemotes, localContentPath)
  return withFilePaths
}

export default DocsWithRemotePlugins
