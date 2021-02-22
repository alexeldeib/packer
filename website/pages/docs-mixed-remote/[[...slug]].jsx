import { productName, productSlug } from 'data/metadata'
// TODO: release stable DocsPage component and use that
import DocsPage from 'components/_temp-docs-page'
// Imports below are only used server-side
import {
  generateStaticPaths,
  generateStaticProps,
} from 'components/_temp-docs-page/server'

//  Configure the docs path
const NAV_FILE = 'data/_docs-nav-data-migrated-with-remote.json'
const CONTENT_DIR = 'content/docs'
const DOCS_PRODUCT = { name: productName, slug: productSlug }

// Use shared components with configuration
function DocsRouteSupportRemoteContent(props) {
  return <DocsPage product={DOCS_PRODUCT} staticProps={props} />
}

export async function getStaticPaths() {
  const paths = await generateStaticPaths(NAV_FILE, CONTENT_DIR)
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const staticProps = await generateStaticProps(
    NAV_FILE,
    CONTENT_DIR,
    params.slug
  )
  return { props: { params, ...staticProps } }
}

export default DocsRouteSupportRemoteContent
