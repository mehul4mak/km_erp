{
    "name": "Make-to-Stock Planning (Net Requirements)",
    "version": "17.0.1.0.0",
    "summary": "On order confirm, reserve finished goods from stock and manufacture only the shortfall",
    "description": """
Nets sales demand against finished-goods stock. Finished products no longer
carry the make-to-order route; instead, when an order is confirmed this module
reserves what's on the shelf and raises a manufacturing order for the shortfall
only. If stock fully covers the order, no job is created at all. The shortfall
MO still cascades to its sub-assembly jobs and component purchases as before.
    """,
    "author": "KMatrix AI",
    "category": "Manufacturing",
    "depends": ["sale_management", "mrp", "sale_mrp"],
    "data": [],
    "license": "LGPL-3",
    "installable": True,
}
