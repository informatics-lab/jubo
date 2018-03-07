import {
JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import {NotebookPanel} from '@jupyterlab/notebook';
import {DocumentManager} from '@jupyterlab/docmanager';
import {/* Widget, */ SplitPanel} from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';

import {/* Notebook, */ /* NotebookWidgetFactory, */ NotebookModelFactory} from '@jupyterlab/notebook';

import { each } from '@phosphor/algorithm'
  
  import {JuBoLayoutWidgetFactory} from  './layoutWidget';

  import {
    DocumentRegistry
  } from '@jupyterlab/docregistry';

const NOTEBOOK = 'Simple.ipynb'


class JuboLayoutWidget extends SplitPanel {
    private container: HTMLDivElement;
    private docManager:DocumentManager;
  
    constructor(docManager:DocumentManager) {
      super();
      this.docManager = docManager;
      this.orientation = 'horizontal';
      this.spacing = 0;
      this.id = 'jubo-jupyterlab';
      this.title.label = 'Notebook as Bokeh app';
      this.title.closable = true;
      this.addClass('jp-juboWidget');
      this.container = document.createElement('div');
      this.container.className = 'jp-juboContainer';
      this.node.appendChild(this.container);
      (<any>window).widget  = this;
      
    }

    onAfterAttach(msg:Message) {
        super.onAfterAttach(msg);
        console.log('AFTER ATTACH')
        let nbWidget = this.docManager.open(NOTEBOOK) as NotebookPanel;
        SplitPanel.setStretch(nbWidget, 1);
        this.addWidget(nbWidget);
        // Attach the panel to the DOM.
        //Widget.attach(panel, document.body);
    }
}


function activate(app: JupyterLab, palette: ICommandPalette, restorer:ILayoutRestorer) {
    console.log('JupyterLab extension JuBo Layout is activated!');

    // Is this the way to do servie managers...
    // let manager = new ServiceManager();
    // manager.ready.then(() => {
    //   createApp(manager);
    // });

    let docRegistry = new DocumentRegistry();
    let docManager = new DocumentManager({
        registry:  docRegistry,
        manager:  app.serviceManager,
        opener: { open: (widget)=> {}}
    });

    let copyWidgetExtensions = () => { // TODO: Maybe called many times and just keep appying same extensions
        each(app.docRegistry.widgetExtensions('notebook'),(ext)=>{
            docRegistry.addWidgetExtension('notebook', ext)
        })
    }

    app.docRegistry.changed.connect((sender:DocumentRegistry, args:DocumentRegistry.IChangedArgs)=>{
        console.log("doc Reg change: ", args.change, args.name, args.type)
        if(args.type == 'widgetExtension' && args.name == 'notebook' && args.change == 'added'){
            copyWidgetExtensions()
        }
    });

    copyWidgetExtensions(); 

    (window as any).docReg = app.docRegistry
    console.log(app.docRegistry.widgetExtensions('Notebook'))
    
    // let rendermime = new RenderMimeRegistry({ initialFactories });
    // let contentFactory = new NotebookPanel.ContentFactory();
    let wFactory = new JuBoLayoutWidgetFactory({
        name: 'Notebook',
        modelName: 'notebook',
        fileTypes: ['notebook'],
        defaultFor: ['notebook']
    });
    docRegistry.addModelFactory(new NotebookModelFactory({}));
    docRegistry.addWidgetFactory(wFactory);

    console.log('create a panel...')
    let widget = new JuboLayoutWidget(docManager);
    const command: string = 'jubo:layout';
    app.commands.addCommand(command, {
      label: 'JuBo app edit layout',
      execute: () => {
        if (!widget.isAttached) {
          app.shell.addToMainArea(widget);
        } 
        app.shell.activateById(widget.id);
      }
    })
    palette.addItem({ command: command, category: "A JuBo" });

  }
  
  
  /**
   * Initialization data for the jubo_lab extension.
   */
  const extension: JupyterLabPlugin<void> = {
    id: 'jubo_pannel',
    autoStart: true,
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activate
  };

  export default extension;