import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import { ICommandPalette, InstanceTracker } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import {JSONExt} from '@phosphor/coreutils';
import '../style/index.css';
import { Message } from '@phosphor/messaging';


class JuboWidget extends Widget {
  container: HTMLDivElement;
  select:HTMLSelectElement;
  script:HTMLScriptElement;

  constructor() {
    super();
    this.id = 'jubo-jupyterlab';
    this.title.label = 'Notebook as Bokeh app';
    this.title.closable = true;
    this.addClass('jp-juboWidget');
    this.script = document.createElement("script");

    this.container = document.createElement('div');
    this.container.className = 'jp-juboContainer';
    this.select = document.createElement('select')
    this.node.appendChild(this.select);
    this.node.appendChild(this.container);
    this.updateSelect();
    this.select.addEventListener('change', (e) => this.renderNotebook(e));
    this.select.value = '';
  }

  renderNotebook(e:Event):void{
    let path = this.select.value;
    this.clearDocument();
    if(!path){
      return
    }
    fetch('../jubo/app/' + path).then(response => {
      return response.json();
    }).then( data => {
      
      let s = document.createElement( 'script' );
      let t = document.createElement('template');
      t.innerHTML = data.script.trim();
      let attributes = t.content.firstChild.attributes;
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        s.setAttribute(attr.name, attr.value);
      }
      console.log(s);
      this.container.appendChild( s );
    });
  }
  clearDocument():void {
    this.container.innerHTML = "";
  }
  updateSelect():void {
    fetch('../jubo/list').then(response => {
      return response.json();
    }).then(data => {
      while (this.select.firstChild) {
        this.select.removeChild(this.select.firstChild);
      }
      [''].concat(data).forEach((path:string) => {
        let opt = document.createElement('option');
        opt.value = path;
        opt.innerText = path;
        this.select.appendChild(opt);
      });
    })
  }

  onUpdateRequest(msg: Message): void {
    this.updateSelect();
  }
}


function activate(app: JupyterLab, palette: ICommandPalette, restorer:ILayoutRestorer) {
  console.log('JupyterLab extension jubo is activated!');
  let widget: JuboWidget;// = new XkcdWidget();
  const command: string = 'xkcd:open';
  app.commands.addCommand(command, {
    label: 'Random xkcd commic',
    execute: () => {
      if(!widget){
        widget = new JuboWidget();
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
