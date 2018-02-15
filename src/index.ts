import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import { ICommandPalette, InstanceTracker } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import {JSONExt} from '@phosphor/coreutils';
import '../style/index.css';
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


function activate(app: JupyterLab, palette: ICommandPalette, restorer:ILayoutRestorer) {
  console.log('JupyterLab extension xkcd_ext is activated!');
  let widget: XkcdWidget;// = new XkcdWidget();
  const command: string = 'xkcd:open';
  app.commands.addCommand(command, {
    label: 'Random xkcd commic',
    execute: () => {
      if(!widget){
        widget = new XkcdWidget();
        widget.update();
      }
      if(!tracker.has(widget)){
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        app.shell.addToMainArea(widget);
      } else {
        widget.update();
      }
      app.shell.activateById(widget.id);
    }
  })
  palette.addItem({ command: command, category: "Tutorial" });

  let tracker = new InstanceTracker<Widget>({namespace:'xkcd'});
  restorer.restore(tracker, {
    command,
    args: () => JSONExt.emptyObject,
    name: () => 'xkcd'
  })
}


/**
 * Initialization data for the xkcd_ext extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'xkcd_ext',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: activate
};

export default extension;
