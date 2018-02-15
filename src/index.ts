import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {ICommandPalette} from '@jupyterlab/apputils';
import {Widget} from '@phosphor/widgets';

import '../style/index.css';


/**
 * Initialization data for the xkcd_ext extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'xkcd_ext',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterLab, palette:ICommandPalette) => {
    console.log('JupyterLab extension xkcd_ext is activated!');
    let widget:Widget = new Widget();
    widget.id = 'xkcd-jupyterlab';
    widget.title.label = 'xkcd.com';
    widget.title.closable = true;

    let img = document.createElement('img');
    widget.node.appendChild(img);

    fetch('https:////egszlpbmle.execute-api.us-east-1.amazonaws.com/prod').then(response=>{
      return response.json();
    }) .then(data => {
      img.src = data.img;
      img.alt = data .title;
      img.title = data.alt;
    });

    const command:string = 'xkcd:open';
    app.commands.addCommand(command, {
      label: 'Random xkcd commic',
      execute: () => {
        if(!widget.isAttached){
          app.shell.addToMainArea(widget);
        }
        app.shell.activateById(widget.id);
      }
    })

    palette.addItem({command:command, category:"Tutorial"});

  }
};

export default extension;
