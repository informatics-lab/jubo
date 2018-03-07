from bokeh.io import show

def noshow(*args, **kwargs):
    return show(*args, **kwargs)