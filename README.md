
# JuBo

A suite of tools for building and deploying Bokeh apps from Jupyter notebooks using JupyterLabs.

Three main components parts:
* **JuBo Lab** - A JupyterLab extension. Under the `src` directory.
* A Module under the `jubo` directory which consists of:
    * **Jubo Server** - `jubo_server_ext.py` - A JupyterServer extension that works with the lab extension to convert and server Bokeh apps from notebooks and 'deploy' by pushing into an S3 bucket. 
    * **Jubo deployer** - `proxy.py` - A Tornado server that is expecting to run on a Kubernetes cluster. This will spin up, deploy, proxy to and tidy up the bokeh apps built. There is a Helm Chart to deploy this in the `kube` dir.


## Assumptions/external setup requirements

## Installation

pip install git+https://github.com/met-office-lab/jubo.git
jupyter labextension install https://github.com/met-office-lab/jubo.git  

## Development

### Jubo Lab and Jubo Server

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

If developing the lab extention run in watchmode and re-run `npm run build` on changes:

```bash
jupyter lab --NotebookApp.nbserver_extensions="{'jubo.jubo_server_ext':True}" --notebook-dir=example_notebooks --watch
```

If working on server-side drop the watch and quit and restart to see changes. This seems quicker than rebuilding JupyterLab constantly.


```bash
jupyter lab --NotebookApp.nbserver_extensions="{'jubo.jubo_server_ext':True}" --notebook-dir=example_notebooks
```


### Jubo Deployer

Set up `helm` with your kubernetes cluster. Then to install in the namespace `juboapps` as the release `juboapps`

```
helm install --namespace=juboapps --name=juboapps .       
```






