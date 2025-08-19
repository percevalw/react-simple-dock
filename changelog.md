## v0.2.0

- Pret: Refacto for pret>=v0.2.0
- API: allow config init shorthands that do not require sizes or orientation:
    ```python
    Layout(
      ...,
      default_config={
        "kind": "row",
        "children": [
            "description",
            {"children": ["notes", "entities"]},
            "note_text",
        ],
      },
    )
    ```
- UI: make the scrollbar auto instead of always visible

## v0.1.4

- Fixed a bug that prevents resizing a panel in a column whose first children is a row container.
- Default to thin border for panel content.

## v0.1.2

Now wraps the layout into a drag and drop context by default.

## v0.1.1

Minor fix to support dropping a panel on every side of the top-level container.

## v0.1.0

Inception !

At this point, we support:

- nested panels and containers
- drag and drop of panels
- tabs
- reordering of tabs
- header customization
