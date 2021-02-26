import { productName, productSlug } from 'data/metadata'
import DocsPage from '@hashicorp/react-docs-page'
// Imports below are only used server-side
import {
  generateStaticPaths,
  generateStaticProps,
} from '@hashicorp/react-docs-page/server'

//  Configure the docs path
const BASE_ROUTE = 'intro'
const NAV_DATA = 'data/intro-nav-data.json'
const CONTENT_DIR = 'content/intro'
// override default "main" value for branch for "edit on this page"
const MAIN_BRANCH = 'master'

function DocsLayout(props) {
  return (
    <DocsPage
      baseRoute={BASE_ROUTE}
      mainBranch={MAIN_BRANCH}
      product={{ name: productName, slug: productSlug }}
      staticProps={props}
    />
  )
}

export async function getStaticPaths() {
  const paths = await generateStaticPaths(NAV_DATA, CONTENT_DIR)
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const props = await generateStaticProps(NAV_DATA, CONTENT_DIR, params)
  return { props }
}

export default DocsLayout
