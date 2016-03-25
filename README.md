# Hampster

[![npm](https://img.shields.io/npm/v/hampster.svg)](https://www.npmjs.com/package/hampster) [![Dependencies](https://img.shields.io/david/timdp/hampster.svg)](https://david-dm.org/timdp/hampster) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

Installs and links interdependent npm packages.

![Hampster](hampster.gif) ![Hampster](hampster.gif) ![Hampster](hampster.gif) ![Hampster](hampster.gif) ![Hampster](hampster.gif)

## Installation

```bash
npm i -g hampster
```

## Configuration

Put your package information in `hampster.json`:

```bash
{
  "packages": [
    {
      "name": "package-name-1",
      "repository": "git@bitbucket.org:you/package-name-1.git"
    },
    {
      "name": "package-name-2",
      "repository": "git@github.com:you/package-name-2.git"
    }
  ]
}
```

## Usage

```bash
cd /path/to/projects
hampster /path/to/hampster.json
```

This will make Hampster do the following:

 1. For every package defined in `hampster.json`, check if a directory by that
    `name` already exists in the current working directory. If no such directory
    exists, perform a `git clone` on the `repository`.
 2. For every package, run `npm install` and `npm link` inside its repository.
 3. For every package, inspect its `package.json` to build a dependency tree.
 4. Walk the dependency tree and run `npm link <dependencies>` where possible.

## Options

### `--pull`

Perform a `git pull` for previously cloned repositories.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
