{
    "name": "Manufacturing Cost Sheet to Quotation",
    "version": "17.0.1.0.0",
    "summary": "Roll up multi-level BOM cost and apply rejection % + profit % to drive quotation pricing",
    "description": """
Adds a cost-sheet layer on top of Odoo BOMs:
- Rejection/overhead % and target profit % per BOM
- Computes BOM material cost (multi-level) -> adds rejection -> adds profit -> suggested sale price
- One-click push of the computed price onto the product, ready for quotations
Modeled on the client's existing Excel cost sheet (subtotal -> +2% rejection -> +7% profit).
    """,
    "author": "Mehul",
    "category": "Manufacturing",
    "depends": ["mrp", "sale_management"],
    "data": ["views/mrp_bom_views.xml"],
    "application": True,
    "installable": True,
    "license": "LGPL-3",
}
