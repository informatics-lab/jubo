import viewer from './viewer';
import {JupyterLabPlugin} from '@jupyterlab/application';

let plugins:JupyterLabPlugin<void>[] = [viewer];
console.log('return two plug-ins');

export default plugins;
