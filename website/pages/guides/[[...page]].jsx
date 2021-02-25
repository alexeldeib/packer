import { productName, productSlug } from 'data/metadata'
// TODO: release stable DocsPage component and use that
import DocsPage from 'components/_temp-docs-page/docs-page-with-router'
// Imports below are only used server-side
import {
  generateStaticPaths,
  generateStaticProps,
} from 'components/_temp-docs-page/server'

//  Configure the docs path
const NAV_DATA = 'data/guides-nav-data.json'
const CONTENT_DIR = 'content/guides'

function DocsLayout(props) {
  const product = { name: productName, slug: productSlug }
  return <DocsPage product={product} staticProps={props} />
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
