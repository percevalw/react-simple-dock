
import sys
from typing import Any, Union
from pret.render import stub_component
from pret.bridge import make_stub_js_module, js, pyodide

make_stub_js_module("SimpleDock", "react-simple-dock", __name__)

__version__ = "0.1.1"

if sys.version_info >= (3, 8):
    from typing import Literal
else:
    from typing_extensions import Literal

props_mapping = {
 "default_config": "defaultConfig",
 "wrap_dnd": "wrapDnd"
}

@stub_component(js.SimpleDock.Layout, props_mapping)
def Layout(*children, key: Union[str, int], default_config: Any, wrap_dnd: Any):
    """"""
@stub_component(js.SimpleDock.Panel, props_mapping)
def Panel(*children, key: Union[str, int], name: str, header: Union[str, int, float, Any, bool]):
    """"""


