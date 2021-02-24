require('dotenv').config()
const fs = require('fs')
const path = require('path')
const fetchGithubFile = require('../fetch-github-file')
const PLUGINS_FILE = 'data/_docs-remote-plugins.json'

//
//
//

const COMPONENT_TYPES = [
  'builders',
  'datasources',
  'post-processors',
  'provisioners',
]

const pluginsFilePath = path.join(process.cwd(), PLUGINS_FILE)
const pluginsDataJson = fs.readFileSync(pluginsFilePath, 'utf-8')
const pluginsData = JSON.parse(pluginsDataJson, null, 2)
gatherRemotePlugins(pluginsData)

async function gatherRemotePlugins(pluginsData) {
  const allPluginData = await Promise.all(
    pluginsData.map(async (pluginEntry) => {
      return await Promise.all(
        COMPONENT_TYPES.map(async (type) => {
          return { type, navData: await gatherPluginBranch(pluginEntry, type) }
        })
      )
    })
  )
  // TODO - match fetched plugin data to existing nav data
  // TODO - should slot into parts of tree based on component type
  // TODO - should error if slotting into tree would replace plugin
  // TODO - what should the title of the nested tree be?
  console.log(allPluginData)
  return true
}

async function gatherPluginBranch(pluginEntry, component) {
  const { repo, branch, artifactDir } = pluginEntry
  const navDataFilePath = `${artifactDir}/${component}/nav-data.json`
  const fileResult = await fetchGithubFile({
    repo,
    branch,
    filePath: navDataFilePath,
  })
  const navData = JSON.parse(fileResult)
  return navData
}
