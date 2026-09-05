[![Prettier Banner](https://unpkg.com/prettier-logo@1.0.3/images/prettier-banner-light.svg)](https://prettier.io)

<h2 align="center">Opinionated Code Formatter</h2>

<p align="center">
  <em>
    JavaScript
    · TypeScript
    · Flow
    · JSX
    · JSON
  </em>
  <br />
  <em>
    CSS
    · SCSS
    · Less
  </em>
  <br />
  <em>
    HTML
    · Vue
    · Angular
  </em>
  <br />
  <em>
    GraphQL
    · Markdown
    · YAML
  </em>
  <br />
  <em>
    <a href="https://prettier.io/docs/plugins">
      Your favorite language?
    </a>
  </em>
</p>

<p align="center">
  <a href="https://github.com/prettier/prettier/actions?query=branch%3Amain">
    <img alt="CI Status" src="https://img.shields.io/github/check-runs/prettier/prettier/main?style=flat-square&label=CI"></a>
  <a href="https://codecov.io/gh/prettier/prettier">
    <img alt="Coverage Status" src="https://img.shields.io/codecov/c/github/prettier/prettier.svg?style=flat-square"></a>
  <a href="https://x.com/acdlite/status/974390255393505280">
    <img alt="Blazing Fast" src="https://img.shields.io/badge/speed-blazing%20%F0%9F%94%A5-brightgreen.svg?style=flat-square"></a>
  <br/>
  <a href="https://www.npmjs.com/package/prettier">
    <img alt="npm version" src="https://img.shields.io/npm/v/prettier.svg?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/prettier">
    <img alt="weekly downloads from npm" src="https://img.shields.io/npm/dw/prettier.svg?style=flat-square"></a>
  <a href="https://github.com/prettier/prettier#badge">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://x.com/intent/follow?screen_name=PrettierCode">
    <img alt="Follow Prettier on X" src="https://img.shields.io/badge/%40PrettierCode-9f9f9f?style=flat-square&logo=x&labelColor=555"></a>
</p>
# WordPress Prettier

This is a fork of Prettier that adds a new command line option `--paren-spacing` which inserts many extra spaces inside parentheses, the way how projects in the WordPress ecosystem (Calypso, Gutenberg, etc.) like to format their code.

In order to install the latest version, run

```sh
npm i --save-dev "prettier@npm:wp-prettier@latest"
```

To order to install a version based on a particular upstream version (like 1.x.x), run

```sh
npm i --save-dev "prettier@git+https://github.com/Automattic/wp-prettier.git#wp-prettier-1.x.x"
```

To figure out what the latest supported version of the fork is, look at the default branch of this repository.

## Versioning

This project uses the following convention for versions:

- When there is a new version of prettier (eg: `prettier@2.0.5`), we'll rebase our changes on top of it and release as `wp-prettier@2.0.5-beta-1`.
- If we found bugs, we'll release `wp-prettier@2.0.5-beta-2` and so on.
- When we are confident our patch doesn't break we'll release it as `wp-prettier@2.0.5`.
- If we found bugs after the release, we'll release them as `wp-prettier@2.0.6-alpha-1`, `wp-prettier@2.0.6-alpha-2`...

The rationale is to ensure the version ordering gives you the latest patch. If you have a dependency on `wp-prettier@^2.0.0` you will get the following versions in order:

- `wp-prettier@2.0.5-alpha-1` -> contains `prettier@2.0.4` + patch
- `wp-prettier@2.0.5-alpha-N` -> contains to `prettier@2.0.4` + patch + fixes (if any)
- `wp-prettier@2.0.5-beta-1` -> contains to `prettier@2.0.5` + patch
- `wp-prettier@2.0.5-beta-1` -> contains to `prettier@2.0.5` + patch + fixes (if any)
- `wp-prettier@2.0.5` -> contains to `prettier@2.0.5` + final patch

The original readme continues unchanged below:

## Intro

Prettier is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.

### Input

<!-- prettier-ignore -->
```js
foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
```

### Output

```js
foo(
  reallyLongArg(),
  omgSoManyParameters(),
  IShouldRefactorThis(),
  isThereSeriouslyAnotherOne(),
);
```

Prettier can be run [in your editor](https://prettier.io/docs/editors) on-save, in a [pre-commit hook](https://prettier.io/docs/precommit), or in [CI environments](https://prettier.io/docs/cli#list-different) to ensure your codebase has a consistent style without devs ever having to post a nit-picky comment on a code review ever again!

---

**[Documentation](https://prettier.io/docs/)**

[Install](https://prettier.io/docs/install) ·
[Options](https://prettier.io/docs/options) ·
[CLI](https://prettier.io/docs/cli) ·
[API](https://prettier.io/docs/api)

**[Playground](https://prettier.io/playground/)**

---

## Badge

Show the world you're using _Prettier_ → [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

```md
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
