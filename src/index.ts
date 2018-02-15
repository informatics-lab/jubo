import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';

import '../style/index.css';
import { DOMElement } from 'react';
import { Message } from '@phosphor/messaging';


class XkcdWidget extends Widget {
  img: HTMLImageElement;

  constructor() {
    super();
    this.id = 'xkcd-jupyterlab';
    this.title.label = 'xkcd.com';
    this.title.closable = true;
    this.addClass('jp-xkcdWidget');

    this.img = document.createElement('img');
    this.img.className = 'jp-xkcdCartoon';
    this.node.appendChild(this.img);

    this.img.insertAdjacentHTML('afterend',
      `<div class="jp-xkcdAttribution">
      <a href="https://creativecommons.org/licenses/by-nc/2.5/" class="jp-xkcdAttribution" target="_blank">
        <img src="https://licensebuttons.net/l/by-nc/2.5/80x15.png" />
      </a>
    </div>`
    );
  }

  onUpdateRequest(msg: Message): void {
    fetch('https:////egszlpbmle.execute-api.us-east-1.amazonaws.com/prod').then(response => {
      return response.json();
    }).then(data => {
      this.img.src = data.img;
      this.img.alt = data.title;
      this.img.title = data.alt;
    });
  }
}


function activate(app: JupyterLab, palette: ICommandPalette) {
  console.log('JupyterLab extension xkcd_ext is activated!');
  let widget: XkcdWidget = new XkcdWidget();
  const command: string = 'xkcd:open';
  app.commands.addCommand(command, {
    label: 'Random xkcd commic',
    execute: () => {
      if (!widget.isAttached) {
        app.shell.addToMainArea(widget);
      }
      app.shell.activateById(widget.id);
    }
  })
  palette.addItem({ command: command, category: "Tutorial" });
}


/**
 * Initialization data for the xkcd_ext extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'xkcd_ext',
  autoStart: true,
  requires: [ICommandPalette],
  activate: activate
};

export default extension;
