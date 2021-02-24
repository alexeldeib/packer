require('dotenv').config()
const fs = require('fs')
const path = require('path')
const fetchGithubFile = require('../fetch-github-file')
const PLUGINS_FILE = 'data/_docs-remote-plugins.json'
const NAV_DATA_FILE = 'data/_docs-nav-data-migrated.json'

//
//
//

const COMPONENT_TYPES = [
  'builders',
  'datasources',
  'post-processors',
  'provisioners',
]

const navDataFile = path.join(process.cwd(), NAV_DATA_FILE)
const navDataJson = fs.readFileSync(navDataFile, 'utf-8')
const navDataPacker = JSON.parse(navDataJson, null, 2)
//
const pluginsFilePath = path.join(process.cwd(), PLUGINS_FILE)
const pluginsDataJson = fs.readFileSync(pluginsFilePath, 'utf-8')
const pluginsData = JSON.parse(pluginsDataJson, null, 2)
gatherRemotePlugins(pluginsData, navDataPacker)

async function gatherRemotePlugins(pluginsData, navData) {
  //
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
  console.log(navData)

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
