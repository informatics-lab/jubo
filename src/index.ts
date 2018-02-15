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
    widget.addClass('jp-xkcdWidget'); 

    let img = document.createElement('img');
    img.className = 'jp-xkcdCartoon'; 
    widget.node.appendChild(img);

    // New: add an attribution badge
    img.insertAdjacentHTML('afterend',
      `<div class="jp-xkcdAttribution">
        <a href="https://creativecommons.org/licenses/by-nc/2.5/" class="jp-xkcdAttribution" target="_blank">
          <img src="https://licensebuttons.net/l/by-nc/2.5/80x15.png" />
        </a>
      </div>`
    );

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
