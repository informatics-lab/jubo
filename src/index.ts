// import viewer from './viewer';
import '../style/index.css';
import {JupyterLabPlugin} from '@jupyterlab/application';
// import buttonPlugin from './button';
import layoutPlugin from './pannel'
console.log('jubo lab plugin version...')
// let plugins:JupyterLabPlugin<void>[] = [viewer, buttonPlugin, layoutPlugin];
let plugins:JupyterLabPlugin<void>[] = [ layoutPlugin];


export default plugins;
