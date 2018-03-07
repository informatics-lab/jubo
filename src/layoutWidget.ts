
import { ABCWidgetFactory } from '@jupyterlab/docregistry';
import { Panel, Widget } from '@phosphor/widgets';
import { INotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { each } from '@phosphor/algorithm'
import { CodeCell, MarkdownCell, RawCell, IRawCellModel, IMarkdownCellModel, ICodeCellModel, ICellModel } from '@jupyterlab/cells'
import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import * as dragula from 'dragula'
const JUBO_PANEL_CLASS = 'jubo-layout-panel';

// const OUTPUT_AREA_CLASS = 'jubo-output-area';
const INPUT_AREA_CLASS = 'jubo-input-area';
const VIEW_ELEMENT_CLASS = 'jubo-view-element';
const ROW_CLASS = 'jubo-layout-row';
const HIDDEN_ROW_CLASS = 'jubo-layout-hidden';

export
    class JuboNotebookLayoutWidget extends Panel implements DocumentRegistry.IReadyWidget {
    ready: Promise<void>;
    rows: HTMLDivElement[] = [];
    hidden: HTMLDivElement;
    rendermime = new RenderMimeRegistry({ initialFactories });
    constructor(context: DocumentRegistry.IContext<INotebookModel>) {
        super()
        this.addClass(JUBO_PANEL_CLASS);
        console.log('Starting up, maybe not ready.')
        this.ready = context.ready.then(() => {
            console.log('ready now ');
            console.log('New JuboNotebookLayout for file {}', context.contentsModel.name);
            console.log('We`ve got {} cells', context.model.cells.length);
            this._build(context);
        })
    }

    _build(context: DocumentRegistry.IContext<INotebookModel>): void {
       
        each(context.model.cells, (cell) => {
            let row = document.createElement('div');
            row.classList.add(ROW_CLASS);

            this.rows.push(row)
            for (const widget of this._makeCells(cell)) {
                row.appendChild(widget.node);
            }
            this.node.appendChild(row);


        });
        this.hidden = document.createElement('div');
        this.hidden.classList.add(ROW_CLASS)
        this.hidden.classList.add(HIDDEN_ROW_CLASS)
        this.node.appendChild(this.hidden);
        dragula(this.rows.concat(this.hidden),{direction:'horizontal' , mirrorContainer:this.node });
    }



    _makeCells(cell: ICellModel) {
        let widget: Widget;
        let editorConfig = { readonly: true, lineNumbers: false };
        
        // let output: Widget = null;
        let widgets: Widget[] = [];
        switch (cell.type) {
            case 'code':
                let codeCell = new CodeCell({ model: (cell as ICodeCellModel), editorConfig, rendermime:this.rendermime });
                codeCell.ready.then(()=>{
                    codeCell.update();
                })
                // TODO: Currently 'discarding code' 
                widget = codeCell.outputArea as Widget;
                // output = codeCell.outputArea;
                break;
            case 'markdown':
                let mdCell = new MarkdownCell({ model: (cell as IMarkdownCellModel), editorConfig, rendermime:this.rendermime });
                mdCell.ready.then(()=>{
                    console.log('update, render, etc')
                    mdCell.rendered = true
                    mdCell.update()
                })
                widget = mdCell;
                break;
            default:
                widget = new RawCell({ model: cell as IRawCellModel, editorConfig });
        }
        //let input = widget.inputArea;
        widget.addClass(INPUT_AREA_CLASS)
        widget.addClass(VIEW_ELEMENT_CLASS)
        widgets.push(widget)
        // if (output) {
        //     output.addClass(OUTPUT_AREA_CLASS)
        //     output.addClass(VIEW_ELEMENT_CLASS);
        //     widgets.push(output);
        // }
        return widgets
    }

}

export
    class JuBoLayoutWidgetFactory extends ABCWidgetFactory<JuboNotebookLayoutWidget, INotebookModel> {
    createNew(context: DocumentRegistry.IContext<INotebookModel>) {
        console.log('New from factory with context', context);
        return new JuboNotebookLayoutWidget(context)
    }

    createNewWidget(context: DocumentRegistry.IContext<INotebookModel>) {

        console.log('New widget from factory', context);
        return new JuboNotebookLayoutWidget(context)
    }
}