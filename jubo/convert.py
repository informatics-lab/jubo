import nbformat
import uuid
import re
import gfm

prefix_code = """
from bokeh.models.widgets import Div
from bokeh.models.widgets import PreText
from bokeh.layouts import column, row, layout
from bokeh.io import curdoc
from bokeh.models import Model
import bokeh.io
outputs = []
bokeh.io.show = lambda x: outputs.append(x)
bokeh.io.output_notebook = lambda : None
"""

postfix_code = """
print(outputs)
def add_css_class(widget, css_class):
    styles = widget.css_classes
    styles = styles if styles else []
    styles.append(css_class)
    widget.css_classes = styles

widgets = []
for o in [item for item in outputs if item]:
    print("do %s" % o)
    if isinstance(o, Model):
        print("is model")
        widget = o
    elif hasattr(o,'__html__'):
        print("is html")
        widget = Div(text=o.__html__())
    else:
        print("is text")
        widget = PreText(text=str(o))
    widget.sizing_mode = "scale_width"
    add_css_class(widget, 'jubo_widget_row')
    widgets.append(widget)
curdoc().add_root(layout(widgets, sizing_mode='scale_width'))
"""

def skip(*arg, **kwargs):
    return []

def parse_code_cell(cell, app):
    # if len(cell['outputs']) > 1:
    #     raise TypeError("Cant handel cell that has more than one output.\n{}".format(cell))
    
    source = cell['source']
    if len(cell['outputs']) > 0:
        lines = source.split('\n')
        var_name = 'output_cell_{cell_index}'.format(cell_index=cell['index']) # TODO: UID to prevent variable overwrite
        matcher = re.match(r'^([^\s].*)',lines[-1])
        if matcher:
            lines[-1] = "{var} = {code}".format(var=var_name, code=lines[-1])
            lines.append('outputs.append({var})'.format(var=var_name))
        
        source = '\n'.join(lines)
    app['code'].append(source)

def parse_markdown_cell(cell, app):
    html = gfm.markdown(cell['source'])
    # app['outputs'].append({'id':''.format(html)})
    app['code'].append('outputs.append(Div(text="""{html}"""))'.format(html=html))


def convert(filepath):
    
    with open(filepath) as fp:
        nb = nbformat.read(fp, nbformat.current_nbformat)
    
    app = {'code':[], 'outputs':[]}

    for i, cell in enumerate(nb['cells']):
        cell['index'] = i
        parsers = {
            'code':parse_code_cell,
            'markdown':parse_markdown_cell
        }
        method = parsers.get(cell['cell_type'], skip)
        method(cell, app)

    out = ''
    out += prefix_code
    out += '\n'.join(app['code'])
    # out += '\noutputs = [{}]'.format(','.join(o['id'] for o in app['outputs']))
    out += '\n{}'.format(postfix_code)

    print (out)
    return out


        
if __name__ == '__main__':
    import os
    i = os.path.join(os.path.dirname(__file__), '..', 'outputs.ipynb')
    o = os.path.join(os.path.dirname(i), os.path.basename(i) + '.py')

    with open(o, 'w') as fp:
        o.write(convert(i))