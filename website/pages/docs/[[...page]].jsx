import { productName, productSlug } from 'data/metadata'
import DocsPage from '@hashicorp/react-docs-page'
// TODO replace debug component
// TODO add "Official" /  "Community" labels
import DocsPageDebug from 'components/remote-plugin-docs/debug-component'
import PluginTierLabel from 'components/plugin-tier-label'
// Imports below are only used server-side
import {
  generateStaticPaths,
  generateStaticProps,
} from 'components/remote-plugin-docs/server'

//  Configure the docs path
const BASE_ROUTE = 'docs'
const NAV_DATA = 'data/docs-nav-data.json'
const CONTENT_DIR = 'content/docs'
// override default "main" value for branch for "edit on this page"
const MAIN_BRANCH = 'master'
// add remote plugin docs loading
const OPTIONS = {
  remotePluginsFile: 'data/docs-remote-plugins.json',
  additionalComponents: { PluginTierLabel },
}

function DocsLayout(props) {
  return (
    <div>
      <DocsPageDebug {...props} />
      <DocsPage
        baseRoute={BASE_ROUTE}
        mainBranch={MAIN_BRANCH}
        product={{ name: productName, slug: productSlug }}
        staticProps={props}
        additionalComponents={OPTIONS.additionalComponents}
      />
    </div>
  )
}

export async function getStaticPaths() {
  const paths = await generateStaticPaths(NAV_DATA, CONTENT_DIR, OPTIONS)
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const props = await generateStaticProps(
    NAV_DATA,
    CONTENT_DIR,
    params,
    OPTIONS
  )
  return { props }
}

export default DocsLayout
