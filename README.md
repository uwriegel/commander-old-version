# Commander

## How this project was created
### Electron
```
npx create-electron-app commander
```

First time calling ```npx create-electron-app```:

```
Need to install the following packages:
  create-electron-app
Ok to proceed? (y) 
```

Publishing git:

"Publish in Github" in Visual Studio Code down left

### Vue
```sudo npm i -g @vue/cli``` (if not installed)

```vue create commander``` in another directory!

```
Manually select features
* Choose Vue Version
* Typescript

* 2.x

* Class style component syntax
```

### Merge Vue and Electron
merge package.json
merge .gitignore

rename src to electron and adapt scripts

Import tsconfig.json ans .browserlistrc, src and public

Delete node_modules and type ```npm i```



ignore="docs/.*|dev/.*|somefile\.js"