import {
    IDisposable, DisposableDelegate
  } from '@phosphor/disposable';
  
  import {
    JupyterLab, JupyterLabPlugin
  } from '@jupyterlab/application';
  
  import {
    ToolbarButton
  } from '@jupyterlab/apputils';
  
  import {
    DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import {
    NotebookActions, NotebookPanel, INotebookModel
  } from '@jupyterlab/notebook';

  
  
  /**
   * The plugin registration information.
   */
  const plugin: JupyterLabPlugin<void> = {
    activate,
    id: 'my-extension-name:buttonPlugin',
    autoStart: true
  };
  
  
  /**
   * A notebook widget extension that adds a button to the toolbar.
   */
  export
  class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    /**
     * Create a new extension object.
     */
    createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
      let callback = () => {
          console.log('run all now!');
        NotebookActions.runAll(panel.notebook, context.session);
      };
      let button = new ToolbarButton({
        className: 'myButton',
        onClick: callback,
        tooltip: 'Run All'
      });
  
      let i = document.createElement('i');
      i.classList.add('fa', 'fa-fast-forward');
      button.node.appendChild(i);
  
      panel.toolbar.insertItem(0, 'runAll', button);
      return new DisposableDelegate(() => {
        button.dispose();
      });
    }
  }
  
  /**
   * Activate the extension.
   */
  function activate(app: JupyterLab) {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
  };
  
  
  /**
   * Export the plugin as default.
   */
  export default plugin;