
from bokeh.models.widgets import Div
from bokeh.models.widgets import PreText
from bokeh.layouts import column
from bokeh.io import curdoc
from bokeh.models import Model
import bokeh.io
bokeh.io.show = lambda x: x
output_cell_0 = "hi"
from IPython.display import  HTML
output_cell_3 = HTML("<h1>THIS IS HTML</H1>")
output_cell_4 = 10 * 10 
from datetime import datetime
output_cell_5 = datetime.now()
from bokeh.plotting import figure
from bokeh.io import output_notebook,show 
output_notebook()

p = figure(plot_width=400, plot_height=400)

# add a circle renderer with a size, color, and alpha
p.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)
output_cell_6 = show(p)

outputs = [output_cell_0,Div(text="""<h1>Hi</h1>
<p>This is mark down</p>"""),output_cell_3,output_cell_4,output_cell_5,output_cell_6]

widgets = []
for o in outputs:
    if isinstance(o, Model):
        widget = o
    elif hasattr(o,'__html__'):
        widget = Div(text=o.__html__())
    else:
        widget = PreText(text=str(o))
    widgets.append(widget)

curdoc().add_root(column(*widgets))
