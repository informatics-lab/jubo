import xkcd from './xkcd';
import button from './button';
import {JupyterLabPlugin} from '@jupyterlab/application';

let plugins:JupyterLabPlugin<void>[] = [xkcd, button];
console.log('return two plug-ins');

export default plugins;
