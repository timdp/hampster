#!/usr/bin/env node

import 'source-map-support/register'
import stamp from 'console-stamp'
import crossSpawn from 'cross-spawn-promise'
import got from 'got'
import isUrl from 'is-url'
import yaml from 'js-yaml'
import yargs from 'yargs'
import fsp from 'fs-promise'
import path from 'path'
import url from 'url'

stamp(console)

const root = process.cwd()

const argv = yargs
  .demand(1)
  .boolean('pull')
  .argv

let config

const spawn = async (cmd, args, cwd) => {
  console.info('Running', cmd, ...args, 'in', cwd, '...')
  try {
    await crossSpawn(cmd, args, {cwd})
  } catch (err) {
    if (err.stderr) {
      console.error(err.stderr.toString())
    }
    throw err
  }
}

const isDir = async (dirPath) => {
  let stats
  try {
    stats = await fsp.stat(dirPath)
  } catch (err) {}
  return (stats != null && stats.isDirectory())
}

const cloneOrPull = async ({name, repository}) => {
  const dirPath = path.join(root, name)
  const exists = await isDir(dirPath)
  if (!exists) {
    console.info('Cloning', name, '...')
    await spawn('git', ['clone', repository], root)
  } else if (argv.pull) {
    console.info('Updating', name, '...')
    await spawn('git', ['pull'], dirPath)
  } else {
    console.info(name, 'already exists, not cloning')
  }
}

const getDependencies = async () => {
  const deps = Object.create(null)
  const pkgs = Object.create(null)
  for (const {name} of config.packages) {
    pkgs[name] = true
  }
  for (const {name} of config.packages) {
    const pkgJsonPath = path.join(root, name, 'package.json')
    const pkgJson = await fsp.readJson(pkgJsonPath)
    deps[name] = Object.keys(pkgJson.dependencies || {})
      .filter((str) => pkgs[str])
  }
  return deps
}

const determinePackageToInstall = (deps, installed) => {
  return Object.keys(deps).find((pkg) => {
    return (deps[pkg].filter((dep) => !installed[dep]).length === 0)
  })
}

const install = async (pkg, deps) => {
  const pkgPath = path.join(root, pkg)
  if (deps.length > 0) {
    console.info('Linking', pkg, 'dependencies ...')
    await spawn('npm', ['link', ...deps], pkgPath)
  } else {
    console.info(pkg, 'has no linked dependencies')
  }
  console.info('Installing', pkg, '...')
  await spawn('npm', ['install'], pkgPath)
  console.info('Linking', pkg, '...')
  await spawn('npm', ['link'], pkgPath)
}

const installAll = async (deps) => {
  const installed = Object.create(null)
  let pkg = determinePackageToInstall(deps, installed)
  while (pkg != null) {
    await install(pkg, deps[pkg])
    installed[pkg] = true
    delete deps[pkg]
    pkg = determinePackageToInstall(deps, installed)
  }
}

const checkResult = (deps) => {
  const remaining = Object.keys(deps)
  if (remaining.length > 0) {
    console.error('Could not install the following package(s):')
    for (const pkg of remaining) {
      console.error('-', pkg, '->', deps[pkg].join(' '))
    }
    console.error('Setup failed')
  } else {
    console.info('Setup complete')
  }
}

const readConfig = async (configFile) => {
  console.info('Reading', configFile, '...')
  let configStr, filename
  if (isUrl(configFile)) {
    configStr = (await got(configFile)).body
    filename = configFile
  } else {
    configFile = fsp.readFile(configFile, 'utf8')
    filename = url.parse(configFile).pathname
  }
  const ext = path.extname(filename)
  const isYaml = (['.yml', '.yaml'].indexOf(ext) >= 0)
  return isYaml ? yaml.safeLoad(configStr) : JSON.parse(configStr)
}

const main = async (configFile) => {
  config = await readConfig(configFile)
  console.info('Setting up ...')
  for (const pkg of config.packages) {
    await cloneOrPull(pkg)
  }
  const deps = await getDependencies()
  await installAll(deps)
  checkResult(deps)
}

;(async () => {
  await main(...argv._)
})().catch((err) => console.error(err.stack || err))
