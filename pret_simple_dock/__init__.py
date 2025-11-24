
import sys
from typing import Any, Union, List
from pret.render import stub_component
from pret.marshal import make_stub_js_module, js

__version__ = "0.2.2"
_py_package_name = "pret-simple-dock"
_js_package_name = "react-simple-dock"
_js_global_name = "SimpleDock"

make_stub_js_module("SimpleDock", "pret-simple-dock", "react-simple-dock", __version__, __name__)

if sys.version_info >= (3, 8):
    from typing import Literal
else:
    from typing_extensions import Literal

props_mapping = {
 "default_config": "defaultConfig",
 "wrap_dnd": "wrapDnd",
 "collapse_tabs_on_mobile": "collapseTabsOnMobile",
}

@stub_component(js.SimpleDock.Layout, props_mapping)
def Layout(*children, default_config: Any, key: Union[str, int], wrap_dnd: bool, collapse_tabs_on_mobile: Union[bool, List[str]] = True):
    """
    Main layout component that organizes panels and handles drag and drop.
    
    The Layout component takes child panel components, constructs an initial layout configuration,
    and renders the panel structure using NestedPanel. It also wraps the layout in a DndProvider
    if drag and drop support is enabled.
    
    Parameters
    ----------
    default_config: Any
        The default layout configuration to use.
    wrap_dnd: bool
        A boolean flag to enable or disable drag and drop support (default: true).
    collapse_tabs_on_mobile: Union[bool, List[str]]
        A boolean flag to auto collapse tabs on mobile devices (default: true)
        and override the default layout configuration.
        If set to a list of strings, it will show the specified tabs first, and add
        the rest at the end of the tab bar.
"""
@stub_component(js.SimpleDock.Panel, props_mapping)
def Panel(*children, header: Union[str, int, float, Any, bool], key: Union[str, int], name: str):
    """
    A Panel component.
    
    This component represents a Panel within the layout.
    
    Parameters
    ----------
    header: Union[str, int, float, Any, bool]
        The content to render in the panel header.
    name: str
        The unique identifier of the panel.
"""


