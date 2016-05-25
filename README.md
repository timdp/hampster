# Hampster

[![npm](https://img.shields.io/npm/v/hampster.svg)](https://www.npmjs.com/package/hampster) [![Dependencies](https://img.shields.io/david/timdp/hampster.svg)](https://david-dm.org/timdp/hampster) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

Clones, installs, and links interdependent npm packages.

![Hampster](hampster.gif) ![Hampster](hampster.gif) ![Hampster](hampster.gif) ![Hampster](hampster.gif) ![Hampster](hampster.gif)

## Installation

```bash
npm i -g hampster
```

## Configuration

Put your package information in `hampster.json`:

```json
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

You can also use YAML format, with `.yml` or `.yaml` as the extension.

## Usage

In the **root directory** where you want your packages to live, run:

```bash
hampster /path/to/hampster.json
```

Hampster can also download `hampster.json` for you:

```bash
hampster https://example.com/path/to/hampster.json
```

This command will make Hampster do the following:

1.  For every package defined in `hampster.json`, check if a directory by that
    `name` already exists in the current working directory. If no such directory
    exists, perform a `git clone --recursive` on the `repository`.

2.  For every package, run `npm link` inside its repository.

3.  For every package, inspect its `package.json` to build a dependency tree.

4.  Walk the dependency tree and run `npm link <dependencies>` where possible.

## Options

### `--pull`

Perform a `git pull` for previously cloned repositories. The remote and branch
are never specified, so Git will decide.

### `--rebase`

Like `--pull`, but using `git pull --rebase`.

### `--no-recursive`

Perform `git clone` without the `--recursive` flag and `git pull` without the
`--recurse-submodules` flag.

### `--version`

Display Hampster's version number.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
