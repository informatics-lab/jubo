import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
 * Initialization data for the xkcd_ext extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'xkcd_ext',
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log('JupyterLab extension xkcd_ext is activated!');
  }
};

export default extension;
