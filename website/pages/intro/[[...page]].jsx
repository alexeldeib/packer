import { productName, productSlug } from 'data/metadata'
import DocsPage from '@hashicorp/react-docs-page'
// Imports below are only used server-side
import {
  generateStaticPaths,
  generateStaticProps,
} from '@hashicorp/react-docs-page/server'

//  Configure the docs path
const MAIN_BRANCH = 'master' // overrides default "main" value
const BASE_ROUTE = 'intro'
const NAV_DATA = 'data/intro-nav-data.json'
const CONTENT_DIR = 'content/intro'

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
  const staticProps = await generateStaticProps(NAV_DATA, CONTENT_DIR, params)
  return { props: { ...staticProps } }
}

export default DocsLayout
