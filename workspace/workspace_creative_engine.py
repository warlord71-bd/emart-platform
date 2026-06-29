"""
Import bridge: creative-engine has a hyphen, so Python can't import it directly.
This module re-exports the public API.
"""
import importlib, sys
from pathlib import Path

_pkg = Path(__file__).parent / "content-orchestrator" / "creative-engine"
sys.path.insert(0, str(_pkg.parent))

_api = importlib.import_module("creative-engine.api")

render = _api.render
CreativeRequest = _api.CreativeRequest
CreativeResult = _api.CreativeResult
