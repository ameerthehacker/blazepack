<h1 align="center">Blazepack ⚡</h1>

<p align="center">
  Blazing fast dev server powered by <a href="https://www.npmjs.com/package/smooshpack">sandpack</a>
</p>

<p align="center">
  <a href="https://actions-badge.atrox.dev/ameerthehacker/blazepack/goto?ref=master">
    <img alt="Build Status" src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fameerthehacker%2Fblazepack%2Fbadge%3Fref%3Dmaster&style=flat-square" />
  </a>
  <a href="https://discord.gg/ZP6p5dVwnn">
    <img src="https://img.shields.io/discord/591914197219016707.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  </a>
</p>

## Motivation

I always wanted the super fast feedback that codesandbox provides in my local environment, so I have built a tiny wrapper around the codesandbox bundler sandpack and it runs locally 🎉

## Why Blazepack?

- It is blazing fast ⚡
- Super tiny (24kb) 👌
- Run projects without npm install 💃
- Supports private npm packages 😉
- React fast refresh ❤️
- Supports React, Vue, Angular, Preact, Svelte and more 🔨
- Save disk space 💾

## Install

Install it globally

```
npm i -g blazepack
```

You can also use the [blazepack vscode extension](https://marketplace.visualstudio.com/items?itemName=ameerthehacker.blazepack-vscode)

## Usage

### Create project from Template

Create your first **create react app**

```
blazepack create my-cra --template=react

# create the app and also start the dev server

blazepack create my-angular-app --template=angular --open
```

<details>
  <summary>
    Available Templates
  </summary>
  <ul>
    <li>static</li>
    <li>react</li>
    <li>react-ts</li>
    <li>react-native-web</li>
    <li>vanilla</li>
    <li>preact</li>
    <li>vue2</li>
    <li>vue3</li>
    <li>angular</li>
    <li>svelte</li>
    <li>reason</li>
    <li>cxjs</li>
    <li>dojo</li>
  </ul>
</details>

### Start project

To use it in your existing **create react app**, **angular**, **preact**, **svelte**, **vue cli app** just run

```
blazepack start
```

It will start the dev server at port **3000** and open it in browser, you can change the default port by using the **port** option

```
blazepack start --port 3001
```

You can also run it using the **npx** command and not install it globally

```
npx blazepack start
```

### Install dependency

You can install a new package pretty fast using the below command. It does not create **node_modules** so you are gonna save a lot of space 😉

```
blazepack install redux

# or

blazepack add redux
```

### Remove dependency

You can quickly remove a unused dependency by running following command:

```
blazepack remove redux

# or

blazepack uninstall redux
```

### Check version

To know the version of blazepack you are running use the **--version** option

```
blazepack --version
```

### Clone Sandbox

You can clone an existing codesandox, by just running the below commands:

**Clone from URL**

```
blazepack clone https://codesandbox.io/s/use-undo-redo-yrts1
```

**Cloning from embed url**

```
blazepack clone https://codesandbox.io/embed/use-undo-redo-yrts1
```

**Clone from Sandbox Id**

```
blazepack clone use-undo-redo-yrts1
```

### Export to [codesandbox.io](https://codesandbox.io)

You can export your current project to codesandbox for sharing with your friends in a jiffy

```
blazepack export

# use --open option to also open the newly created sandbox in a browser tab

blazepack export --open
```

### Private npm packages

We honour the project level `.npmrc` file and if it is not found we fallback to user level `.npmrc` file and then finally the global `.npmrc` file. Currently we only support scoped private npm packages. To use the scoped private npm packages you need to fist login into the npm registry and add the scope config to `.npmrc`

```ini
@myorg:registry=https://registry.myorg.com
//registry.myorg.com/:_authToken=secrettoken
```

### Aliases for blazepack

We create two more alias for blazepack to help you with lesser typing 😇

```
bpk create my-cra

# or

blaze create my-cra
```

### Help

You can know more about the available commands and their options using the help command

```
blazepack --help

# get help on individual command

blazepack start --help
```

### Facing issues?

Run blazepack in verbose mode and share the log by raising an issue

```
blazepack start --verbose > blazepack.log
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://ameerthehacker.me/"><img src="https://avatars.githubusercontent.com/u/15448192?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ameer Jhan</b></sub></a><br /><a href="https://github.com/ameerthehacker/blazepack/commits?author=ameerthehacker" title="Code">💻</a> <a href="https://github.com/ameerthehacker/blazepack/commits?author=ameerthehacker" title="Documentation">📖</a> <a href="https://github.com/ameerthehacker/blazepack/issues?q=author%3Aameerthehacker" title="Bug reports">🐛</a> <a href="#ideas-ameerthehacker" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://bit.ly/jyash97"><img src="https://avatars.githubusercontent.com/u/22376783?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Yash Joshi</b></sub></a><br /><a href="https://github.com/ameerthehacker/blazepack/commits?author=jyash97" title="Code">💻</a> <a href="https://github.com/ameerthehacker/blazepack/commits?author=jyash97" title="Documentation">📖</a> <a href="https://github.com/ameerthehacker/blazepack/issues?q=author%3Ajyash97" title="Bug reports">🐛</a> <a href="#ideas-jyash97" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/philipjmurphy"><img src="https://avatars.githubusercontent.com/u/1055915?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Philip Murphy</b></sub></a><br /><a href="https://github.com/ameerthehacker/blazepack/commits?author=philipjmurphy" title="Code">💻</a> <a href="https://github.com/ameerthehacker/blazepack/issues?q=author%3Aphilipjmurphy" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/sahilrajput03"><img src="https://avatars.githubusercontent.com/u/31458531?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sahil Rajput</b></sub></a><br /><a href="https://github.com/ameerthehacker/blazepack/commits?author=sahilrajput03" title="Documentation">📖</a> <a href="#ideas-sahilrajput03" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://dhruwlalan.github.io/"><img src="https://avatars.githubusercontent.com/u/64348100?v=4?s=100" width="100px;" alt=""/><br /><sub><b>dhruw lalan</b></sub></a><br /><a href="https://github.com/ameerthehacker/blazepack/commits?author=dhruwlalan" title="Code">💻</a> <a href="https://github.com/ameerthehacker/blazepack/issues?q=author%3Adhruwlalan" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/saideepesh000"><img src="https://avatars.githubusercontent.com/u/43727167?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sai Deepesh</b></sub></a><br /><a href="#ideas-saideepesh000" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ameerthehacker/blazepack/commits?author=saideepesh000" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

Show your support by ⭐ the repo

## License

GPL © [Ameer Jhan](mailto:ameerjhanprof@gmail.com)
