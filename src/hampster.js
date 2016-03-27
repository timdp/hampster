#!/usr/bin/env node

import 'source-map-support/register'
import stamp from 'console-stamp'
import crossSpawn from 'cross-spawn-promise'
import got from 'got'
import isUrl from 'is-url'
import yargs from 'yargs'
import fsp from 'fs-promise'
import path from 'path'

stamp(console)

const root = process.cwd()

const argv = yargs
  .demand(1)
  .boolean('pull')
  .argv

let config

const spawn = (cmd, args, cwd) => {
  console.info('Running', cmd, ...args, 'in', cwd, '...')
  return crossSpawn(cmd, args, {cwd})
}

const isDir = async (dirPath) => {
  try {
    return (await fsp.stat(dirPath)).isDirectory()
  } catch (err) {
    return false
  }
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
  config = isUrl(configFile)
    ? (await got(configFile, {json: true})).body
    : await fsp.readJson(configFile)
}

const main = async (configFile) => {
  await readConfig(configFile)
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
