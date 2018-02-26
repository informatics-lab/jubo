# Stuff I've done 
```pip install gfm
jupyter lab --NotebookApp.nbserver_extensions="{'jubo.hello':True}" 
 python jubo/convert.py && bokeh serve outputs.ipynb.py         
```


# JuBo

A JupyterLab and server extension to create bokeh apps.


## Prerequisites

* JupyterLab

## Installation

TBC

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

If developing the lab extention run in watchmode and re-run `npm run build` on changes:

```bash
jupyter lab --NotebookApp.nbserver_extensions="{'jubo.hello':True}" --no-browser --watch
```

If working on server-side drop the watch and quit and restart to see changes.


```bash
jupyter lab --NotebookApp.nbserver_extensions="{'jubo.hello':True}" --no-browser
```





