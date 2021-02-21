<h1 align="center">Blazepack ⚡</h1>

<p align="center">
  Blazing fast dev server powered by <a href="https://www.npmjs.com/package/smooshpack">sandpack</a>
</p>

## Motivation

I always wanted the super fast feedback that codesandbox provides in my local environment, so I have built a tiny wrapper around the codesandbox bundler sandpack and it runs locally 🎉

## Why Blazepack?

* It is blazing fast ⚡
* Super tiny (24kb) 👌
* Run projects without npm install 💃
* React fast refresh ❤️
* Supports React, Vue 2, Vue 3, Angular, Preact, Svelte 🔨
* Save disk space 💾

## Install

Install it globally

```
npm i -g blazepack
```


## Usage

### Create project from Template

Create your first **create react app**

```
blazepack create my-cra --template=react
```

The available template options are **react, angular, vue2, vue3, preact and svelte**. You can use the below command to create the app and also start the dev server immediately

```
blazepack start my-angular-app --template=angular
```

### Start project

To use it in your existing **create react app**, **angular**, **preact**, **svelte**, **vue cli app** just run

```
blazepack
```

It will start the dev server at port **3000** and open it in browser, you can change the default port by using the **port** option

```
blazepack --port 3001
```

You can also run it using the **npx** command and not install it globally

```
npx blazepack
```

### Install dependency

You can install a new package pretty fast using the below command. It does not create **node_modules** so you are gonna save a lot of space 😉

```
blazepack install redux
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


Show your support by ⭐ the repo

## License

GPL © [Ameer Jhan](mailto:ameerjhanprof@gmail.com)
